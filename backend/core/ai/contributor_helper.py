import os

from core.database import get_db_client

# Try to import Langchain components
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate
except ImportError:
    pass


def _search_repo_embeddings(repo_full_name: str, question: str, match_count: int = 5, match_threshold: float = 0.4):
    """
    Performs a semantic search in Supabase pgvector using the match_repo_embeddings RPC.
    Returns a list of matching content chunks with similarity scores.
    """
    client = get_db_client()
    if not client:
        print("[RAG] No Supabase client available. Cannot search embeddings.")
        return []

    # Generate embedding for the user's question
    embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    query_embedding = embeddings_model.embed_query(question)

    try:
        result = client.rpc("match_repo_embeddings", {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count,
            "filter_repo_name": repo_full_name,
        }).execute()

        matches = result.data or []
        print(f"[RAG] Found {len(matches)} matching chunks for '{question[:50]}...' in {repo_full_name}")
        return matches

    except Exception as e:
        print(f"[RAG] Error during Supabase vector search: {e}")
        return []


def synthesize_answer(repo_full_name: str, question: str) -> str:
    """
    RAG Implementation using Supabase pgvector + Gemini API.
    
    1. Searches Supabase repo_embeddings for relevant documentation chunks
    2. Feeds them to Gemini to synthesize a grounded answer
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("⚠ WARNING: GOOGLE_API_KEY not set. Returning stub RAG answer.")
        return (
            "*I am RepoMind, your AI maintainer. I've classified this as a question!* "
            "\n\n(Stub Mode: Please configure a GOOGLE_API_KEY in your environment to see actual Gemini-powered responses)."
        )

    try:
        # 1. Semantic search via Supabase pgvector
        matches = _search_repo_embeddings(repo_full_name, question)

        if not matches:
            return (
                "I searched the documentation but couldn't find any relevant context for your question. "
                "A human maintainer should be able to help!\n\n"
                "*— RepoMind AI (No matching docs found)*"
            )

        # 2. Build context from matched chunks
        context_parts = []
        for i, match in enumerate(matches, 1):
            similarity = match.get("similarity", 0)
            content = match.get("content", "")
            context_parts.append(f"[Chunk {i} | Similarity: {similarity:.2f}]\n{content}")

        context = "\n\n---\n\n".join(context_parts)

        # 3. Setup Gemini LLM with a RAG prompt
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.3,
            google_api_key=api_key,
        )

        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template=(
                "You are RepoMind, an AI repository maintainer. "
                "Answer the contributor's question using ONLY the documentation context below. "
                "If the context doesn't contain enough info, say so honestly.\n\n"
                "--- Documentation Context ---\n{context}\n\n"
                "--- Contributor Question ---\n{question}\n\n"
                "Provide a helpful, concise answer:"
            ),
        )

        chain = LLMChain(llm=llm, prompt=prompt)

        # 4. Execute Gemini RAG
        print(f"[GEMINI_RAG] Querying for repo {repo_full_name}...")
        answer = chain.run(context=context, question=question)

        source_count = len(matches)
        return f"{answer}\n\n*— Answer synthesized by RepoMind using Gemini 1.5 Flash ({source_count} sources from Supabase).*"

    except Exception as e:
        print(f"[GEMINI_RAG] Error during execution: {e}")
        return "I encountered an error trying to search the documentation with Gemini. I'll notify the human maintainers to step in!"

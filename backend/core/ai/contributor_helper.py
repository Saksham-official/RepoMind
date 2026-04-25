import os
import re

from core.database import get_db_client

# Try to import Langchain components
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate
except ImportError:
    pass


def _search_repo_embeddings(repo_full_name: str, question: str, match_count: int = 5, match_threshold: float = 0.4, **kwargs):
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
            "filter_type": kwargs.get("filter_type")
        }).execute()

        matches = result.data or []
        print(f"[RAG] Found {len(matches)} matching chunks for '{question[:50]}...' in {repo_full_name}")
        return matches

    except Exception as e:
        print(f"[RAG] Error during Supabase vector search: {e}")
        return []


def detect_search_type(question: str) -> str:
    """
    Detects which vector index to search based on the question content.
    Returns one of: 'doc', 'issue', 'commit', 'action'.
    """
    q_lower = question.lower()
    if any(word in q_lower for word in ["duplicate", "similar issue", "reported before", "already reported"]):
        return "issue"
    elif any(word in q_lower for word in ["which issues", "list issues", "open issues", "closed issues"]):
        return "issue"
    elif any(word in q_lower for word in ["commit", "change", "pushed", "fixed by", "who wrote"]):
        return "commit"
    elif any(word in q_lower for word in ["action", "triage", "did you do", "reasoning", "why did you"]):
        return "action"
    return "doc"


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
        # 1. Routing & Search
        search_type = detect_search_type(question)
        print(f"[RAG] Routing query to {search_type.upper()} index for: {repo_full_name}")

        matches = _search_repo_embeddings(repo_full_name, question, filter_type=search_type)

        if not matches:
            source_labels = {
                "doc": "documentation",
                "issue": "past issues",
                "commit": "commit history",
                "action": "AI action logs"
            }
            source_label = source_labels.get(search_type, "knowledge base")

            # Tailored fallback for duplicate queries
            if search_type == "issue" and any(w in question.lower() for w in ["duplicate", "similar", "which issues"]):
                return (
                    "I searched the existing issues but found **no similar or duplicate issues** for this one. "
                    "This appears to be a new, unique report — no action needed on your end!\n\n"
                    "*— RepoMind AI*"
                )

            return (
                f"I searched the repository's {source_label} but didn't find a strong match for your question.\n\n"
                "Here are a few things that might help:\n"
                "- Check the **README** or **docs/** folder for setup and usage guides\n"
                "- Browse [existing issues](../../issues) — a similar question may already be answered\n"
                "- If this is a new or complex question, a human maintainer will follow up shortly\n\n"
                f"*— RepoMind AI*"
            )

        # 2. Build context from matched chunks
        context_parts = []
        for i, match in enumerate(matches, 1):
            similarity = match.get("similarity", 0)
            content = match.get("content", "")
            context_parts.append(f"[Chunk {i} | Similarity: {similarity:.2f}]\n{content}")

        context = "\n\n---\n\n".join(context_parts)

        # 2.5 Knowledge Graph: Find linked context
        from core.ai.graph_agent import get_linked_context
        # Try to extract an entity ID from the question (e.g. #42 or SHA)
        entity_id = None
        entity_type = "issue"
        
        issue_match = re.search(r"#(\d+)", question)
        if issue_match:
            entity_id = issue_match.group(1)
            entity_type = "issue"
        else:
            sha_match = re.search(r"\b([a-f0-9]{7,40})\b", question)
            if sha_match:
                entity_id = sha_match.group(1)
                entity_type = "commit"

        linked_context = ""
        if entity_id:
            # We need repo_id here, but we only have full_name. We'll search by full_name.
            try:
                repo_resp = get_db_client().table("repositories").select("id").eq("owner", repo_full_name.split("/")[0]).eq("repo_name", repo_full_name.split("/")[1]).execute()
                if repo_resp.data:
                    repo_id = repo_resp.data[0]["id"]
                    linked_context = get_linked_context(repo_id, entity_id, entity_type)
            except: pass

        # 3. Setup Gemini LLM with a RAG prompt
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.3,
            google_api_key=api_key,
        )

        prompt = PromptTemplate(
            input_variables=["context", "linked_context", "question", "search_type"],
            template=(
                "You are RepoMind, an AI repository maintainer. "
                "Answer the contributor's question using the repository context and linked relationship context provided below. "
                "If the context doesn't contain enough info, say so honestly.\n\n"
                "--- Primary {search_type} Context ---\n{context}\n\n"
                "--- Linked Relationship Context ---\n{linked_context}\n\n"
                "--- Contributor Question ---\n{question}\n\n"
                "Provide a helpful, concise answer:"
            ),
        )

        chain = LLMChain(llm=llm, prompt=prompt)

        # 4. Execute Gemini RAG
        print(f"[GEMINI_RAG] Querying for repo {repo_full_name} ({search_type})...")
        answer = chain.run(context=context, linked_context=linked_context, question=question, search_type=search_type)

        source_count = len(matches)
        return f"{answer}\n\n*— Answer synthesized by RepoMind using Gemini 1.5 Flash ({source_count} sources from Supabase).*"

    except Exception as e:
        print(f"[GEMINI_RAG] Error during execution: {e}")
        return "I encountered an error trying to search the documentation with Gemini. I'll notify the human maintainers to step in!"

import os

# Try to import Langchain components
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_community.vectorstores import Chroma
    from langchain.chains import RetrievalQA
except ImportError:
    pass

CHROMA_PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")

def synthesize_answer(repo_full_name: str, question: str) -> str:
    """
    RAG Implementation using Gemini API.
    Searches ChromaDB for relevant documentation and uses Gemini to synthesize the answer.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("⚠ WARNING: GOOGLE_API_KEY not set. Returning stub RAG answer.")
        return ("*I am Orbiter, your AI maintainer. I've classified this as a question!* "
                "\n\n(Stub Mode: Please configure a GOOGLE_API_KEY in your environment to see actual Gemini-powered responses).")
    
    try:
        # 1. Initialize Embeddings and Vector DB (Chroma)
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        vectorstore = Chroma(
            persist_directory=CHROMA_PERSIST_DIR, 
            embedding_function=embeddings,
            collection_name="repo_docs"
        )
        
        # 2. Setup the Retriever
        retriever = vectorstore.as_retriever(
            search_kwargs={"k": 5, "filter": {"repo": repo_full_name}}
        )

        # 3. Setup Gemini LLM
        # Using Gemini 1.5 Flash for speed and efficiency in dev.
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.3,
            google_api_key=api_key
        )
        
        # 4. Create the Retrieval Chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
        
        # 5. Execute Gemini RAG
        print(f"[GEMINI_RAG] Querying for repo {repo_full_name}...")
        result = qa_chain({"query": question})
        answer = result["result"]
        
        return f"{answer}\n\n*— Answer synthesized by Orbiter using Gemini 1.5 Flash.*"

    except Exception as e:
        print(f"[GEMINI_RAG] Error during execution: {e}")
        return "I encountered an error trying to search the documentation with Gemini. I notify the human maintainers to step in!"

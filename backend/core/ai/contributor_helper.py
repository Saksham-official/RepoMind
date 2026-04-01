import os

# Try to import Langchain components, handling cases where they might not be installed yet during dev.
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_groq import ChatGroq
    from langchain.vectorstores import Chroma
    from langchain.chains import RetrievalQA
except ImportError:
    pass

CHROMA_PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")

def synthesize_answer(repo_full_name: str, question: str) -> str:
    """
    RAG Implementation for the Contributor Helper.
    Searches ChromaDB for relevant documentation and past issues,
    then uses an LLM to synthesize an answer.
    """
    if not os.environ.get("GROQ_API_KEY"):
        print("⚠ WARNING: GROQ_API_KEY not set. Returning stub RAG answer.")
        return ("*I am Orbiter, your AI maintainer. I've classified this as a question!* "
                "\n\n(Stub Mode: Please configure a GROQ API key in your environment to see actual RAG responses based on your repository's docs and closed issues).")
    
    try:
        # 1. Initialize Embeddings and Vector DB (Chroma)
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Connect to ChromaDB. We assume an ingestion pipeline has already populated this.
        vectorstore = Chroma(
            persist_directory=CHROMA_PERSIST_DIR, 
            embedding_function=embeddings,
            collection_name="repo_docs" # Default collection as per design
        )
        
        # 2. Setup the Retriever. We filter by repo to ensure data boundary isolation.
        retriever = vectorstore.as_retriever(
            search_kwargs={"k": 3, "filter": {"repo": repo_full_name}}
        )

        # 3. Setup the Language Model
        llm = ChatGroq(temperature=0.2, model_name="llama-3.1-70b-versatile")
        
        # 4. Create the Retrieval Chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
        
        # 5. Execute RAG
        print(f"[RAG] Executing search for repo {repo_full_name} | Query: {question[:50]}...")
        result = qa_chain({"query": question})
        answer = result["result"]
        
        return f"{answer}\n\n*— Answer synthesized by Orbiter using RAG from your repository docs.*"

    except Exception as e:
        print(f"[RAG] Error during execution: {e}")
        return "I encountered an error trying to search the documentation for your answer. I notify the human maintainers to step in!"

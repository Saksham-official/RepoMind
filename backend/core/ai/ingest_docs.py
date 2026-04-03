import os
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")

def ingest_repo_docs(repo_path: str, repo_full_name: str):
    """
    Ingests documentation and text files from a local repository path into ChromaDB.
    Use this for local development to ensure RAG has context about the project.
    """
    print(f"[INGEST] Starting ingestion for {repo_full_name} from {repo_path}...")
    
    # 1. Load documents (focusing on Markdown and Text)
    loader = DirectoryLoader(
        repo_path, 
        glob="**/*.md", 
        loader_cls=TextLoader,
        loader_kwargs={'encoding': 'utf8'}
    )
    
    try:
        documents = loader.load()
    except Exception as e:
        print(f"[INGEST] Error loading documents: {e}")
        return

    # 2. Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    
    # Add metadata for filtering
    for text in texts:
        text.metadata["repo"] = repo_full_name

    # 3. Embed and store
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    vectorstore = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
        collection_name="repo_docs"
    )
    
    print(f"[INGEST] SUCCESS: {len(texts)} chunks ingested for {repo_full_name}")

if __name__ == "__main__":
    # Example usage for local testing
    import sys
    if len(sys.argv) > 2:
        ingest_repo_docs(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python ingest_docs.py <local_repo_path> <repo_full_name>")

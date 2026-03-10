import os
import time
from typing import List, Dict, Any, Optional
import chromadb
from loguru import logger
from app.core.config import settings

# Initialize ChromaDB client
collection = None
try:
    persist_dir = os.path.abspath(os.path.join(os.getcwd(), settings.CHROMA_PERSIST_DIR))
    os.makedirs(persist_dir, exist_ok=True)
    chroma_client = chromadb.PersistentClient(path=persist_dir)
    collection = chroma_client.get_or_create_collection(name="scoutiq_articles")
    logger.info(f"ChromaDB initialized at {persist_dir}")
except Exception as e:
    logger.error(f"Failed to initialize ChromaDB: {e}")

async def store_article(url: str, content: str, title: str, company: str, publish_date: str = ""):
    """Store an article in ChromaDB vector cache"""
    if not collection:
        return
    try:
        # We use the URL as the ID so we don't duplicate
        collection.upsert(
            documents=[content],
            metadatas=[{
                "url": url,
                "title": title,
                "company": company,
                "publish_date": publish_date,
                "scraped_at": time.time(),
            }],
            ids=[url]
        )
        logger.info(f"Stored article {url} in vector cache")
    except Exception as e:
        logger.error(f"Error storing in ChromaDB: {e}")

async def search_cached_articles(query: str, n_results: int = 5) -> List[Dict[str, Any]]:
    """Search vector cache for previously scraped articles matching the query"""
    if not collection:
        return []
    try:
        # Calculate collection count to avoid querying more than n_elements
        count = collection.count()
        if count == 0:
            return []
        
        limit = min(n_results, count)
        results = collection.query(
            query_texts=[query],
            n_results=limit
        )
        
        articles = []
        if results and results.get("documents") and len(results["documents"]) > 0 and len(results["documents"][0]) > 0:
            for i in range(len(results["documents"][0])):
                doc = results["documents"][0][i]
                meta = results["metadatas"][0][i]
                
                articles.append({
                    "content": doc,
                    "url": meta.get("url", ""),
                    "title": meta.get("title", ""),
                    "company": meta.get("company", ""),
                    "publish_date": meta.get("publish_date", ""),
                    "scraped_at": meta.get("scraped_at", 0)
                })
        return articles
    except Exception as e:
        logger.error(f"Error searching ChromaDB: {e}")
        return []

async def check_url_cached(url: str) -> Optional[Dict[str, Any]]:
    """Check if a specific URL is already in cache"""
    if not collection:
        return None
    try:
        results = collection.get(ids=[url])
        if results and results.get("documents") and len(results["documents"]) > 0:
            return {
                "content": results["documents"][0],
                "url": results["metadatas"][0].get("url", ""),
                "title": results["metadatas"][0].get("title", ""),
            }
    except Exception as e:
        logger.error(f"Error checking cache for {url}: {e}")
    return None

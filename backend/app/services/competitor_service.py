from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DATABASE_NAME")]
collection = db["competitors"]

def get_all_competitors():
    try:
        competitors = list(collection.find({}))

        result = []
        for comp in competitors:
            result.append({
                "name": comp.get("name"),
                "user_id": str(comp.get("user_id")) if comp.get("user_id") else None
            })

        return result

    except Exception as e:
        print("❌ Error fetching competitors:", e)
        return []

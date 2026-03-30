import asyncio
import os
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def generate():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["scoutiq"]
    
    now = datetime.now(timezone.utc)
    # Yesterday 23:59:59
    end_date = datetime(now.year, now.month, now.day, 23, 59, 59, tzinfo=timezone.utc) - timedelta(days=1)
    # 30 days before yesterday 00:00:00
    start_date = datetime(end_date.year, end_date.month, end_date.day, 0, 0, 0, tzinfo=timezone.utc) - timedelta(days=30)
    
    cursor = db["feature_updates"].find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).sort("created_at", -1)
    
    docs = await cursor.to_list(length=1000)
    
    # Required Clusters
    clusters = {
        "AI Models & Agentic Systems": [],
        "Infrastructure & Chips": [],
        "Enterprise AI & Cloud": [],
        "Strategic Partnerships & M&A": [],
        "Research & Breakthroughs": [],
        "Other Updates": []
    }
    
    for doc in docs:
        cat = doc.get("category", "").lower()
        title = doc.get("feature_name", "").lower()
        
        # Categorize
        if "ai " in title or "agent" in title or "model" in title or cat == "ai":
            c_name = "AI Models & Agentic Systems"
        elif "chip" in title or "hw" in title or "hardware" in title or "infra" in title or cat == "infrastructure":
            c_name = "Infrastructure & Chips"
        elif "cloud" in title or "enterprise" in title or cat == "platform":
            c_name = "Enterprise AI & Cloud"
        elif "partner" in title or "acquire" in title or "merg" in title:
            c_name = "Strategic Partnerships & M&A"
        elif "research" in title or "breakthrough" in title or "paper" in title:
            c_name = "Research & Breakthroughs"
        else:
            # Try to push to AI/Cloud if not matched
            if cat in ["api", "ui", "sdk"]:
                c_name = "Enterprise AI & Cloud"
            else:
                c_name = "AI Models & Agentic Systems" # Default fallback for technical signals
                
        clusters[c_name].append(doc)

    out_lines = []
    out_lines.append("# Monthly Innovation Surface – Last 30 Days Technical Updates\n")
    
    has_updates = False
    
    for cluster_name, features in clusters.items():
        if not features and cluster_name == "Other Updates": continue
        if not features: continue
        
        has_updates = True
        out_lines.append(f"### {cluster_name}")
        
        for f in features:
            company = f.get("company_name", "Unknown")
            title = f.get("feature_name", "Untitled")
            
            # Format date
            date_val = f.get("release_date")
            if not date_val:
                date_val = f.get("created_at").strftime("%Y-%m-%d")
            
            cat_str = f.get("category", "Uncategorized")
            summary = f.get("technical_summary", f"Technical feature update detected for {company}: {title}.")
            if len(summary) > 150:
                summary = summary[:147] + "..."
                
            impact = "Medium"
            if "launch" in title.lower() or "reveal" in title.lower() or "new " in title.lower():
                impact = "High"
                
            out_lines.append(f"- **Company:** {company}")
            out_lines.append(f"- **Title:** {title}")
            out_lines.append(f"- **Date:** {date_val}")
            out_lines.append(f"- **Category:** {cat_str}")
            out_lines.append(f"- **Summary:** {summary}")
            out_lines.append(f"- **Impact:** {impact}")
            out_lines.append("")

    if not has_updates:
        out_lines.append("No verified technical updates found in the last 30 days.")
        
    final_output = "\n".join(out_lines)
    
    print("FINISHED SCRIPT")
    with open("/Users/deepukumar/.gemini/antigravity/brain/2d3dade0-ed14-4a7d-8cc2-62a5b199e8e0/monthly_innovation_surface.md", "w") as f:
        f.write(final_output)

if __name__ == "__main__":
    asyncio.run(generate())

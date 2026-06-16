"""
ScoutForge AI: modular Confidence Engine.
Calculates reliability score (0-100) based on source tier, date verification, citation, and duplicates.
"""
from typing import Any, Dict
from urllib.parse import urlparse

def calculate_confidence_score(feature: Dict[str, Any], duplicate_count: int = 0) -> float:
    """
    Calculates a confidence score from 0.0 to 100.0 for a given feature signal.
    
    Metrics considered:
    1. Source Tier (Base points up to 50)
    2. Date Verification (up to 20 points)
    3. Citation/URL Quality & Security (up to 20 points)
    4. Duplicate reinforcement (up to 10 points)
    """
    score = 0.0
    url = (feature.get("source_url") or feature.get("url") or "").lower()
    title = (feature.get("feature_title") or feature.get("feature_name") or "").lower()
    pub_date = feature.get("publish_date") or feature.get("release_date")
    
    # 1. Source Tier (Max 50 points)
    if any(w in url or w in title for w in ["docs.", "/docs", "changelog", "release-notes", "releases", "developer."]):
        score += 50.0  # Tier 1: Official changelogs/documentation
    elif any(w in url for w in ["/blog/engineering", "/blog/developer", "blog.host", "engineering."]) or "blog" in url:
        score += 40.0  # Tier 2: Developer/Engineering blogs
    elif any(w in url for w in ["techcrunch.com", "venturebeat.com", "infoq.com", "theverge.com", "zdnet.com", "wired.com"]):
        score += 30.0  # Tier 3: Authorized tech press
    elif any(w in url for w in ["reddit.com", "news.ycombinator.com", "medium.com", "dev.to", "stackoverflow.com"]):
        score += 15.0  # Tier 4: Community forums / developer media
    else:
        score += 25.0  # Fallback for generic blogs/websites
        
    # 2. Date Verification Status (Max 20 points)
    if pub_date and pub_date not in ("UNKNOWN", "YYYY-MM-DD", ""):
        score += 20.0
    else:
        score += 5.0  # Weak date reference
        
    # 3. Citation & Security Quality (Max 20 points)
    if url:
        score += 10.0  # Has valid source link
        if url.startswith("https://"):
            score += 5.0  # Secure source
        parsed = urlparse(url)
        # Check if it's official domain matching target company (subtle heuristic)
        company = (feature.get("competitor") or feature.get("company_name") or "").lower().replace(" ", "")
        if company and company in parsed.netloc:
            score += 5.0  # Directly owned official asset match
            
    # 4. Duplicate Reference Reinforcement (Max 10 points)
    # Each duplicate merged provides additional confidence reinforcement.
    score += min(10.0, duplicate_count * 5.0)
    
    return min(100.0, max(0.0, score))

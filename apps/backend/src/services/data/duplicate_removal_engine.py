"""
ScoutForge AI: modular Duplicate Removal Engine.
Deduplicates and merges intelligence signals by matching URLs or Title + Competitor.
Keeps the earliest publication date, longest summary, aggregates citations,
and counts duplicate occurrences to boost confidence.
"""
import logging
from typing import Any, Dict, List
from src.services.ai.confidence_engine import calculate_confidence_score

logger = logging.getLogger(__name__)

def deduplicate_and_merge_signals(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicates and merges a list of intelligence signal dicts.
    Returns the deduplicated list with updated citation lists, duplicate counts,
    and recalculates confidence scores based on reinforced duplicates.
    """
    merged: Dict[str, Dict[str, Any]] = {}
    
    for item in items:
        # Normalize fields
        url = (item.get("url") or item.get("source_url") or "").strip()
        title = (item.get("title") or item.get("feature_name") or item.get("feature_title") or "").strip().lower()
        company = (item.get("company_name") or item.get("competitor") or item.get("query_tag") or "").strip().lower()
        
        # Locate matches
        match_key = None
        if url:
            for k, val in merged.items():
                v_url = (val.get("url") or val.get("source_url") or "").strip()
                if v_url == url:
                    match_key = k
                    break
        if not match_key and title and company:
            for k, val in merged.items():
                v_title = (val.get("title") or val.get("feature_name") or val.get("feature_title") or "").strip().lower()
                v_company = (val.get("company_name") or val.get("competitor") or val.get("query_tag") or "").strip().lower()
                if v_company == company and v_title == title:
                    match_key = k
                    break
                    
        if match_key:
            existing = merged[match_key]
            
            # Increment duplicate reference count
            existing["duplicate_count"] = existing.get("duplicate_count", 0) + 1
            
            # Keep earliest publication date
            # Check for _authoritative_date or fallback to published_date/created_at
            item_date = item.get("_authoritative_date") or item.get("created_at")
            existing_date = existing.get("_authoritative_date") or existing.get("created_at")
            
            if item_date and existing_date and item_date < existing_date:
                if "_authoritative_date" in existing:
                    existing["_authoritative_date"] = item_date
                if "created_at" in existing:
                    existing["created_at"] = item_date
                if "release_date" in existing and "release_date" in item:
                    existing["release_date"] = item["release_date"]
                if "publish_date" in existing and "publish_date" in item:
                    existing["publish_date"] = item["publish_date"]
                if "time" in existing and "time" in item:
                    existing["time"] = item["time"]
                if "timestamp" in existing and "timestamp" in item:
                    existing["timestamp"] = item["timestamp"]
            
            # Keep longest/most detailed summary
            existing_summary = existing.get("summary") or existing.get("description") or existing.get("technical_summary") or ""
            item_summary = item.get("summary") or item.get("description") or item.get("technical_summary") or ""
            
            if len(item_summary) > len(existing_summary):
                if "summary" in existing:
                    existing["summary"] = item_summary
                if "description" in existing:
                    existing["description"] = item_summary
                if "technical_summary" in existing:
                    existing["technical_summary"] = item_summary
                    
                # Title updates if item title is more descriptive
                if "feature_name" in existing and "feature_name" in item and len(item.get("feature_name", "")) > len(existing.get("feature_name", "")):
                    existing["feature_name"] = item["feature_name"]
                if "title" in existing and "title" in item and len(item.get("title", "")) > len(existing.get("title", "")):
                    existing["title"] = item["title"]
                if "feature_title" in existing and "feature_title" in item and len(item.get("feature_title", "")) > len(existing.get("feature_title", "")):
                    existing["feature_title"] = item["feature_title"]

            # Merge citations/URLs
            citations = existing.setdefault("citations", [])
            if url and url not in citations:
                citations.append(url)
            for c in item.get("citations", []):
                if c and c not in citations:
                    citations.append(c)
                    
            # Recalculate confidence score with new duplicate count if confidence score was defined
            if "confidence_score" in existing:
                existing["confidence_score"] = calculate_confidence_score(existing, duplicate_count=existing["duplicate_count"])
        else:
            # Initialize citations and duplicate count
            item["citations"] = [url] if url else []
            item["duplicate_count"] = item.get("duplicate_count", 0)
            
            # Ensure confidence score is updated/calculated
            if "confidence_score" in item:
                item["confidence_score"] = calculate_confidence_score(item, duplicate_count=item["duplicate_count"])
                
            key = url if url else f"{company}|{title}"
            merged[key] = item
            
    return list(merged.values())

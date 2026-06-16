import pytest
from datetime import datetime, timezone
from src.services.data.duplicate_removal_engine import deduplicate_and_merge_signals

def test_deduplicate_and_merge_signals():
    # Setup test items
    dt1 = datetime(2026, 6, 15, tzinfo=timezone.utc)
    dt2 = datetime(2026, 6, 16, tzinfo=timezone.utc)
    
    items = [
        {
            "feature_name": "API Update",
            "company_name": "Stripe",
            "source_url": "https://docs.stripe.com/changelog/v3",
            "technical_summary": "Short summary.",
            "_authoritative_date": dt2,
            "publish_date": "2026-06-16",
            "confidence_score": 80.0
        },
        {
            "feature_name": "API Update",
            "company_name": "Stripe",
            "source_url": "https://docs.stripe.com/changelog/v3",
            "technical_summary": "This is a much longer and more detailed summary of what changed.",
            "_authoritative_date": dt1,
            "publish_date": "2026-06-15",
            "confidence_score": 80.0
        },
        {
            "feature_name": "Other Update",
            "company_name": "Stripe",
            "source_url": "https://docs.stripe.com/changelog/other",
            "technical_summary": "Different feature summary.",
            "_authoritative_date": dt1,
            "publish_date": "2026-06-15",
            "confidence_score": 80.0
        }
    ]
    
    merged = deduplicate_and_merge_signals(items)
    
    # We expect 2 merged items (the first two merged into one, the third one is separate)
    assert len(merged) == 2
    
    # Verify the merged Stripe API Update
    stripe_api = next(item for item in merged if item["feature_name"] == "API Update")
    
    # 1. Earliest date kept (dt1)
    assert stripe_api["_authoritative_date"] == dt1
    
    # 2. Longest summary kept
    assert stripe_api["technical_summary"] == "This is a much longer and more detailed summary of what changed."
    
    # 3. Duplicate count incremented to 1
    assert stripe_api["duplicate_count"] == 1
    
    # 4. Confidence score boosted due to duplicate reinforcement
    # Base for Tier 1: 50. Date verified: 20. Citation: 10 + 5 (https) + 5 (domain match) = 90.
    # Plus duplicate count * 5.0 (min 10) = 95.0
    assert stripe_api["confidence_score"] == 95.0

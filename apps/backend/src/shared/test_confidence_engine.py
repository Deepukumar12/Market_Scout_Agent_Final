import pytest
from src.services.ai.confidence_engine import calculate_confidence_score

def test_confidence_score_calculation():
    # 1. Tier 1: Official docs/changelog with HTTPS, valid date, and official domain match
    t1_feature = {
        "feature_title": "API V3 Release",
        "source_url": "https://docs.stripe.com/changelog/v3",
        "publish_date": "2026-06-16",
        "competitor": "Stripe"
    }
    score_t1 = calculate_confidence_score(t1_feature)
    assert score_t1 == 90.0

    # 2. Tier 4: HN post, no clean date
    t4_feature = {
        "feature_title": "HN Discussion about Stripe",
        "source_url": "http://news.ycombinator.com/item?id=123",
        "publish_date": "UNKNOWN",
        "competitor": "Stripe"
    }
    score_t4 = calculate_confidence_score(t4_feature)
    # 15 (Tier 4) + 5 (no date) + 10 (url) + 0 (http) + 0 (no domain match) = 30
    assert score_t4 == 30.0

    # 3. Duplicate reinforcement test
    score_t4_duped = calculate_confidence_score(t4_feature, duplicate_count=2)
    # 30 + 10 (2 duplicates * 5.0) = 40
    assert score_t4_duped == 40.0

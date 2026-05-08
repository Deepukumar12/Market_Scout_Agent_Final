"""
Step 1: Query Planning.
Generate diverse search queries for the company covering all intelligence categories.
"""
from typing import List


def plan_queries(company_name: str, time_window_days: int = 7) -> List[str]:
    """
    Generate 8 distinct search queries to find recent news, blogs, product launches,
    press releases, API updates, partnerships, and future roadmap items.
    """
    company = company_name.strip()
    if not company:
        return []

    return [
        f'"{company}" news last {time_window_days} days',
        f'"{company}" product launch announcement',
        f'"{company}" blog post update',
        f'"{company}" press release',
        f'"{company}" new features software release',
        f'"{company}" API changelog documentation update',
        f'"{company}" partnership acquisition expansion',
        f'"{company}" roadmap future plans',
    ]

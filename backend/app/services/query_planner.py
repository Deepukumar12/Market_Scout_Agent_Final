"""
Step 1: Query Planning.
Generate 3–4 search queries for the company.
"""
from typing import List


def plan_queries(company_name: str, time_window_days: int = 7) -> List[str]:
    """
    Generate 3–4 distinct search queries to find recent technical updates.
    """
    company = company_name.strip()
    if not company:
        return []

    return [
        f'"{company}" press release last {time_window_days} days',
        f'"{company}" release notes',
        f'"{company}" new technical features',
        f'"{company}" documentation update',
    ]

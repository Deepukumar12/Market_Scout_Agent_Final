"""
Structured Extraction Layer: from cleaned soup extract title, headings, first 5 paragraphs.
"""
from bs4 import BeautifulSoup


def extract_structured(soup: BeautifulSoup) -> tuple[str, list[str], list[str]]:
    """
    Returns (title, headings, first_5_paragraphs).
    Headings are from h1, h2. Paragraphs are from <p> only.
    """
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.get_text(strip=True)
    headings: list[str] = []
    for h in soup.find_all(["h1", "h2"]):
        t = h.get_text(strip=True)
        if t:
            headings.append(t)
    paragraphs: list[str] = []
    for p in soup.find_all("p"):
        t = p.get_text(strip=True)
        if t and len(t) > 20:
            paragraphs.append(t)
        if len(paragraphs) >= 5:
            break
    return title, headings, paragraphs


def get_remaining_body_after_paragraphs(soup: BeautifulSoup, first_n_paragraphs: list[str], max_chars: int = 30000) -> str:
    """
    Get body text excluding the first N paragraphs (so we can LSA the rest).
    Uses raw text from body and removes the substring that corresponds to first paragraphs.
    """
    body = soup.find("body") or soup
    full_text = body.get_text(separator="\n")
    remaining = full_text
    for p in first_n_paragraphs[:5]:
        if p in remaining:
            remaining = remaining.replace(p, " ", 1)
    import re
    remaining = re.sub(r"\n\s*\n", "\n", re.sub(r"[ \t]+", " ", remaining)).strip()
    return remaining[:max_chars] if remaining else ""

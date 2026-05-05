"""
Content Cleaning Layer: remove script, style, nav, footer, ads, normalize whitespace.
Input: Raw HTML / BeautifulSoup. Output: Cleaned soup for extraction.
"""
import re
from bs4 import BeautifulSoup


def clean_soup(soup: BeautifulSoup) -> BeautifulSoup:
    """
    In-place cleanup of soup: remove non-content, then normalize whitespace in text nodes.
    Returns the same soup for chaining.
    """
    # Remove non-content elements
    for tag in soup.find_all(["script", "style", "nav", "footer", "iframe", "noscript", "svg"]):
        tag.decompose()
    # Remove common ad/overlay classes (optional, keep if missing)
    for cls in ["ad", "ads", "advertisement", "sidebar-ad", "cookie-banner", "popup"]:
        for el in soup.find_all(class_=re.compile(cls, re.I)):
            el.decompose()
    # Normalize: collapse repeated newlines/spaces in place (we'll get text later)
    return soup


def get_cleaned_body_text(soup: BeautifulSoup, max_chars: int = 50000) -> str:
    """Get full body text after cleaning; limit size."""
    clean_soup(soup)
    body = soup.find("body") or soup
    text = body.get_text(separator="\n")
    text = re.sub(r"\n\s*\n", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()[:max_chars] if text else ""

"""
LSA Compression Layer: compress remaining body with LSA (sumy) to 8–12 sentences.
"""
import logging
from typing import List

logger = logging.getLogger(__name__)

# Default number of sentences for LSA summary
LSA_SENTENCES = 10


def _ensure_nltk_data() -> None:
    """Ensure NLTK data used by sumy is available."""
    try:
        from sumy.nlp.tokenizers import Tokenizer
        Tokenizer("english")
    except Exception:
        try:
            import nltk
            nltk.download("punkt", quiet=True)
            nltk.download("punkt_tab", quiet=True)
        except Exception as e:
            logger.warning("NLTK data download skipped: %s", e)


def compress_with_lsa(text: str, num_sentences: int = LSA_SENTENCES) -> str:
    """
    Summarize text using LSA (sumy). Returns compressed string (8–12 sentences).
    If sumy fails, returns truncated text to stay safe.
    """
    if not text or not text.strip():
        return ""
    text = text.strip()
    # Too short to summarize meaningfully
    if len(text) < 500:
        return text[:2000]
    try:
        _ensure_nltk_data()
        from sumy.summarizers.lsa import LsaSummarizer
        from sumy.parsers.plaintext import PlaintextParser
        from sumy.nlp.tokenizers import Tokenizer
        from sumy.utils import get_stop_words

        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = LsaSummarizer()
        summarizer.stop_words = get_stop_words("english")
        summary_sentences = summarizer(parser.document, min(num_sentences, 12))
        return " ".join(str(s) for s in summary_sentences).strip()
    except Exception as e:
        logger.debug("LSA compression failed, using truncation: %s", e)
        return text[:4000].rsplit(maxsplit=1)[0] if len(text) > 4000 else text[:4000]

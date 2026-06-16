import re
from fastapi import HTTPException


def sanitize_html(text: str) -> str:
    """
    Remove HTML tags and potential script injections from input strings.
    """
    if not isinstance(text, str):
        return text
    # Strip HTML tags
    clean = re.compile(r"<.*?>")
    text = re.sub(clean, "", text)
    # Strip dangerous characters/words that could be used in XSS injections
    text = re.sub(r"(?i)javascript:", "", text)
    text = re.sub(r"(?i)onload=", "", text)
    text = re.sub(r"(?i)onerror=", "", text)
    return text.strip()


# -- COMPETITOR SEARCH IDENTITY RULE -------------------------------------------
# Rule 10 (Highest Priority): Whenever a user searches for a competitor, the
# system must ONLY search for the exact company or organization explicitly entered.
# This function enforces that rule at the input boundary before any processing.

# Patterns that indicate the user entered multiple companies or a comparison query
_MULTI_COMPANY_PATTERNS = [
    r"\bvs\.?\b",           # "vs", "vs."
    r"\bversus\b",          # "versus"
    r"\bcompare\b",         # "compare X and Y"
    r"\band\b.*\band\b",    # "X and Y and Z"
    r"[,;]",                # "Stripe, Braintree"
    r"\s&\s",               # "Stripe & PayPal"
]

_AMBIGUOUS_PATTERNS = [
    r"\bor\b",              # "Stripe or PayPal"
    r"\balternative\b",     # "Stripe alternative"
    r"\bcompetitor\b",      # "Stripe competitor"
    r"\bsimilar to\b",      # "similar to Stripe"
    r"\blike\b",            # "companies like Stripe"
    r"\brelated\b",         # "related to Stripe"
]


def validate_company_name(name: str, raise_on_ambiguous: bool = True) -> str:
    """
    Validate and normalize a company name for strict identity search.

    Rules enforced:
    - Must be a single company name (no multi-company patterns)
    - No comparison language ("vs", "versus", "compare")
    - No substitution language ("or", "alternative", "similar to")
    - Strip surrounding whitespace and quotes
    - Raise HTTP 422 for multi-company queries
    - Raise HTTP 422 for ambiguous queries (when raise_on_ambiguous=True)

    Returns the cleaned, normalized company name.
    """
    if not isinstance(name, str) or not name.strip():
        raise HTTPException(
            status_code=422,
            detail="company_name must be a non-empty string."
        )

    name = name.strip().strip('"\'')
    name_lower = name.lower()

    # Block multi-company queries (highest priority violation)
    for pattern in _MULTI_COMPANY_PATTERNS:
        if re.search(pattern, name_lower):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Invalid company name: multiple companies or comparison operators detected. "
                    "Please enter exactly ONE company name. "
                    "The system only searches for the exact company you specify."
                )
            )

    # Block ambiguous comparison/substitution language
    if raise_on_ambiguous:
        for pattern in _AMBIGUOUS_PATTERNS:
            if re.search(pattern, name_lower):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Ambiguous query detected ('{name}'). "
                        "Please clarify the exact company name. "
                        "The system does not search for alternatives, competitors, or similar companies."
                    )
                )

    # Block SQL/NoSQL injection attempts
    name = sanitize_html(name)
    if re.search(r"[\$\{\}\[\]\(\)\|]", name):
        raise HTTPException(
            status_code=422,
            detail="company_name contains invalid characters."
        )

    # Collapse multiple spaces
    name = re.sub(r"\s{2,}", " ", name).strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="company_name cannot be empty after sanitization."
        )

    return name

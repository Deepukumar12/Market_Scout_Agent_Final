import logging
from typing import List, Tuple
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

def generate_final_report(company_name: str, summaries_with_urls: List[Tuple[str, str]]) -> str:
    """
    Synthesizes multiple article summaries into a single cohesive technical intelligence report.
    Exclusively returns markdown for dashboard rendering.
    """
    if not summaries_with_urls:
        return f"No intelligence signals gathered for {company_name} in the current surveillance window."

    today = datetime.now(timezone.utc)
    date_str = today.strftime("%d-%m-%Y")
    
    report_lines = [
        f"# {company_name} - Competitive Intelligence Synthesis",
        f"**Surveillance Date:** {date_str}",
        "",
        "## Executive Summary",
        f"Based on technical signals from {len(summaries_with_urls)} distinct sources, {company_name} is actively evolving its technical footprint. Key updates are summarized below.",
        "",
        "---",
        ""
    ]

    for summary, url in summaries_with_urls:
        report_lines.append(f"### Update from {url.split('//')[-1].split('/')[0]}")
        report_lines.append(summary)
        report_lines.append(f"\n[Source Link]({url})")
        report_lines.append("\n---")

    report_lines.append("\n\n**Intelligence Grade:** High-Fidelity Signal Synthesis (Database Driven)")
    
    return "\n".join(report_lines)

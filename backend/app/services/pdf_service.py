from fpdf import FPDF
from datetime import datetime
import os
import logging
from dateparser import parse as parse_date

logger = logging.getLogger(__name__)

class PDFReport(FPDF):
    def header(self):
        # Professional Minimalist Header
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, "Market Scout AI - Intelligence Report", border=0, new_x="LMARGIN", new_y="NEXT", align="C")
        self.set_font("Helvetica", "I", 10)
        self.cell(0, 8, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", border=0, new_x="LMARGIN", new_y="NEXT", align="R")
        self.ln(5)

    def footer(self):
        # Original Centered Footer
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}", border=0, new_x="RIGHT", new_y="TOP", align="C")

def format_date_str(iso_date: str) -> str:
    """Converts ISO or messy date string to 'Month DD, YYYY'."""
    try:
        dt = parse_date(iso_date)
        if dt:
            return dt.strftime("%b %d, %Y")
        return iso_date
    except:
        return iso_date

def generate_user_pdf_report(user_email, user_reports, output_path):
    """
    Generates a consolidated PDF report for a user.
    """
    pdf = PDFReport()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # User Context Section
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"Daily Update for: {user_email}", border=0, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    
    total_companies = len(user_reports)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, f"Total Companies Tracked: {total_companies}", border=0, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    for report in user_reports:
        company = report['company']
        features = report.get('features', [])
        
        # Sort features by date (newest first)
        try:
            features.sort(key=lambda x: parse_date(x.publish_date) or datetime.min, reverse=True)
        except:
            pass 

        # Company Header Section (Classic Gray)
        pdf.set_fill_color(230, 230, 230)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 10, f" Company: {company.upper()} ", border=1, new_x="LMARGIN", new_y="NEXT", align="L", fill=True)
        pdf.ln(4)

        if not features:
            pdf.set_font("Helvetica", "I", 11)
            pdf.cell(0, 10, "No new technical updates found in the last 7 days.", border=0, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(5)
            continue

        for f in features:
            # Feature Title (Black, Bolder)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(0, 0, 0)
            title_clean = f.feature_title.encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 8, f"- {title_clean}", new_x="LMARGIN", new_y="NEXT")
            
            # Technical Summary
            pdf.set_font("Helvetica", "", 10)
            summary_clean = f.technical_summary.encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 6, f"  Details: {summary_clean}", new_x="LMARGIN", new_y="NEXT")
            
            # Metadata with Verif Link
            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(100, 100, 100)
            display_date = format_date_str(f.publish_date)
            
            # Check for source_url
            link_url = f.source_url if hasattr(f, 'source_url') and f.source_url else ""
            
            pdf.write(6, f"  Source: {f.source_domain} | Date: {display_date}")
            
            if link_url:
                pdf.set_text_color(37, 99, 235)
                pdf.set_font("Helvetica", "B", 9)
                pdf.write(6, " [Verify]", link_url)
                pdf.set_text_color(100, 100, 100)
                pdf.set_font("Helvetica", "I", 9)
            
            pdf.ln(8)
        
        pdf.ln(5)

    pdf.output(output_path)
    logger.info(f"✅ Refined PDF report generated at: {output_path}")
    return output_path

    pdf.output(output_path)
    logger.info(f"✅ Enhanced PDF report generated at: {output_path}")
    return output_path

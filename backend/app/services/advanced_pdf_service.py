import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from dateutil import parser as date_parser

logger = logging.getLogger(__name__)

class AdvancedPDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            parent=self.styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#1D1D1F'),
            alignment=1, # Center
            spaceAfter=30,
            fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#0071E3'),
            spaceBefore=20,
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='SubHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#1D1D1F'),
            spaceBefore=12,
            spaceAfter=8,
            fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='NormalText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1D1D1F'),
            leading=14,
            fontName='Helvetica'
        ))
        self.styles.add(ParagraphStyle(
            name='SmallMuted',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#86868B'),
            fontName='Helvetica-Oblique'
        ))

    def generate_competitor_report(self, data_list: List[Dict[str, Any]], output_path: str):
        """
        Generates an advanced PDF for one or more competitors.
        data_list: List of dicts, each containing:
            - name: str
            - url: str
            - signals: List[Dict] (last 7 days)
            - features: List[Dict] (last 7 days)
            - sentiment: Dict (scores)
            - risks: List[Dict]
        """
        doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
        elements = []

        # --- Title Page ---
        elements.append(Spacer(1, 2*inch))
        elements.append(Paragraph("MARKET SCOUT AI", self.styles['MainTitle']))
        elements.append(Paragraph("Intelligence Surveillance Archive", self.styles['SubHeader']))
        
        date_range = f"Date Range: {(datetime.now() - timedelta(days=7)).strftime('%b %d')} - {datetime.now().strftime('%b %d, %Y')}"
        elements.append(Spacer(1, 0.5*inch))
        elements.append(Paragraph(date_range, self.styles['NormalText']))
        elements.append(Paragraph(f"Generated for Enterprise Intelligence Division", self.styles['SmallMuted']))
        
        elements.append(PageBreak())

        # --- Competitor Sections ---
        for comp in data_list:
            # Competitor Header
            elements.append(Paragraph(f"ENTITY: {comp['name'].upper()}", self.styles['SectionHeader']))
            elements.append(Paragraph(f"Primary Node: {comp.get('url', 'N/A')}", self.styles['SmallMuted']))
            elements.append(Spacer(1, 10))

            # --- 1. Executive Summary ---
            elements.append(Paragraph("Executive Summary", self.styles['SubHeader']))
            summary_text = (
                f"In the last 7 days, our autonomous agents identified {len(comp['signals'])} primary signals "
                f"and {len(comp['features'])} technical updates for {comp['name']}. "
                f"The overall sentiment resonance is {comp['sentiment'].get('overall_score', 0)}%."
            )
            elements.append(Paragraph(summary_text, self.styles['NormalText']))
            elements.append(Spacer(1, 15))

            # --- 2. Sentiment Matrix (Simulated Chart with Table) ---
            elements.append(Paragraph("Market Sentiment Resonance", self.styles['SubHeader']))
            s = comp['sentiment']
            sent_data = [
                ['Metric', 'Value', 'Status'],
                ['Overall Score', f"{s.get('overall_score', 0)}%", 'ACTIVE'],
                ['Positive Reception', f"{s.get('breakdown', {}).get('positive', 0)}", 'BULLISH'],
                ['Neutral Signals', f"{s.get('breakdown', {}).get('neutral', 0)}", 'STABLE'],
                ['Negative Signals', f"{s.get('breakdown', {}).get('negative', 0)}", 'REDUCED'],
            ]
            t = Table(sent_data, colWidths=[2*inch, 1*inch, 1.5*inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F5F7')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E5EA')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 20))

            # --- 3. Primary Signals (Last 7 Days) ---
            elements.append(Paragraph("Primary Intelligence Signals", self.styles['SubHeader']))
            if not comp['signals']:
                elements.append(Paragraph("No primary signals detected in current window.", self.styles['SmallMuted']))
            else:
                sig_table_data = [['Date', 'Signal Summary', 'Impact']]
                for sig in comp['signals'][:15]: # Cap at 15 for readability
                    date_val = sig.get('scraped_at') or sig.get('timestamp')
                    if isinstance(date_val, str):
                        try:
                            date_val = date_parser.parse(date_val)
                        except:
                            pass
                    
                    date_str = date_val.strftime('%Y-%m-%d') if isinstance(date_val, datetime) else str(date_val)[:10]
                    
                    sig_table_data.append([
                        date_str,
                        Paragraph(sig.get('summary', '')[:200], self.styles['NormalText']),
                        sig.get('sentiment', 'Neutral')
                    ])
                
                sig_table = Table(sig_table_data, colWidths=[0.8*inch, 3.5*inch, 0.7*inch])
                sig_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.2, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                ]))
                elements.append(sig_table)
            
            elements.append(Spacer(1, 20))

            # --- 4. Technical Updates ---
            elements.append(Paragraph("Technical Feature Updates", self.styles['SubHeader']))
            if not comp['features']:
                elements.append(Paragraph("No technical updates identified in current window.", self.styles['SmallMuted']))
            else:
                for feat in comp['features'][:5]:
                    elements.append(Paragraph(f"• {feat.get('feature_name', 'Untitled Feature')}", self.styles['NormalText']))
                    elements.append(Paragraph(feat.get('summary', 'No summary available.'), self.styles['SmallMuted']))
                    elements.append(Spacer(1, 5))

            # Page break for multi-competitor
            if comp != data_list[-1]:
                elements.append(PageBreak())

        # --- Build ---
        try:
            doc.build(elements)
            return output_path
        except Exception as e:
            logger.error(f"PDF Build Error: {e}")
            raise e

advanced_pdf_service = AdvancedPDFService()

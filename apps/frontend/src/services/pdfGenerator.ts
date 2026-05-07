

import { jsPDF } from 'jspdf';

export const generateCompanyReport = (companyName: string, reportContent: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper to check page bounds and add new page
    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            return true;
        }
        return false;
    };

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text("MARKET SCOUT AGENT", margin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Autonomous Market Intelligence & Competitor Analysis", margin, yPos);

    // Add a line
    yPos += 5;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // --- REPORT METADATA ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`Target Analysis: ${companyName}`, margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(80);
    const dateStr = new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Generated on: ${dateStr}`, margin, yPos);
    yPos += 15;

    // --- CONTENT PROCESSING ---
    const lines = reportContent.split('\n');

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0);

    lines.forEach((line) => {
        // Check for Headers (##)
        if (line.trim().startsWith('##')) {
            checkPageBreak(20);
            yPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80); // Dark blue/grey
            const headerText = line.replace(/^#+\s*/, '').trim();
            doc.text(headerText, margin, yPos);
            yPos += 8;
            // Reset to normal
            doc.setFont('times', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0);
        }
        // Check for Subheaders (###) or Bold starts
        else if (line.trim().startsWith('###')) {
            checkPageBreak(15);
            yPos += 3;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            const headerText = line.replace(/^#+\s*/, '').trim();
            doc.text(headerText, margin, yPos);
            yPos += 6;
            doc.setFont('times', 'normal');
            doc.setFontSize(11);
        }
        // Check for List Items
        else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const listText = "• " + line.trim().substring(2);
            const splitText = doc.splitTextToSize(listText, pageWidth - margin * 2 - 5);
            checkPageBreak(splitText.length * 6);
            doc.text(splitText, margin + 5, yPos);
            yPos += splitText.length * 5 + 2;
        }
        // Normal Text
        else if (line.trim().length > 0) {
            // Remove loose Markdown bold/italic symbols for cleaner PDF
            const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '');
            const splitText = doc.splitTextToSize(cleanLine, pageWidth - margin * 2);
            checkPageBreak(splitText.length * 5);
            doc.text(splitText, margin, yPos);
            yPos += splitText.length * 5 + 2;
        }
        // Empty Lines
        else {
            yPos += 4;
            checkPageBreak(0);
        }
    });

    // --- FOOTER ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        doc.text("CONFIDENTIAL - INTERNAL USE ONLY", margin, pageHeight - 10);
    }

    // Save the PDF
    const filename = `${companyName.replace(/\s+/g, '_')}_Intelligence_Report.pdf`;
    doc.save(filename);
};


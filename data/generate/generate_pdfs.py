#!/usr/bin/env python3
"""
PDF Document Generator - Creates realistic invoice PDFs, KYC documents, contracts
"""

import os
import random
from datetime import datetime
from pathlib import Path
import pandas as pd
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import io
import qrcode
import barcode
from barcode.writer import ImageWriter

random.seed(42)

BASE_DIR = Path(__file__).parent.parent  # Go up to data/ directory
DATA_DIR = BASE_DIR  # data/ is the data directory

print("="*80)
print("PDF DOCUMENT GENERATOR")
print("="*80)

# Load CSV data
print("\nLoading CSV data...")
vendors_df = pd.read_csv(DATA_DIR / "vendors.csv")
invoices_df = pd.read_csv(DATA_DIR / "invoices.csv")
po_df = pd.read_csv(DATA_DIR / "po_gr.csv")

print(f"Loaded {len(vendors_df)} vendors, {len(invoices_df)} invoices, {len(po_df)} POs")

# ============================================================================
# INVOICE PDF GENERATION
# ============================================================================

print("\n[7/13] Generating invoice PDFs...")

def create_vendor_logo(vendor_name, size=(150, 60)):
    """Create simple text-based logo"""
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)

    # Use initials or short name
    initials = ''.join([word[0] for word in vendor_name.split()[:3]])

    # Random color
    colors_list = [
        (52, 152, 219), (46, 204, 113), (155, 89, 182),
        (52, 73, 94), (230, 126, 34), (231, 76, 60)
    ]
    color = random.choice(colors_list)

    draw.rectangle([0, 0, size[0], size[1]], fill=color)
    draw.text((size[0]//2, size[1]//2), initials, fill='white', anchor='mm')

    return img

def create_qr_code(data):
    """Generate QR code"""
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")

def generate_digital_invoice_pdf(invoice_row, vendor_row, output_path):
    """Generate clean digital invoice PDF"""
    doc = SimpleDocTemplate(str(output_path), pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2C3E50'),
        spaceAfter=30,
        alignment=TA_CENTER
    )

    # Company header
    story.append(Paragraph(f"<b>{vendor_row['vendor_name']}</b>", title_style))
    story.append(Paragraph(f"{vendor_row['city']}, {vendor_row['state'] or vendor_row['country']}", styles['Normal']))
    story.append(Paragraph(f"Email: {vendor_row['contact_email']} | Phone: {vendor_row['phone']}", styles['Normal']))

    if vendor_row['gst']:
        story.append(Paragraph(f"<b>GSTIN:</b> {vendor_row['gst']}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    # Invoice title
    invoice_title = Paragraph(f"<b>TAX INVOICE</b>", ParagraphStyle('InvoiceTitle', parent=styles['Heading2'], alignment=TA_CENTER, fontSize=16))
    story.append(invoice_title)
    story.append(Spacer(1, 0.2*inch))

    # Invoice details table
    invoice_data = [
        ['Invoice Number:', invoice_row['invoice_number'], 'Invoice Date:', invoice_row['invoice_date']],
        ['PO Reference:', invoice_row['po_reference'] or 'N/A', 'Due Date:', invoice_row['due_date']],
        ['Payment Terms:', invoice_row['payment_terms'], 'Status:', invoice_row['status']]
    ]

    invoice_table = Table(invoice_data, colWidths=[2*inch, 2*inch, 2*inch, 2*inch])
    invoice_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(invoice_table)
    story.append(Spacer(1, 0.3*inch))

    # Bill To section
    story.append(Paragraph("<b>Bill To:</b>", styles['Heading3']))
    story.append(Paragraph("Acme Corporation Pvt Ltd", styles['Normal']))
    story.append(Paragraph("123 Business Park, Mumbai - 400001", styles['Normal']))
    story.append(Paragraph("GSTIN: 27AABCU9603R1ZM", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    # Line items
    story.append(Paragraph("<b>Items:</b>", styles['Heading3']))

    line_items_data = [
        ['#', 'Description', 'Qty', 'Rate', 'Amount']
    ]

    # Generate random line items
    num_items = invoice_row['line_items']
    remaining_amount = invoice_row['base_amount']

    for i in range(num_items):
        if i == num_items - 1:
            item_amount = remaining_amount
        else:
            item_amount = round(remaining_amount / (num_items - i) * random.uniform(0.5, 1.5), 2)
            remaining_amount -= item_amount

        qty = random.randint(1, 50)
        rate = round(item_amount / qty, 2)

        descriptions = [
            "Professional Services",
            "Software License",
            "Hardware Equipment",
            "Consulting Services",
            "Maintenance Support",
            "Training Services",
            "IT Infrastructure",
            "Cloud Services"
        ]

        line_items_data.append([
            str(i+1),
            random.choice(descriptions),
            str(qty),
            f"₹{rate:,.2f}",
            f"₹{item_amount:,.2f}"
        ])

    items_table = Table(line_items_data, colWidths=[0.5*inch, 3.5*inch, 1*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495E')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.2*inch))

    # Totals section
    totals_data = [
        ['', '', 'Subtotal:', f"₹{invoice_row['base_amount']:,.2f}"],
        ['', '', 'CGST (9%):', f"₹{invoice_row['cgst']:,.2f}"],
        ['', '', 'SGST (9%):', f"₹{invoice_row['sgst']:,.2f}"],
        ['', '', '<b>Total Amount:</b>', f"<b>₹{invoice_row['total_amount']:,.2f}</b>"],
    ]

    totals_table = Table(totals_data, colWidths=[2*inch, 2*inch, 2*inch, 2*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (2, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (2, -1), (-1, -1), 12),
        ('LINEABOVE', (2, -1), (-1, -1), 2, colors.black),
        ('TEXTCOLOR', (2, -1), (-1, -1), colors.HexColor('#E74C3C')),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 0.3*inch))

    # Bank details
    story.append(Paragraph("<b>Bank Details:</b>", styles['Heading3']))
    bank_data = [
        ['Bank Name:', 'HDFC Bank'],
        ['Account Number:', vendor_row['bank_account']],
        ['IFSC Code:', vendor_row['ifsc_code'] or 'HDFC0001234'],
        ['Branch:', f"{vendor_row['city']} Branch"]
    ]

    bank_table = Table(bank_data, colWidths=[2*inch, 4*inch])
    bank_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(bank_table)
    story.append(Spacer(1, 0.3*inch))

    # Terms and signature
    story.append(Paragraph("<b>Terms & Conditions:</b>", styles['Heading3']))
    story.append(Paragraph("1. Payment due within terms specified above", styles['Normal']))
    story.append(Paragraph("2. Interest @18% p.a. will be charged on delayed payments", styles['Normal']))
    story.append(Paragraph("3. All disputes subject to Mumbai jurisdiction", styles['Normal']))
    story.append(Spacer(1, 0.4*inch))

    story.append(Paragraph("<b>For " + vendor_row['vendor_name'] + "</b>", ParagraphStyle('Signature', parent=styles['Normal'], alignment=TA_RIGHT)))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<b>Authorized Signatory</b>", ParagraphStyle('Signature', parent=styles['Normal'], alignment=TA_RIGHT)))

    # Build PDF
    doc.build(story)

def generate_scanned_invoice_pdf(invoice_row, vendor_row, output_path):
    """Generate scanned-looking invoice PDF with imperfections"""
    # First create as digital
    temp_path = output_path.parent / f"temp_{output_path.name}"
    generate_digital_invoice_pdf(invoice_row, vendor_row, temp_path)

    # For now, just copy as scanned (real scanning simulation would require pdf2image)
    # In production, you'd convert to image, add noise, rotate, then back to PDF
    import shutil
    shutil.copy(temp_path, output_path)
    temp_path.unlink()

# Generate invoice PDFs
digital_count = 0
scanned_count = 0
image_count = 0

for idx, invoice_row in invoices_df.iterrows():
    invoice_id = invoice_row['invoice_id']
    vendor_id = invoice_row['vendor_id']
    vendor_row = vendors_df[vendors_df['vendor_id'] == vendor_id].iloc[0]

    # Choose format
    format_choice = random.choices(
        ['digital', 'scanned', 'image'],
        weights=[50, 40, 10]
    )[0]

    if format_choice == 'digital' or idx < 40:
        output_path = DATA_DIR / "invoices_pdf" / f"{invoice_id}_digital.pdf"
        generate_digital_invoice_pdf(invoice_row, vendor_row, output_path)
        digital_count += 1
    elif format_choice == 'scanned':
        output_path = DATA_DIR / "invoices_pdf" / f"{invoice_id}_scanned.pdf"
        generate_scanned_invoice_pdf(invoice_row, vendor_row, output_path)
        scanned_count += 1

    if (idx + 1) % 20 == 0:
        print(f"   Generated {idx + 1}/{len(invoices_df)} invoice PDFs...")

print(f"   ✓ Generated {len(invoices_df)} invoice PDFs")
print(f"     - {digital_count} digital PDFs")
print(f"     - {scanned_count} scanned-style PDFs")

# ============================================================================
# KYC DOCUMENT GENERATION
# ============================================================================

print("\n[8/13] Generating KYC document PDFs...")

def generate_kyc_pdf(vendor_row, output_path):
    """Generate comprehensive KYC document"""
    doc = SimpleDocTemplate(str(output_path), pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # Title
    title = Paragraph("<b>KNOW YOUR CUSTOMER (KYC) DOCUMENT</b>",
                     ParagraphStyle('Title', parent=styles['Title'], alignment=TA_CENTER, fontSize=18))
    story.append(title)
    story.append(Spacer(1, 0.3*inch))

    # Company details
    story.append(Paragraph("<b>Company Information</b>", styles['Heading2']))
    company_data = [
        ['Company Name:', vendor_row['vendor_name']],
        ['Registration Number:', vendor_row['registration_number']],
        ['Country:', vendor_row['country']],
        ['Industry:', vendor_row['industry']],
        ['PAN:', vendor_row['pan'] or 'N/A'],
        ['GST Number:', vendor_row['gst'] or 'N/A'],
        ['Contact Email:', vendor_row['contact_email']],
        ['Phone:', vendor_row['phone']],
        ['Website:', vendor_row['website']],
    ]

    company_table = Table(company_data, colWidths=[2.5*inch, 4*inch])
    company_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(company_table)
    story.append(Spacer(1, 0.3*inch))

    # Risk Assessment
    story.append(Paragraph("<b>Risk Assessment</b>", styles['Heading2']))
    risk_score = random.randint(60, 95)
    risk_data = [
        ['Risk Band:', vendor_row['risk_band']],
        ['Risk Score:', f"{risk_score}/100"],
        ['Assessment Date:', vendor_row['onboarding_date']],
        ['Last Reviewed:', vendor_row['last_updated']],
    ]

    risk_table = Table(risk_data, colWidths=[2.5*inch, 4*inch])
    risk_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 0.3*inch))

    # Banking Details
    story.append(Paragraph("<b>Banking Details</b>", styles['Heading2']))
    bank_data = [
        ['Account Number:', vendor_row['bank_account']],
        ['IFSC Code:', vendor_row['ifsc_code'] or 'N/A'],
        ['SWIFT Code:', vendor_row['swift_code'] or 'N/A'],
        ['Bank Branch:', f"{vendor_row['city']} Branch"],
    ]

    bank_table = Table(bank_data, colWidths=[2.5*inch, 4*inch])
    bank_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(bank_table)
    story.append(Spacer(1, 0.3*inch))

    # Compliance Checklist
    story.append(Paragraph("<b>Compliance Checklist</b>", styles['Heading2']))

    # Better compliance for LOW risk vendors
    is_low_risk = vendor_row['risk_band'] == 'LOW'
    compliance_prob = 0.95 if is_low_risk else 0.7

    checklist_data = [
        ['Document', 'Status'],
        ['Registration Certificate', random.choices(['✓ Submitted', '✗ Missing'], weights=[compliance_prob, 1-compliance_prob])[0]],
        ['PAN Card', '✓ Verified' if vendor_row['pan'] else '✗ Not Applicable'],
        ['GST Certificate', '✓ Verified' if vendor_row['gst'] else '✗ Not Applicable'],
        ['Bank Statement', random.choices(['✓ Submitted', '✗ Missing'], weights=[compliance_prob, 1-compliance_prob])[0]],
        ['ISO Certification', random.choices(['✓ Submitted', '✗ Missing'], weights=[0.6, 0.4])[0]],
        ['Trade License', random.choices(['✓ Submitted', '✗ Missing'], weights=[compliance_prob, 1-compliance_prob])[0]],
        ['Insurance Certificate', random.choices(['✓ Submitted', '✗ Missing'], weights=[0.8, 0.2])[0]],
    ]

    checklist_table = Table(checklist_data, colWidths=[4*inch, 2.5*inch])
    checklist_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495E')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(checklist_table)
    story.append(Spacer(1, 0.3*inch))

    # Authorized Signatory
    story.append(Paragraph("<b>Authorized Representative</b>", styles['Heading2']))
    story.append(Paragraph(f"Name: {vendor_row['primary_contact_name']}", styles['Normal']))
    story.append(Paragraph(f"Title: {vendor_row['primary_contact_title']}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    # Footer
    story.append(Paragraph(f"<i>Document generated on {datetime.now().strftime('%Y-%m-%d')}</i>",
                          ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

    doc.build(story)

# Generate KYC PDFs for all vendors
for idx, vendor_row in vendors_df.iterrows():
    vendor_id = vendor_row['vendor_id']
    output_path = DATA_DIR / "kyc_samples" / f"{vendor_id}_KYC.pdf"
    generate_kyc_pdf(vendor_row, output_path)

    if (idx + 1) % 5 == 0:
        print(f"   Generated {idx + 1}/{len(vendors_df)} KYC documents...")

print(f"   ✓ Generated {len(vendors_df)} KYC document PDFs")

# ============================================================================
# CONTRACT DOCUMENT GENERATION
# ============================================================================

print("\n[9/13] Generating contract PDFs...")

def generate_contract_pdf(vendor_row, output_path):
    """Generate service contract PDF"""
    doc = SimpleDocTemplate(str(output_path), pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # Title
    title = Paragraph("<b>MASTER SERVICE AGREEMENT</b>",
                     ParagraphStyle('Title', parent=styles['Title'], alignment=TA_CENTER, fontSize=20))
    story.append(title)
    story.append(Spacer(1, 0.2*inch))

    # Contract details
    contract_number = f"MSA-{vendor_row['vendor_id'].split('-')[1]}-{random.randint(1000,9999)}"
    contract_date = vendor_row['onboarding_date']

    story.append(Paragraph(f"<b>Contract Number:</b> {contract_number}", styles['Normal']))
    story.append(Paragraph(f"<b>Effective Date:</b> {contract_date}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    # Parties
    story.append(Paragraph("<b>BETWEEN:</b>", styles['Heading2']))
    story.append(Paragraph("<b>Acme Corporation Pvt Ltd</b> (\"Company\")", styles['Normal']))
    story.append(Paragraph("123 Business Park, Mumbai - 400001", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph("<b>AND:</b>", styles['Heading2']))
    story.append(Paragraph(f"<b>{vendor_row['vendor_name']}</b> (\"Vendor\")", styles['Normal']))
    story.append(Paragraph(f"{vendor_row['city']}, {vendor_row['state'] or vendor_row['country']}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    # Terms
    story.append(Paragraph("<b>1. SCOPE OF SERVICES</b>", styles['Heading2']))
    story.append(Paragraph(f"Vendor agrees to provide {vendor_row['industry']} services as detailed in attached Statements of Work (SOW).", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph("<b>2. PAYMENT TERMS</b>", styles['Heading2']))
    payment_terms = random.choice(['Net 30', 'Net 45', 'Net 60'])
    story.append(Paragraph(f"Payment terms: {payment_terms} days from invoice date.", styles['Normal']))
    story.append(Paragraph("Late payment interest: 18% per annum.", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph("<b>3. TERM AND TERMINATION</b>", styles['Heading2']))
    story.append(Paragraph("Initial term: 2 years from effective date, renewable annually.", styles['Normal']))
    story.append(Paragraph("Either party may terminate with 90 days written notice.", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph("<b>4. LIABILITY</b>", styles['Heading2']))
    # Add some "risky" clauses for certain vendors
    if vendor_row['risk_band'] == 'HIGH':
        story.append(Paragraph("<font color='red'>Vendor's liability shall be unlimited for all claims.</font>", styles['Normal']))
    else:
        story.append(Paragraph("Vendor's liability limited to 12 months of fees paid.", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph("<b>5. CONFIDENTIALITY</b>", styles['Heading2']))
    story.append(Paragraph("Both parties agree to maintain confidentiality of proprietary information.", styles['Normal']))
    story.append(Paragraph("Confidentiality obligations survive termination for 5 years.", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph("<b>6. COMPLIANCE</b>", styles['Heading2']))
    story.append(Paragraph("Vendor shall comply with all applicable laws and regulations.", styles['Normal']))
    story.append(Paragraph("Vendor warrants it has all necessary licenses and permits.", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))

    # Signatures
    story.append(Spacer(1, 0.5*inch))
    signature_data = [
        ['For Company:', 'For Vendor:'],
        ['', ''],
        ['_____________________', '_____________________'],
        ['Authorized Signatory', vendor_row['primary_contact_name']],
        ['Date: _______________', f"Title: {vendor_row['primary_contact_title']}"],
    ]

    sig_table = Table(signature_data, colWidths=[3.5*inch, 3.5*inch])
    sig_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(sig_table)

    doc.build(story)

# Generate contract PDFs
for idx, vendor_row in vendors_df.iterrows():
    if vendor_row['status'] == 'APPROVED':
        vendor_id = vendor_row['vendor_id']
        output_path = DATA_DIR / "contracts" / f"{vendor_id}_contract_final_signed.pdf"
        generate_contract_pdf(vendor_row, output_path)

        if (idx + 1) % 5 == 0:
            print(f"   Generated {idx + 1}/{len(vendors_df)} contracts...")

print(f"   ✓ Generated contract PDFs for approved vendors")

print("\n" + "="*80)
print("PDF GENERATION COMPLETE!")
print("="*80)

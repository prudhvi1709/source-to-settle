#!/usr/bin/env python3
"""
Comprehensive Synthetic Data Generator for Source-to-Settle AI Demo
Generates ~600+ realistic files across multiple formats
"""

import os
import sys
import random
import json
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
from faker import Faker
import numpy as np

# Initialize Faker with multiple locales
fake = Faker(['en_IN', 'en_US'])
Faker.seed(42)
random.seed(42)
np.random.seed(42)

# Configuration
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
NUM_VENDORS = 20
NUM_INVOICES = 80
NUM_POS = 50
NUM_EVENTS = 100

# Indian company suffixes
COMPANY_SUFFIXES = [
    "Pvt Ltd", "Private Limited", "LLP", "Limited", "Solutions",
    "Technologies", "Enterprises", "Corporation", "Industries", "Services"
]

# Industries
INDUSTRIES = [
    "IT Services", "Manufacturing", "Logistics", "Consulting",
    "Telecommunications", "Healthcare", "Construction", "Retail",
    "Financial Services", "Education", "Automotive", "Pharmaceuticals"
]

# Indian states
INDIAN_STATES = [
    "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat",
    "West Bengal", "Telangana", "Rajasthan", "Uttar Pradesh", "Kerala"
]

print("=" * 80)
print("SOURCE-TO-SETTLE SYNTHETIC DATA GENERATOR")
print("=" * 80)
print(f"Starting data generation at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Target: {NUM_VENDORS} vendors, {NUM_INVOICES} invoices, {NUM_POS} POs")
print("=" * 80)

# ============================================================================
# PHASE 1: GENERATE VENDOR MASTER DATA
# ============================================================================

print("\n[1/13] Generating vendor master data...")

def generate_vendor_name():
    """Generate realistic Indian company name"""
    patterns = [
        lambda: f"{fake.company()} {random.choice(COMPANY_SUFFIXES)}",
        lambda: f"{fake.first_name()} {random.choice(['Technologies', 'Solutions', 'Enterprises'])} {random.choice(COMPANY_SUFFIXES)}",
        lambda: f"{fake.last_name()} {random.choice(['Industries', 'Corporation', 'Services'])}",
        lambda: f"{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=3))} {random.choice(['Tech', 'Systems', 'Global'])} {random.choice(COMPANY_SUFFIXES)}"
    ]
    return random.choice(patterns)()

def generate_pan():
    """Generate valid-format PAN number"""
    return f"{fake.random_uppercase_letter()}{fake.random_uppercase_letter()}{fake.random_uppercase_letter()}{fake.random_uppercase_letter()}{fake.random_uppercase_letter()}{random.randint(1000, 9999)}{fake.random_uppercase_letter()}"

def generate_gst():
    """Generate valid-format GST number"""
    state_code = random.randint(10, 36)
    return f"{state_code}{generate_pan()}{random.randint(1, 9)}Z{fake.random_uppercase_letter()}"

def generate_ifsc():
    """Generate valid-format IFSC code"""
    banks = ['SBIN', 'HDFC', 'ICIC', 'AXIS', 'PUNB', 'UTIB', 'KKBK', 'INDB']
    return f"{random.choice(banks)}0{random.randint(100000, 999999)}"

# Status distribution
statuses = ['APPROVED'] * 15 + ['PENDING'] * 3 + ['REJECTED'] * 2
risk_bands = ['LOW'] * 12 + ['MEDIUM'] * 6 + ['HIGH'] * 2

random.shuffle(statuses)
random.shuffle(risk_bands)

vendors_data = []
start_date = datetime.now() - timedelta(days=180)

for i in range(1, NUM_VENDORS + 1):
    vendor_id = f"VENDOR-{i:04d}"
    onboarding_date = start_date + timedelta(days=random.randint(0, 150))

    # Mix of Indian and international vendors
    is_indian = random.random() < 0.7
    country = "India" if is_indian else random.choice(["USA", "UK", "Singapore", "UAE", "Germany"])

    vendor = {
        'vendor_id': vendor_id,
        'vendor_name': generate_vendor_name(),
        'country': country,
        'state': random.choice(INDIAN_STATES) if is_indian else "",
        'city': fake.city(),
        'industry': random.choice(INDUSTRIES),
        'contact_email': fake.company_email(),
        'phone': fake.phone_number(),
        'status': statuses[i-1],
        'risk_band': risk_bands[i-1],
        'onboarding_date': onboarding_date.strftime('%Y-%m-%d'),
        'last_updated': (onboarding_date + timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
        'pan': generate_pan() if is_indian else "",
        'gst': generate_gst() if is_indian else "",
        'tax_id': "" if is_indian else fake.ean13(),
        'registration_number': f"CIN-{fake.bothify(text='U#####MH####PTC######')}" if is_indian else fake.bothify(text='REG-########'),
        'website': fake.url(),
        'primary_contact_name': fake.name(),
        'primary_contact_title': random.choice(['Manager', 'Director', 'VP Operations', 'CFO', 'Head of Procurement']),
        'bank_account': fake.bban(),
        'ifsc_code': generate_ifsc() if is_indian else "",
        'swift_code': fake.swift() if not is_indian else ""
    }
    vendors_data.append(vendor)

vendors_df = pd.DataFrame(vendors_data)
vendors_df.to_csv(DATA_DIR / "vendors.csv", index=False)
print(f"   ✓ Generated {len(vendors_df)} vendors")
print(f"     - {len(vendors_df[vendors_df['status']=='APPROVED'])} APPROVED")
print(f"     - {len(vendors_df[vendors_df['status']=='PENDING'])} PENDING")
print(f"     - {len(vendors_df[vendors_df['status']=='REJECTED'])} REJECTED")

# ============================================================================
# PHASE 2: GENERATE PURCHASE ORDERS & GOODS RECEIPTS
# ============================================================================

print("\n[2/13] Generating Purchase Orders and Goods Receipts...")

# Only create POs for approved vendors
approved_vendors = vendors_df[vendors_df['status'] == 'APPROVED']['vendor_id'].tolist()

po_data = []
gr_data = []
po_start_date = datetime.now() - timedelta(days=120)

for i in range(1, NUM_POS + 1):
    po_id = f"PO-{i:04d}"
    vendor_id = random.choice(approved_vendors)
    po_date = po_start_date + timedelta(days=random.randint(0, 90))
    po_amount = round(random.uniform(50000, 5000000), 2)

    # 70% have GR, 30% are still open
    has_gr = random.random() < 0.7

    po = {
        'po_id': po_id,
        'po_number': f"PO{fake.bothify(text='####-####')}",
        'vendor_id': vendor_id,
        'po_date': po_date.strftime('%Y-%m-%d'),
        'po_amount': po_amount,
        'currency': 'INR',
        'description': fake.catch_phrase(),
        'delivery_date': (po_date + timedelta(days=random.randint(15, 45))).strftime('%Y-%m-%d'),
        'status': 'CLOSED' if has_gr else 'OPEN',
        'line_items_count': random.randint(1, 10)
    }
    po_data.append(po)

    if has_gr:
        gr_date = po_date + timedelta(days=random.randint(10, 40))
        # Sometimes GR amount differs slightly
        gr_amount = po_amount if random.random() < 0.8 else round(po_amount * random.uniform(0.95, 1.0), 2)

        gr = {
            'gr_id': f"GR-{len(gr_data) + 1:04d}",
            'gr_number': f"GR{fake.bothify(text='####-####')}",
            'po_id': po_id,
            'vendor_id': vendor_id,
            'gr_date': gr_date.strftime('%Y-%m-%d'),
            'gr_amount': gr_amount,
            'quantity_received': random.randint(1, 100),
            'warehouse': random.choice(['WH-Mumbai', 'WH-Bangalore', 'WH-Delhi', 'WH-Chennai']),
            'received_by': fake.name()
        }
        gr_data.append(gr)

po_df = pd.DataFrame(po_data)
gr_df = pd.DataFrame(gr_data)

po_df.to_csv(DATA_DIR / "po_gr.csv", index=False)
print(f"   ✓ Generated {len(po_df)} Purchase Orders")
print(f"     - {len(po_df[po_df['status']=='CLOSED'])} with GR")
print(f"     - {len(po_df[po_df['status']=='OPEN'])} still open")
print(f"   ✓ Generated {len(gr_df)} Goods Receipts")

# ============================================================================
# PHASE 3: GENERATE INVOICE DATA
# ============================================================================

print("\n[3/13] Generating invoice master data...")

# Status distribution
invoice_statuses = (
    ['MATCHED'] * 50 +
    ['DUPLICATE'] * 10 +
    ['EXCEPTION'] * 15 +
    ['PENDING'] * 5
)
random.shuffle(invoice_statuses)

invoices_data = []
invoice_start_date = datetime.now() - timedelta(days=90)

# Create mapping of PO to invoices
pos_with_gr = po_df[po_df['status'] == 'CLOSED'].to_dict('records')

for i in range(1, NUM_INVOICES + 1):
    invoice_id = f"INV-{i:04d}"
    status = invoice_statuses[i-1]

    # Select vendor and PO
    if status in ['MATCHED', 'PAID'] and pos_with_gr:
        po = random.choice(pos_with_gr)
        vendor_id = po['vendor_id']
        po_reference = po['po_id']
        amount = po['po_amount']

        # Find corresponding GR
        gr = gr_df[gr_df['po_id'] == po_reference].iloc[0] if len(gr_df[gr_df['po_id'] == po_reference]) > 0 else None
        gr_reference = gr['gr_id'] if gr is not None else ""
    else:
        vendor_id = random.choice(approved_vendors)
        po_reference = ""
        gr_reference = ""
        amount = round(random.uniform(10000, 1000000), 2)

    invoice_date = invoice_start_date + timedelta(days=random.randint(0, 80))

    # For exceptions, introduce issues
    if status == 'EXCEPTION':
        # Randomly create different types of exceptions
        exception_type = random.choice(['amount_mismatch', 'missing_po', 'date_issue'])
        if exception_type == 'amount_mismatch' and po_reference:
            amount = amount * random.uniform(0.8, 1.3)  # Wrong amount
        elif exception_type == 'missing_po':
            po_reference = ""
            gr_reference = ""

    # For duplicates, reuse invoice numbers
    if status == 'DUPLICATE' and i > 10:
        duplicate_invoice = invoices_data[random.randint(max(0, i-20), i-2)]
        invoice_number = duplicate_invoice['invoice_number']
        vendor_id = duplicate_invoice['vendor_id']
    else:
        invoice_number = f"INV-{vendor_id.split('-')[1]}-{fake.bothify(text='####')}"

    # Tax calculation
    base_amount = amount / 1.18  # Assuming 18% GST
    cgst = round(base_amount * 0.09, 2)
    sgst = round(base_amount * 0.09, 2)
    total_amount = round(base_amount + cgst + sgst, 2)

    invoice = {
        'invoice_id': invoice_id,
        'vendor_id': vendor_id,
        'invoice_number': invoice_number,
        'invoice_date': invoice_date.strftime('%Y-%m-%d'),
        'due_date': (invoice_date + timedelta(days=random.choice([30, 45, 60]))).strftime('%Y-%m-%d'),
        'base_amount': round(base_amount, 2),
        'cgst': cgst,
        'sgst': sgst,
        'igst': 0,
        'total_amount': total_amount,
        'currency': 'INR',
        'status': status,
        'po_reference': po_reference,
        'gr_reference': gr_reference,
        'submission_date': (invoice_date + timedelta(days=random.randint(0, 5))).strftime('%Y-%m-%d'),
        'payment_date': (invoice_date + timedelta(days=random.randint(30, 60))).strftime('%Y-%m-%d') if status == 'PAID' else "",
        'payment_terms': random.choice(['Net 30', 'Net 45', 'Net 60', 'Due on Receipt']),
        'description': fake.bs(),
        'line_items': random.randint(1, 8)
    }
    invoices_data.append(invoice)

invoices_df = pd.DataFrame(invoices_data)
invoices_df.to_csv(DATA_DIR / "invoices.csv", index=False)
print(f"   ✓ Generated {len(invoices_df)} invoices")
print(f"     - {len(invoices_df[invoices_df['status']=='MATCHED'])} MATCHED")
print(f"     - {len(invoices_df[invoices_df['status']=='DUPLICATE'])} DUPLICATE")
print(f"     - {len(invoices_df[invoices_df['status']=='EXCEPTION'])} EXCEPTION")
print(f"     - {len(invoices_df[invoices_df['status']=='PENDING'])} PENDING")

# ============================================================================
# PHASE 4: GENERATE SUPPLIER HISTORY & ANALYTICS
# ============================================================================

print("\n[4/13] Generating supplier history and analytics...")

supplier_history = []

for vendor_id in approved_vendors:
    vendor_invoices = invoices_df[invoices_df['vendor_id'] == vendor_id]

    if len(vendor_invoices) == 0:
        continue

    total_invoices = len(vendor_invoices)
    total_amount = vendor_invoices['total_amount'].sum()

    # Calculate KPIs
    on_time_rate = round(random.uniform(85, 98), 2)
    dispute_rate = round(random.uniform(0, 5), 2)
    cycle_time = random.randint(15, 45)

    # Determine recommendation based on performance and risk
    vendor_info = vendors_df[vendors_df['vendor_id'] == vendor_id].iloc[0]
    risk = vendor_info['risk_band']

    if on_time_rate > 95 and dispute_rate < 2 and risk == 'LOW':
        recommendation = 'RENEW'
        risk_trend = 'STABLE'
    elif on_time_rate < 88 or dispute_rate > 4 or risk == 'HIGH':
        recommendation = 'RETENDER'
        risk_trend = 'DECLINING'
    else:
        recommendation = 'MONITOR'
        risk_trend = random.choice(['STABLE', 'IMPROVING'])

    history = {
        'vendor_id': vendor_id,
        'vendor_name': vendor_info['vendor_name'],
        'total_invoices_processed': total_invoices,
        'total_amount_paid': round(total_amount, 2),
        'on_time_payment_rate': on_time_rate,
        'dispute_rate': dispute_rate,
        'average_cycle_time_days': cycle_time,
        'last_invoice_date': vendor_invoices['invoice_date'].max(),
        'risk_band': risk,
        'risk_trend': risk_trend,
        'recommendation': recommendation,
        'quality_score': round(random.uniform(75, 98), 2),
        'delivery_score': round(random.uniform(80, 99), 2),
        'compliance_score': round(random.uniform(85, 100), 2)
    }
    supplier_history.append(history)

supplier_df = pd.DataFrame(supplier_history)
supplier_df.to_csv(DATA_DIR / "supplier_history.csv", index=False)
print(f"   ✓ Generated supplier history for {len(supplier_df)} vendors")
print(f"     - {len(supplier_df[supplier_df['recommendation']=='RENEW'])} recommended for RENEW")
print(f"     - {len(supplier_df[supplier_df['recommendation']=='MONITOR'])} recommended to MONITOR")
print(f"     - {len(supplier_df[supplier_df['recommendation']=='RETENDER'])} recommended for RETENDER")

# ============================================================================
# PHASE 5: GENERATE EVENTS LOG
# ============================================================================

print("\n[5/13] Generating events and audit trail...")

agents = [
    'VendorIntakeAgent',
    'RiskGuardAgent',
    'ContractCraftAgent',
    'InvoiceIQAgent',
    'PayFlowAgent',
    'Supplier360Agent'
]

event_types = [
    'VENDOR_CREATED', 'VENDOR_APPROVED', 'VENDOR_REJECTED',
    'KYC_EXTRACTED', 'RISK_ASSESSED', 'RISK_ESCALATED',
    'CONTRACT_GENERATED', 'CONTRACT_REVIEWED', 'CONTRACT_SIGNED',
    'INVOICE_RECEIVED', 'INVOICE_OCR_COMPLETED', 'INVOICE_MATCHED',
    'INVOICE_DUPLICATE_DETECTED', 'INVOICE_EXCEPTION_FLAGGED',
    'PAYMENT_QUEUED', 'PAYMENT_PROCESSED', 'PAYMENT_FAILED',
    'PERFORMANCE_CALCULATED', 'RECOMMENDATION_GENERATED'
]

events_data = []
event_start = datetime.now() - timedelta(days=60)

for i in range(1, NUM_EVENTS + 1):
    event_time = event_start + timedelta(
        days=random.randint(0, 59),
        hours=random.randint(9, 18),
        minutes=random.randint(0, 59)
    )

    vendor_id = random.choice(approved_vendors)
    agent = random.choice(agents)
    event_type = random.choice(event_types)

    # Generate contextual descriptions
    descriptions = {
        'VENDOR_CREATED': f"New vendor profile created for {vendor_id}",
        'RISK_ASSESSED': f"Risk score calculated: {random.randint(60, 95)}/100. Risk band assigned.",
        'INVOICE_MATCHED': f"Invoice successfully matched to PO and GR. Amount validated.",
        'INVOICE_DUPLICATE_DETECTED': f"Duplicate invoice detected. Same invoice number already processed.",
        'PAYMENT_PROCESSED': f"Payment of ₹{random.randint(50000, 500000):,} processed successfully",
        'RECOMMENDATION_GENERATED': f"Performance analysis complete. Recommendation: {random.choice(['RENEW', 'MONITOR', 'RETENDER'])}"
    }

    description = descriptions.get(event_type, f"{agent} processed {event_type} for {vendor_id}")

    event = {
        'event_id': f"EVT-{i:05d}",
        'timestamp': event_time.strftime('%Y-%m-%d %H:%M:%S'),
        'vendor_id': vendor_id,
        'invoice_id': random.choice(invoices_df['invoice_id'].tolist()) if 'INVOICE' in event_type else "",
        'agent_name': agent,
        'event_type': event_type,
        'description': description,
        'status': random.choices(['SUCCESS', 'WARNING', 'ERROR'], weights=[85, 10, 5])[0],
        'confidence_score': round(random.uniform(0.75, 0.99), 4),
        'processing_time_ms': random.randint(100, 5000)
    }
    events_data.append(event)

# Sort by timestamp
events_df = pd.DataFrame(events_data)
events_df = events_df.sort_values('timestamp')
events_df.to_csv(DATA_DIR / "events_sample.csv", index=False)
print(f"   ✓ Generated {len(events_df)} event records")
print(f"     - {len(events_df[events_df['status']=='SUCCESS'])} successful")
print(f"     - {len(events_df[events_df['status']=='WARNING'])} warnings")
print(f"     - {len(events_df[events_df['status']=='ERROR'])} errors")

# ============================================================================
# PHASE 6: GENERATE MANIFEST & SUMMARY
# ============================================================================

print("\n[6/13] Generating manifest summary...")

manifest = {
    'dataset_name': 'Source-to-Settle AI Demo Dataset',
    'version': '1.0.0',
    'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'total_vendors': len(vendors_df),
    'total_invoices': len(invoices_df),
    'total_purchase_orders': len(po_df),
    'total_goods_receipts': len(gr_df),
    'total_events': len(events_df),
    'date_range_start': invoice_start_date.strftime('%Y-%m-%d'),
    'date_range_end': datetime.now().strftime('%Y-%m-%d'),
    'agents_covered': 'VendorIntake,RiskGuard,ContractCraft,InvoiceIQ,PayFlow,Supplier360',
    'personas_supported': 'Ananya(Procurement),Rohan(Finance),Neha(Manager)',
    'file_formats': 'CSV,PDF,XLSX,DOCX,JPG,PNG,JSON,HTML'
}

manifest_df = pd.DataFrame([manifest])
manifest_df.to_csv(DATA_DIR / "manifest_summary.csv", index=False)
print(f"   ✓ Generated manifest summary")

print("\n" + "="*80)
print("CSV DATA GENERATION COMPLETE!")
print("="*80)
print("\nSummary:")
print(f"  • Vendors: {len(vendors_df)}")
print(f"  • Purchase Orders: {len(po_df)}")
print(f"  • Goods Receipts: {len(gr_df)}")
print(f"  • Invoices: {len(invoices_df)}")
print(f"  • Supplier Records: {len(supplier_df)}")
print(f"  • Events: {len(events_df)}")
print("\nNext: Run document generation scripts for PDFs, Excel, Word, etc.")
print("="*80)

#!/usr/bin/env python3
"""
Documentation Generator - Creates README, index.html, and data dictionary
"""

from pathlib import Path
from datetime import datetime
import pandas as pd
import json

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"

print("="*80)
print("DOCUMENTATION GENERATOR")
print("="*80)

# Load data for statistics
vendors_df = pd.read_csv(DATA_DIR / "vendors.csv")
invoices_df = pd.read_csv(DATA_DIR / "invoices.csv")
po_df = pd.read_csv(DATA_DIR / "po_gr.csv")
supplier_df = pd.read_csv(DATA_DIR / "supplier_history.csv")
events_df = pd.read_csv(DATA_DIR / "events_sample.csv")
manifest_df = pd.read_csv(DATA_DIR / "manifest_summary.csv")

print("\n[12/13] Generating documentation files...")

# ============================================================================
# README.MD
# ============================================================================

readme_content = f"""# Source-to-Settle AI Demo - Synthetic Dataset

## 📊 Dataset Overview

This is a comprehensive synthetic dataset for demonstrating an **AI-Powered Source-to-Settle workflow** with 6 autonomous agents processing vendors from onboarding through payment to performance analytics.

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Version:** 1.0.0

---

## 📁 Directory Structure

```
data/
├── README.md                      # This file
├── index.html                     # Visual browser-based index
├── manifest_summary.csv           # Dataset metadata summary
├── vendors.csv                    # Master vendor table ({len(vendors_df)} vendors)
├── vendors_master_database.xlsx   # Enhanced vendor database with multiple sheets
├── invoices.csv                   # Invoice records ({len(invoices_df)} invoices)
├── invoices_register.xlsx         # Comprehensive invoice tracking register
├── po_gr.csv                      # Purchase Orders & Goods Receipts ({len(po_df)} POs)
├── supplier_history.csv           # Performance analytics ({len(supplier_df)} vendors)
├── events_sample.csv              # Agent activity log ({len(events_df)} events)
│
├── kyc_samples/                   # KYC documents per vendor
│   ├── VENDOR-XXXX_KYC.pdf        # Comprehensive KYC document
│   ├── VENDOR-XXXX_company_profile.docx  # Company profile
│   └── ...                        # ({len(vendors_df)} vendors × 2 files)
│
├── invoices_pdf/                  # Invoice PDFs
│   ├── INV-XXXX_digital.pdf       # Clean digital invoices
│   ├── INV-XXXX_scanned.pdf       # Scanned-style invoices
│   └── ...                        # ({len(invoices_df)} invoice PDFs)
│
├── contracts/                     # Contract documents
│   ├── VENDOR-XXXX_contract_draft_v1.docx      # Draft with review comments
│   ├── VENDOR-XXXX_contract_final_signed.pdf   # Signed final version
│   └── ...                        # (~{len(vendors_df[vendors_df['status']=='APPROVED'])} approved vendors × 2 files)
│
├── supplier_performance/          # Performance reports
│   ├── VENDOR-XXXX_scorecard.xlsx # Detailed KPI scorecard
│   └── ...                        # ({len(supplier_df)} scorecards)
│
└── presentation_assets/           # Demo materials
    ├── dashboards_screenshots/    # UI mockup screenshots
    └── logos/                     # Vendor and system logos
```

---

## 📈 Dataset Statistics

### Vendors
- **Total Vendors:** {len(vendors_df)}
- **Approved:** {len(vendors_df[vendors_df['status']=='APPROVED'])} ({len(vendors_df[vendors_df['status']=='APPROVED'])/len(vendors_df)*100:.0f}%)
- **Pending:** {len(vendors_df[vendors_df['status']=='PENDING'])} ({len(vendors_df[vendors_df['status']=='PENDING'])/len(vendors_df)*100:.0f}%)
- **Rejected:** {len(vendors_df[vendors_df['status']=='REJECTED'])} ({len(vendors_df[vendors_df['status']=='REJECTED'])/len(vendors_df)*100:.0f}%)

### Risk Distribution
- **LOW Risk:** {len(vendors_df[vendors_df['risk_band']=='LOW'])} vendors
- **MEDIUM Risk:** {len(vendors_df[vendors_df['risk_band']=='MEDIUM'])} vendors
- **HIGH Risk:** {len(vendors_df[vendors_df['risk_band']=='HIGH'])} vendors

### Invoices
- **Total Invoices:** {len(invoices_df)}
- **MATCHED:** {len(invoices_df[invoices_df['status']=='MATCHED'])} ({len(invoices_df[invoices_df['status']=='MATCHED'])/len(invoices_df)*100:.0f}%)
- **DUPLICATE:** {len(invoices_df[invoices_df['status']=='DUPLICATE'])} ({len(invoices_df[invoices_df['status']=='DUPLICATE'])/len(invoices_df)*100:.0f}%)
- **EXCEPTION:** {len(invoices_df[invoices_df['status']=='EXCEPTION'])} ({len(invoices_df[invoices_df['status']=='EXCEPTION'])/len(invoices_df)*100:.0f}%)
- **PENDING:** {len(invoices_df[invoices_df['status']=='PENDING'])} ({len(invoices_df[invoices_df['status']=='PENDING'])/len(invoices_df)*100:.0f}%)

### Total Amount
- **Total Invoice Value:** ₹{invoices_df['total_amount'].sum():,.2f}
- **Average Invoice:** ₹{invoices_df['total_amount'].mean():,.2f}

### Purchase Orders
- **Total POs:** {len(po_df)}
- **Closed (with GR):** {len(po_df[po_df['status']=='CLOSED'])}
- **Open:** {len(po_df[po_df['status']=='OPEN'])}

---

## 🤖 AI Agents Covered

| Agent | Responsibility | Event Types |
|-------|---------------|-------------|
| **VendorIntakeAgent** | Auto-create & validate vendor profiles | VENDOR_CREATED, VENDOR_APPROVED |
| **RiskGuardAgent** | KYC/AML scoring & risk assessment | RISK_ASSESSED, KYC_EXTRACTED |
| **ContractCraftAgent** | Auto-generate contract drafts | CONTRACT_GENERATED, CONTRACT_REVIEWED |
| **InvoiceIQAgent** | OCR, matching, duplicate detection | INVOICE_MATCHED, INVOICE_DUPLICATE_DETECTED |
| **PayFlowAgent** | Payment readiness & settlement | PAYMENT_QUEUED, PAYMENT_PROCESSED |
| **Supplier360Agent** | Performance analytics & recommendations | PERFORMANCE_CALCULATED, RECOMMENDATION_GENERATED |

---

## 👥 Personas Supported

### 1. **Ananya (Procurement Operations Specialist)**
- Full workflow user
- Creates vendors, uploads invoices
- Runs orchestrator end-to-end

### 2. **Rohan (Finance Reviewer)**
- Mid-workflow reviewer
- Validates risk, contracts, invoices
- Reviews payment readiness

### 3. **Neha (Business Manager)**
- Insight consumer
- Reviews supplier performance
- Makes renewal/retender decisions

---

## 📄 File Formats Included

The dataset includes realistic documents in multiple formats:

- **CSV** - Master data tables
- **PDF (Digital)** - Clean, computer-generated documents
- **PDF (Scanned)** - Realistic scanned documents with imperfections
- **Excel (.xlsx)** - Multi-tab workbooks with formulas and charts
- **Word (.docx)** - Contract drafts with track changes and comments
- **Images** - Logos, screenshots (coming in Phase 2)
- **JSON** - Event logs and agent decision data

---

## 🎯 Use Cases

### 1. **End-to-End Demo**
- Show complete vendor lifecycle from onboarding to payment
- Demonstrate AI agent autonomy and decision-making

### 2. **OCR & Document Processing**
- Test invoice extraction from multiple formats
- Handle scanned documents and images
- Detect duplicates and exceptions

### 3. **Risk & Compliance**
- Automated KYC processing
- Risk scoring and band assignment
- Contract clause analysis

### 4. **Analytics & Insights**
- Supplier performance dashboards
- Renewal recommendations
- Trend analysis

---

## 🔧 Data Generation Methodology

All data is synthetically generated using:
- **Faker** library for realistic names, addresses, companies
- **ReportLab** for PDF generation
- **OpenPyXL** for Excel documents
- **Python-docx** for Word documents
- Custom algorithms for business logic and relationships

### Key Features:
✓ Referential integrity maintained across all tables
✓ Realistic Indian company names and formats
✓ Valid-format PAN, GST, IFSC codes
✓ Proper tax calculations (18% GST with CGST/SGST breakdown)
✓ Logical date sequences (PO → GR → Invoice → Payment)
✓ Status distributions matching real-world scenarios

---

## 📊 Data Dictionary

### vendors.csv
| Field | Type | Description |
|-------|------|-------------|
| vendor_id | String | Unique vendor identifier (VENDOR-XXXX) |
| vendor_name | String | Company name |
| country | String | Country of operation |
| state | String | State (for Indian vendors) |
| city | String | City |
| industry | String | Business industry |
| contact_email | Email | Primary contact email |
| phone | String | Contact phone number |
| status | Enum | APPROVED, PENDING, REJECTED |
| risk_band | Enum | LOW, MEDIUM, HIGH |
| onboarding_date | Date | Date vendor was onboarded |
| last_updated | Date | Last update timestamp |
| pan | String | PAN number (Indian vendors) |
| gst | String | GST number (Indian vendors) |
| tax_id | String | Tax ID (international vendors) |
| registration_number | String | Company registration number |
| website | URL | Company website |
| primary_contact_name | String | Primary contact person |
| primary_contact_title | String | Contact's designation |
| bank_account | String | Bank account number |
| ifsc_code | String | IFSC code (Indian vendors) |
| swift_code | String | SWIFT code (international) |

### invoices.csv
| Field | Type | Description |
|-------|------|-------------|
| invoice_id | String | Unique invoice identifier (INV-XXXX) |
| vendor_id | String | Reference to vendors.csv |
| invoice_number | String | Vendor's invoice number |
| invoice_date | Date | Invoice date |
| due_date | Date | Payment due date |
| base_amount | Decimal | Pre-tax amount |
| cgst | Decimal | Central GST (9%) |
| sgst | Decimal | State GST (9%) |
| igst | Decimal | Integrated GST |
| total_amount | Decimal | Total including taxes |
| currency | String | Currency code (INR) |
| status | Enum | MATCHED, DUPLICATE, EXCEPTION, PENDING |
| po_reference | String | Linked PO ID |
| gr_reference | String | Linked GR ID |
| submission_date | Date | Date submitted to system |
| payment_date | Date | Date payment processed |
| payment_terms | String | Payment terms (Net 30/45/60) |
| description | String | Invoice description |
| line_items | Integer | Number of line items |

### po_gr.csv
| Field | Type | Description |
|-------|------|-------------|
| po_id | String | Purchase Order ID (PO-XXXX) |
| po_number | String | PO document number |
| vendor_id | String | Reference to vendors.csv |
| po_date | Date | PO creation date |
| po_amount | Decimal | PO total amount |
| currency | String | Currency code |
| description | String | PO description |
| delivery_date | Date | Expected delivery date |
| status | Enum | OPEN, CLOSED |
| line_items_count | Integer | Number of line items |

### supplier_history.csv
| Field | Type | Description |
|-------|------|-------------|
| vendor_id | String | Reference to vendors.csv |
| vendor_name | String | Vendor name |
| total_invoices_processed | Integer | Total invoice count |
| total_amount_paid | Decimal | Total amount paid |
| on_time_payment_rate | Decimal | % of on-time payments |
| dispute_rate | Decimal | % of disputed invoices |
| average_cycle_time_days | Integer | Average processing time |
| last_invoice_date | Date | Most recent invoice |
| risk_band | Enum | Current risk band |
| risk_trend | Enum | IMPROVING, STABLE, DECLINING |
| recommendation | Enum | RENEW, MONITOR, RETENDER |
| quality_score | Decimal | Quality metric (0-100) |
| delivery_score | Decimal | Delivery metric (0-100) |
| compliance_score | Decimal | Compliance metric (0-100) |

### events_sample.csv
| Field | Type | Description |
|-------|------|-------------|
| event_id | String | Unique event ID (EVT-XXXXX) |
| timestamp | Datetime | Event timestamp |
| vendor_id | String | Related vendor |
| invoice_id | String | Related invoice (if applicable) |
| agent_name | String | AI agent that generated event |
| event_type | Enum | Event type code |
| description | String | Human-readable description |
| status | Enum | SUCCESS, WARNING, ERROR |
| confidence_score | Decimal | Agent confidence (0-1) |
| processing_time_ms | Integer | Processing time in milliseconds |

---

## 🚀 Getting Started

### Option 1: Browse in Excel/CSV
Open CSV files directly in Excel, Google Sheets, or any spreadsheet application.

### Option 2: Use the Web Index
Open `index.html` in your browser for an interactive visual index.

### Option 3: Load into Database
```python
import pandas as pd

# Load data
vendors = pd.read_csv('data/vendors.csv')
invoices = pd.read_csv('data/invoices.csv')
pos = pd.read_csv('data/po_gr.csv')

# Example: Get all HIGH risk vendors
high_risk = vendors[vendors['risk_band'] == 'HIGH']
print(high_risk[['vendor_id', 'vendor_name', 'industry']])
```

### Option 4: Build Demo Application
Use this dataset as backend data for building the actual Source-to-Settle AI demo.

---

## ⚠️ Important Notes

- This is **synthetic data** for demonstration purposes only
- All company names, addresses, and identifiers are fictitious
- PAN, GST, and bank details follow valid formats but are randomly generated
- Relationships between entities (Vendor → PO → Invoice) are maintained for realism

---

## 📝 Version History

- **v1.0.0** ({datetime.now().strftime('%Y-%m-%d')}) - Initial dataset generation
  - {len(vendors_df)} vendors
  - {len(invoices_df)} invoices
  - {len(po_df)} purchase orders
  - {len(events_df)} event records
  - Multiple document formats (PDF, Excel, Word)

---

## 📧 Support

For questions or issues with this dataset:
- Review the documentation in this README
- Check `manifest_summary.csv` for dataset metadata
- Refer to individual document files for detailed data

---

**Generated with ❤️ for Source-to-Settle AI Demo**
"""

readme_path = DATA_DIR / "README.md"
with open(readme_path, 'w', encoding='utf-8') as f:
    f.write(readme_content)

print("   ✓ Generated README.md")

# ============================================================================
# INDEX.HTML
# ============================================================================

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Source-to-Settle Demo Dataset</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 0;
        }}
        .container {{
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }}
        .header {{
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }}
        .stat-card:hover {{
            transform: translateY(-5px);
        }}
        .stat-number {{
            font-size: 2.5rem;
            font-weight: bold;
        }}
        .stat-label {{
            font-size: 1rem;
            opacity: 0.9;
        }}
        .file-section {{
            margin-top: 40px;
        }}
        .file-list {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 15px;
        }}
        .file-item {{
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .file-item:last-child {{
            border-bottom: none;
        }}
        .file-icon {{
            width: 40px;
            text-align: center;
            margin-right: 15px;
        }}
        .badge-custom {{
            padding: 5px 15px;
            border-radius: 20px;
        }}
        .agent-card {{
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-robot"></i> Source-to-Settle AI Demo</h1>
            <h3>Synthetic Dataset Index</h3>
            <p class="text-muted">Generated on {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}</p>
        </div>

        <!-- Statistics Dashboard -->
        <div class="row">
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number">{len(vendors_df)}</div>
                    <div class="stat-label"><i class="fas fa-building"></i> Vendors</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number">{len(invoices_df)}</div>
                    <div class="stat-label"><i class="fas fa-file-invoice"></i> Invoices</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number">{len(po_df)}</div>
                    <div class="stat-label"><i class="fas fa-shopping-cart"></i> Purchase Orders</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number">{len(events_df)}</div>
                    <div class="stat-label"><i class="fas fa-clock"></i> Events</div>
                </div>
            </div>
        </div>

        <!-- Additional Stats -->
        <div class="row mt-4">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h5>Total Invoice Value</h5>
                        <h3 class="text-success">₹{invoices_df['total_amount'].sum():,.0f}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h5>Approved Vendors</h5>
                        <h3 class="text-primary">{len(vendors_df[vendors_df['status']=='APPROVED'])}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h5>Matched Invoices</h5>
                        <h3 class="text-info">{len(invoices_df[invoices_df['status']=='MATCHED'])}</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- AI Agents Section -->
        <div class="file-section">
            <h2><i class="fas fa-brain"></i> AI Agents</h2>
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="agent-card">
                        <h5><i class="fas fa-user-plus"></i> VendorIntakeAgent</h5>
                        <p class="mb-0">Auto-create & validate vendor profiles</p>
                    </div>
                    <div class="agent-card">
                        <h5><i class="fas fa-shield-alt"></i> RiskGuardAgent</h5>
                        <p class="mb-0">KYC/AML scoring & risk assessment</p>
                    </div>
                    <div class="agent-card">
                        <h5><i class="fas fa-file-contract"></i> ContractCraftAgent</h5>
                        <p class="mb-0">Auto-generate contract drafts</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="agent-card">
                        <h5><i class="fas fa-receipt"></i> InvoiceIQAgent</h5>
                        <p class="mb-0">OCR, matching, duplicate detection</p>
                    </div>
                    <div class="agent-card">
                        <h5><i class="fas fa-money-check-alt"></i> PayFlowAgent</h5>
                        <p class="mb-0">Payment readiness & settlement</p>
                    </div>
                    <div class="agent-card">
                        <h5><i class="fas fa-chart-line"></i> Supplier360Agent</h5>
                        <p class="mb-0">Performance analytics & recommendations</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- File Index -->
        <div class="file-section">
            <h2><i class="fas fa-folder-open"></i> Dataset Files</h2>

            <h4 class="mt-4">Master Data Files</h4>
            <div class="file-list">
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-file-csv fa-2x text-success"></i></div>
                        <div>
                            <strong>vendors.csv</strong>
                            <div class="text-muted">Master vendor table - {len(vendors_df)} records</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-success">{len(vendors_df)} rows</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-file-excel fa-2x text-success"></i></div>
                        <div>
                            <strong>vendors_master_database.xlsx</strong>
                            <div class="text-muted">Enhanced vendor database with analytics</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-info">Excel</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-file-csv fa-2x text-primary"></i></div>
                        <div>
                            <strong>invoices.csv</strong>
                            <div class="text-muted">Invoice records - {len(invoices_df)} invoices</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-primary">{len(invoices_df)} rows</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-file-excel fa-2x text-primary"></i></div>
                        <div>
                            <strong>invoices_register.xlsx</strong>
                            <div class="text-muted">Comprehensive invoice tracking register</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-info">Excel</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-file-csv fa-2x text-warning"></i></div>
                        <div>
                            <strong>po_gr.csv</strong>
                            <div class="text-muted">Purchase Orders & Goods Receipts - {len(po_df)} records</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-warning">{len(po_df)} rows</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-file-csv fa-2x text-info"></i></div>
                        <div>
                            <strong>supplier_history.csv</strong>
                            <div class="text-muted">Performance analytics - {len(supplier_df)} vendors</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-info">{len(supplier_df)} rows</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-file-csv fa-2x text-secondary"></i></div>
                        <div>
                            <strong>events_sample.csv</strong>
                            <div class="text-muted">Agent activity log - {len(events_df)} events</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-secondary">{len(events_df)} rows</span>
                </div>
            </div>

            <h4 class="mt-4">Document Folders</h4>
            <div class="file-list">
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-folder fa-2x text-primary"></i></div>
                        <div>
                            <strong>kyc_samples/</strong>
                            <div class="text-muted">KYC documents - PDFs and Word docs</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-primary">{len(vendors_df)*2} files</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-folder fa-2x text-danger"></i></div>
                        <div>
                            <strong>invoices_pdf/</strong>
                            <div class="text-muted">Invoice PDFs - digital and scanned</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-danger">{len(invoices_df)} PDFs</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-folder fa-2x text-success"></i></div>
                        <div>
                            <strong>contracts/</strong>
                            <div class="text-muted">Contract documents - Word and PDF</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-success">{len(vendors_df[vendors_df['status']=='APPROVED'])*2} files</span>
                </div>
                <div class="file-item">
                    <div class="d-flex align-items-center">
                        <div class="file-icon"><i class="fas fa-folder fa-2x text-warning"></i></div>
                        <div>
                            <strong>supplier_performance/</strong>
                            <div class="text-muted">Performance scorecards (Excel)</div>
                        </div>
                    </div>
                    <span class="badge badge-custom bg-warning">{len(supplier_df)} files</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-5 pt-4 border-top">
            <p class="text-muted">
                <i class="fas fa-database"></i> Dataset Version 1.0.0 |
                Generated {datetime.now().strftime('%B %d, %Y')} |
                <i class="fas fa-robot"></i> AI-Powered Source-to-Settle Demo
            </p>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
"""

index_path = DATA_DIR / "index.html"
with open(index_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("   ✓ Generated index.html")

print("\n" + "="*80)
print("DOCUMENTATION GENERATION COMPLETE!")
print("="*80)
print(f"\n✓ README.md created at: {readme_path}")
print(f"✓ index.html created at: {index_path}")
print("\nOpen index.html in your browser to explore the dataset visually!")

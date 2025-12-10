# Source-to-Settle AI Demo - Synthetic Dataset

## 📊 Dataset Overview

This is a comprehensive synthetic dataset for demonstrating an **AI-Powered Source-to-Settle workflow** with 6 autonomous agents processing vendors from onboarding through payment to performance analytics.

**Generated:** 2025-12-09 12:07:31
**Version:** 1.0.0

---

## 📁 Directory Structure

```
data/
├── README.md                      # This file
├── index.html                     # Visual browser-based index
├── manifest_summary.csv           # Dataset metadata summary
├── vendors.csv                    # Master vendor table (20 vendors)
├── vendors_master_database.xlsx   # Enhanced vendor database with multiple sheets
├── invoices.csv                   # Invoice records (80 invoices)
├── invoices_register.xlsx         # Comprehensive invoice tracking register
├── po_gr.csv                      # Purchase Orders & Goods Receipts (50 POs)
├── supplier_history.csv           # Performance analytics (13 vendors)
├── events_sample.csv              # Agent activity log (100 events)
│
├── kyc_samples/                   # KYC documents per vendor
│   ├── VENDOR-XXXX_KYC.pdf        # Comprehensive KYC document
│   ├── VENDOR-XXXX_company_profile.docx  # Company profile
│   └── ...                        # (20 vendors × 2 files)
│
├── invoices_pdf/                  # Invoice PDFs
│   ├── INV-XXXX_digital.pdf       # Clean digital invoices
│   ├── INV-XXXX_scanned.pdf       # Scanned-style invoices
│   └── ...                        # (80 invoice PDFs)
│
├── contracts/                     # Contract documents
│   ├── VENDOR-XXXX_contract_draft_v1.docx      # Draft with review comments
│   ├── VENDOR-XXXX_contract_final_signed.pdf   # Signed final version
│   └── ...                        # (~15 approved vendors × 2 files)
│
├── supplier_performance/          # Performance reports
│   ├── VENDOR-XXXX_scorecard.xlsx # Detailed KPI scorecard
│   └── ...                        # (13 scorecards)
│
└── presentation_assets/           # Demo materials
    ├── dashboards_screenshots/    # UI mockup screenshots
    └── logos/                     # Vendor and system logos
```

---

## 📈 Dataset Statistics

### Vendors
- **Total Vendors:** 20
- **Approved:** 15 (75%)
- **Pending:** 3 (15%)
- **Rejected:** 2 (10%)

### Risk Distribution
- **LOW Risk:** 12 vendors
- **MEDIUM Risk:** 6 vendors
- **HIGH Risk:** 2 vendors

### Invoices
- **Total Invoices:** 80
- **MATCHED:** 50 (62%)
- **DUPLICATE:** 10 (12%)
- **EXCEPTION:** 15 (19%)
- **PENDING:** 5 (6%)

### Total Amount
- **Total Invoice Value:** ₹157,699,161.18
- **Average Invoice:** ₹1,971,239.51

### Purchase Orders
- **Total POs:** 50
- **Closed (with GR):** 34
- **Open:** 16

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

- **v1.0.0** (2025-12-09) - Initial dataset generation
  - 20 vendors
  - 80 invoices
  - 50 purchase orders
  - 100 event records
  - Multiple document formats (PDF, Excel, Word)

---

## 📧 Support

For questions or issues with this dataset:
- Review the documentation in this README
- Check `manifest_summary.csv` for dataset metadata
- Refer to individual document files for detailed data

---

**Generated with ❤️ for Source-to-Settle AI Demo**

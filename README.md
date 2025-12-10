# Source-to-Settle AI Demo

**AI-Powered Procurement Automation with Multi-Agent Workflow**

## Overview

### Key Features

- **🤖 6 Specialized AI Agents**: Each handling a specific stage of procurement
- **📄 Multi-Format Document Processing**: PDF.js, Tesseract.js OCR, Excel/CSV parsing
- **🔄 End-to-End Workflow**: Vendor onboarding → Risk validation → Contract generation → Invoice processing → Payment execution → Analytics
- **📊 Real-Time Processing**: Stream LLM responses with visual progress tracking
- **🎨 Modern UI**: Bootstrap 5, responsive design, dark mode support
- **🚀 Zero Backend**: Pure front-end app deployable on GitHub Pages
- **📦 Sample Data**: 168+ realistic synthetic procurement documents

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (index.html)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  File      │  │  Workflow  │  │  Progress  │  │  Results   │   │
│  │  Upload    │  │  Stages    │  │  Timeline  │  │  Display   │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   DOCUMENT PROCESSING LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  PDF.js      │  │  Tesseract   │  │  XLSX Parser │             │
│  │  Text Extract│  │  OCR Engine  │  │  Excel/CSV   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MULTI-AGENT ORCHESTRATION                          │
│                                                                       │
│  Stage 1: VendorIntakeAgent      → Vendor Onboarding                │
│           ├─ Extract company info, PAN, GST, bank details           │
│           └─ Validate registration documents                         │
│                                                                       │
│  Stage 2: RiskGuardAgent          → Risk Assessment                  │
│           ├─ Financial & compliance risk scoring                     │
│           └─ Assign risk bands (LOW/MEDIUM/HIGH)                     │
│                                                                       │
│  Stage 3: ContractCraftAgent      → Contract Generation              │
│           ├─ Generate MSA templates                                  │
│           └─ Flag risky clauses                                      │
│                                                                       │
│  Stage 4: InvoiceIQAgent          → Invoice Processing               │
│           ├─ Extract invoice data, validate tax                      │
│           └─ Match with PO/GR, flag discrepancies                    │
│                                                                       │
│  Stage 5: PayFlowAgent            → Payment Execution                │
│           ├─ Schedule payments per terms                             │
│           └─ Generate payment instructions                           │
│                                                                       │
│  Stage 6: Supplier360Agent        → Supplier Analytics               │
│           ├─ Calculate performance KPIs                              │
│           └─ Trend analysis & recommendations                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LLM INTEGRATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Straive LLM Foundry / OpenAI-Compatible API                 │  │
│  │  ├─ Streaming responses (asyncLLM)                           │  │
│  │  ├─ JSON schema validation                                   │  │
│  │  └─ Temperature-controlled generation                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SYNTHETIC DATA LAYER                            │
│  ├─ 20 Vendors (15 Approved, 3 Pending, 2 Rejected)                 │
│  ├─ 80 Invoices (₹157M+ total value)                                │
│  ├─ 50 Purchase Orders with Goods Receipts                          │
│  ├─ 13 Supplier Performance Scorecards                              │
│  ├─ 75 Invoice PDFs (digital + scanned)                             │
│  ├─ 40 KYC Documents (PDF + Word)                                   │
│  ├─ 30 Contracts (PDF + Word with track changes)                    │
│  └─ 3 Excel Reports (Vendor DB, Invoice Register, Scorecards)       │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- LLM API access (Straive LLM Foundry, OpenAI, or compatible)
- No build tools required!

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/prudhvi1709/source-to-settle.git
   cd source-to-settle
   ```

2. **Start local server**
   ```bash
   npm run dev
   # or
   python3 -m http.server 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Configure LLM**
   - Click the "Configure LLM" button (🪄) in the navbar
   - Enter your LLM API endpoint and key
   - Configuration is saved in browser localStorage

### Deployment (GitHub Pages)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy Source-to-Settle AI Demo"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch, "/ (root)" folder
   - Save

3. **Access your demo**
   ```
   https://prudhvi1709.github.io/source-to-settle/
   ```

## How to Use

### Method 1: Quick Demo Scenarios

1. Navigate to the **"Quick Demo Scenarios"** section
2. Click **"Run Demo"** on any scenario card:
   - **New Vendor Onboarding**: Process KYC documents
   - **Invoice Processing**: Validate invoices against POs
   - **Supplier Performance Review**: Analyze supplier metrics
   - **End-to-End Workflow**: Complete procurement cycle
3. Watch as sample files are loaded and processed automatically

### Method 2: Upload Your Own Documents

1. **Upload Files**
   - Drag & drop files into the upload zone
   - Or click to browse and select files
   - Supported formats: PDF, Excel (.xlsx, .xls), CSV, Word (.doc, .docx), Images (.jpg, .png)

2. **Preview Documents**
   - Click the 👁️ icon next to any file to preview
   - PDF: First page rendered as canvas
   - Excel/CSV: Table preview of first sheet
   - Images: Full image preview

3. **Process Documents**
   - Click **"Process Documents"** button
   - Watch real-time progress in the timeline
   - View agent outputs as they stream in
   - Review final results with summaries, findings, and recommendations

### Method 3: Load Sample Data

1. Navigate to the **"Sample Data Available"** section
2. Click **"Load Sample"** on any data type:
   - **CSV Data**: Vendors, Invoices, POs
   - **PDF Documents**: Invoices, Contracts, KYC
   - **Excel Reports**: Vendor Database, Scorecards
3. Process loaded samples through the workflow

## What to Upload Where

### For Vendor Onboarding (Stages 1-3)

| Document Type | Example File | Agent Processing |
|---------------|--------------|------------------|
| KYC PDF | `VENDOR-0002-kyc.pdf` | VendorIntakeAgent extracts company info, PAN, GST |
| Company Profile (Word) | `VENDOR-0003-company-profile.docx` | VendorIntakeAgent extracts services, certifications |
| Contract PDF | `CONTRACT-VENDOR-0004.pdf` | ContractCraftAgent validates terms, flags risky clauses |
| Vendor CSV | `vendors.csv` | VendorIntakeAgent processes bulk vendor data |

### For Invoice Processing (Stages 4-5)

| Document Type | Example File | Agent Processing |
|---------------|--------------|------------------|
| Digital Invoice PDF | `INV-00001.pdf` | InvoiceIQAgent extracts invoice data, validates tax |
| Scanned Invoice (Image) | `INV-00015-scanned.pdf` | OCR extraction + InvoiceIQAgent validation |
| PO/GR CSV | `po_gr.csv` | InvoiceIQAgent matches invoices with POs |
| Invoice Register (Excel) | `Invoice_Register.xlsx` | InvoiceIQAgent bulk processing |

### For Supplier Analytics (Stage 6)

| Document Type | Example File | Agent Processing |
|---------------|--------------|------------------|
| Supplier History CSV | `supplier_history.csv` | Supplier360Agent calculates KPIs |
| Scorecard Excel | `Scorecard_VENDOR-0002.xlsx` | Supplier360Agent analyzes performance trends |
| Invoice CSV | `invoices.csv` | Supplier360Agent aggregates payment data |

## Sample Data Structure

The `data/` folder contains 168+ files organized as:

```
data/
├── vendors.csv                    # 20 vendors with registration details
├── invoices.csv                   # 80 invoices with status tracking
├── po_gr.csv                      # 50 POs with goods receipt data
├── supplier_history.csv           # 13 vendor performance records
├── events_sample.csv              # 100 agent event logs
├── Vendor_Database.xlsx           # Multi-sheet vendor master
├── Invoice_Register.xlsx          # Invoice tracking spreadsheet
├── invoices_pdf/                  # 75 invoice PDFs (64 digital + 11 scanned)
│   ├── INV-00001.pdf
│   └── ...
├── kyc_samples/                   # 40 files (20 PDFs + 20 Word)
│   ├── VENDOR-0002-kyc.pdf
│   ├── VENDOR-0002-company-profile.docx
│   └── ...
├── contracts/                     # 30 files (15 PDFs + 15 Word)
│   ├── CONTRACT-VENDOR-0002.pdf
│   ├── CONTRACT-VENDOR-0002-draft.docx
│   └── ...
├── supplier_performance/          # 13 Excel scorecards
│   ├── Scorecard_VENDOR-0002.xlsx
│   └── ...
└── purchase_orders/               # (Future: Individual PO documents)
```

## Configuration

### Settings Form (Collapsible)

- **LLM Model**: Select model (gpt-5-nano, gpt-5-mini, gpt-4.1-nano, gpt-4.1-mini)
- **Temperature**: Control response randomness (0.0 - 2.0, default: 0.3)
- **Enable OCR**: Toggle Tesseract.js OCR for scanned documents
- **Auto-process**: Automatically process files on upload

### config.json

Edit `config.json` to customize:

```json
{
  "defaults": {
    "model": "gpt-5-mini",
    "temperature": 0.3
  },
  "agents": [
    {
      "name": "VendorIntakeAgent",
      "stage": "Stage 1",
      "icon": "bi bi-building",
      "description": "...",
      "role": "...",
      "task": "..."
    }
    // ... more agents
  ],
  "demos": [
    {
      "title": "New Vendor Onboarding",
      "icon": "bi bi-person-plus",
      "description": "...",
      "files": ["data/kyc_samples/VENDOR-0002-kyc.pdf"]
    }
    // ... more demos
  ]
}
```

## Technical Stack

### Front-End Libraries (CDN)

| Library | Purpose | Version |
|---------|---------|---------|
| **Bootstrap 5** | UI framework, responsive design | 5.3.8 |
| **lit-html** | Efficient DOM updates | 3.3.1 |
| **asyncLLM** | Streaming LLM responses | 2.3.1 |
| **PDF.js** | PDF text extraction | 4.10.38 |
| **Tesseract.js** | OCR for scanned documents | 5.1.1 |
| **xlsx** | Excel/CSV parsing | 0.18.5 |
| **marked** | Markdown rendering | 13.0.3 |
| **highlight.js** | Code syntax highlighting | 11.11.1 |
| **partial-json** | Stream JSON parsing | 0.1.7 |
| **saveform** | Form state persistence | 1.4.0 |
| **bootstrap-alert** | Toast notifications | 1.1.1 |
| **bootstrap-llm-provider** | LLM config modal | 1.4.0 |

### Why No Backend?

- **Simplicity**: No server setup, deployment, or maintenance
- **Security**: API keys stored in browser localStorage, never on server
- **Cost**: Zero hosting costs with GitHub Pages
- **Speed**: All processing happens client-side with direct LLM API calls
- **Privacy**: User data never leaves their browser

## Development

### Code Style

```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Project Structure

```
source-to-settle/
├── index.html              # Main UI (workflow, upload, results)
├── script.js               # Core logic (file parsing, agent orchestration)
├── config.json             # Agent & demo configurations
├── package.json            # Dev dependencies & scripts
├── APP_README.md           # This file (comprehensive docs)
├── README.md               # Dataset documentation
├── data/                   # Sample synthetic data (168+ files)
└── assets/                 # Templates & guidelines
    ├── index.html          # Base template
    ├── script.js           # Base script template
    └── SKILL.md            # Development guidelines
```

## Troubleshooting

### Files Not Loading

- **Issue**: Sample files fail to load
- **Fix**: Ensure you're running from a local server (not `file://` protocol)
  ```bash
  npm run serve
  # or
  python3 -m http.server 8000
  ```

### LLM API Errors

- **Issue**: "LLM error: 401 Unauthorized"
- **Fix**: Click "Configure LLM" button and verify API key and endpoint
- **Note**: Default endpoint is `https://llmfoundry.straive.com/openai/v1`

### OCR Not Working

- **Issue**: Scanned PDFs return minimal text
- **Fix**:
  - Enable "OCR for scanned documents" in Settings
  - Tesseract.js downloads ~4MB language data on first use
  - Check browser console for download progress

### PDF Rendering Issues

- **Issue**: PDF preview shows blank or errors
- **Fix**:
  - PDF.js worker automatically loaded from CDN
  - Check browser console for CORS errors
  - Ensure PDF is not password-protected

### Excel Parsing Errors

- **Issue**: Excel preview not displaying
- **Fix**:
  - Supported formats: .xlsx, .xls, .csv
  - .xls (old Excel format) may have limited support
  - Try opening in Excel and saving as .xlsx

## Performance Considerations

### File Size Limits

- **Individual files**: Recommended < 5 MB
- **Total upload**: Recommended < 20 MB
- **Synthetic dataset**: ~3.7 MB total

### OCR Performance

- Tesseract.js processes ~1 page per 2-3 seconds
- Large scanned PDFs may take several minutes
- Consider disabling OCR for quick demos with digital documents

### LLM Response Times

- Streaming responses display incrementally (1-5 seconds)
- Full agent processing: 5-15 seconds per agent
- End-to-end workflow (6 agents): ~1-2 minutes

## Personas & Use Cases

### Ananya (Procurement Operations)

- **Role**: Daily vendor management, invoice processing
- **Workflow**: Upload invoices → Validate → Track payments
- **Benefits**: 70% faster processing, automated validation

### Rohan (Finance Reviewer)

- **Role**: Compliance, risk management, payment approval
- **Workflow**: Review risk assessments → Approve contracts → Monitor payments
- **Benefits**: Real-time risk insights, automated compliance checks

### Neha (Business Manager)

- **Role**: Supplier performance, strategic sourcing decisions
- **Workflow**: Analyze supplier scorecards → Review trends → Make renewal decisions
- **Benefits**: Data-driven insights, performance trend visualization

## Future Enhancements

- [ ] Pyodide integration for Python-based data analysis
- [ ] DuckDB WASM for SQL queries on uploaded data
- [ ] Multi-language OCR support (Hindi, Spanish, etc.)
- [ ] Export results as PDF reports
- [ ] Batch processing for large file sets
- [ ] Agent chaining with conditional logic
- [ ] Integration with ERP systems (SAP, Oracle)
- [ ] Real-time collaboration (multiple users)

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/prudhvi1709/source-to-settle/issues)
- **Discussions**: [GitHub Discussions](https://github.com/prudhvi1709/source-to-settle/discussions)
- **Email**: your-email@example.com

## Acknowledgments

- Built with [Straive LLM Foundry](https://llmfoundry.straive.com/)
- UI framework: [Bootstrap 5](https://getbootstrap.com/)
- PDF processing: [PDF.js](https://mozilla.github.io/pdf.js/)
- OCR engine: [Tesseract.js](https://tesseract.projectnaptha.com/)
- Excel parsing: [SheetJS](https://sheetjs.com/)

---
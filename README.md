# Source-to-Settle AI Demo

**Iterative Multi-Agent Procurement Automation**

*Where agents negotiate truth before money moves*

---

## 🎯 What Makes This Different?

Traditional invoice processing systems follow a **conveyor belt** approach:

```
Document → Extract → Validate → Approve → Pay
         (sequential, rigid, no reasoning)
```

This system uses **iterative agent negotiation**:

```
Round 1: Parallel Discovery
├─ All 6 agents analyze simultaneously
├─ VendorIntake finds missing insurance
├─ InvoiceIQ extracts $108/hr
├─ ContractCraft finds $100/hr in MSA
└─ Agents generate questions for each other

Round 2: Challenge & Verify
├─ RiskGuard: "Missing insurance = use 5% tolerance"
├─ ContractCraft → InvoiceIQ: "Is this OCR error?"
├─ InvoiceIQ: "Re-verified. Real variance."
└─ Agents analyze answers, decide next steps

Round 3: Policy Gate & Escalation
├─ RiskGuard: "8% > 5% = POLICY VIOLATION"
├─ PayFlow: "Payment BLOCKED"
├─ Supplier360: "First variance - update KPI"
└─ Escalate to CFO with full evidence package
```

**Key Differences:**
- ✅ Agents **question each other**, not just humans questioning agents
- ✅ Workflow **emerges from reasoning**, not pre-programmed paths
- ✅ Policy **adapts to context** (5% tolerance due to compliance gap)
- ✅ Payment **blocked automatically** when policy violated
- ✅ System **learns** - vendor profile updated for future invoices

---

## Overview

### Key Features

#### 🤖 Multi-Agent Collaboration
- **Iterative Agent Negotiation**: Agents question, challenge, and verify each other's findings over multiple rounds
- **Parallel Agent Activation**: All 6 agents start simultaneously (not sequential), analyzing documents in parallel
- **Agent-to-Agent Dialogue**: ContractCraft challenges InvoiceIQ's extraction → InvoiceIQ re-verifies → Agreement reached
- **Dynamic Policy Adaptation**: RiskGuard adjusts tolerance thresholds based on compliance gaps (5% vs 10%)
- **Real-Time Conversation Dashboard**: Watch agents negotiate with live message feed and metrics

#### 🎯 Intelligent Orchestration
- **Smart Document Routing**: Orchestrator analyzes documents and selects which agents to activate
- **Context-Aware Processing**: Invoice with missing insurance → Enhanced review mode → Stricter tolerance
- **Challenge-Response Pairs**: Visual highlighting when agents verify each other's work
- **Round Separators**: Clear visual breaks showing conversation progression

#### 🚨 Human-in-the-Loop (HITL)
- **Multi-Level Escalations**: Each agent prepares role-specific escalation packages (CFO, Compliance, Procurement)
- **Independent Resolution**: Accept/reject escalations independently without blocking workflow
- **Close Button**: Dismiss HITL modal without resolving every escalation (Esc key, click outside, or X button)
- **Decision Support Packages**: Pre-analyzed evidence and recommendations for quick human decisions

#### 🚀 Performance Optimizations
- **Prompt Caching**: Rounds 2-3 leverage Anthropic's prompt caching (50-70% faster)
- **Parallel Question Answering**: Agents answer multiple questions simultaneously (not sequential)
- **Streaming Responses**: Incremental UI updates as agents think and respond
- **Question Limits**: Configurable per scenario to control conversation depth vs speed

#### 📄 Document Processing
- **Multi-Format Support**: PDF.js, Tesseract.js OCR, Excel/CSV parsing, Word document extraction
- **OCR for Scanned Documents**: Automatic text extraction from images and scanned PDFs
- **Confidence Scoring**: All extractions include confidence levels (displayed to 2 decimals)

#### 🎨 Modern UI/UX
- **Bootstrap 5**: Responsive design, dark mode support, accessible components
- **Agent Roster Display**: Quick reference showing each agent's responsibility
- **Activity Stream Filters**: View all messages, questions only, challenges, or broadcasts
- **Round Progress Bar**: Visual indicator of conversation progress
- **Typing Indicators**: See which agents are actively thinking

#### 📊 Analytics & Learning
- **Conversation Analytics**: Track rounds, messages, escalations, average confidence
- **Supplier Learning Loop**: Supplier360 updates vendor KPIs and feeds insights back to RiskGuard
- **Future Behavior Adjustment**: First variance event → Monitor next invoice with enhanced scrutiny

#### 🚀 Zero Backend
- **Pure Front-End**: No server setup, deployment, or maintenance required
- **GitHub Pages Ready**: Deploy directly from repository
- **Privacy-First**: All processing happens client-side, API keys stored in browser localStorage
- **168+ Sample Documents**: Realistic synthetic procurement data included

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (index.html)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  File      │  │  Real-Time │  │  Activity  │  │  HITL      │   │
│  │  Upload    │  │  Dashboard │  │  Stream    │  │  Modals    │   │
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
│                     INTELLIGENT ORCHESTRATOR                         │
│  Analyzes documents → Detects scenario → Selects agents to activate │
│  (Invoice + Contract + Vendor → Activate all 6 agents)              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ITERATIVE MULTI-AGENT CONVERSATION                      │
│                                                                       │
│  ROUND 1: Parallel Discovery                                         │
│  ├─ All 6 agents activate simultaneously (not sequential)           │
│  ├─ VendorIntake: Extracts vendor data, detects missing insurance   │
│  ├─ InvoiceIQ: Extracts invoice line items, amounts, tax            │
│  ├─ ContractCraft: Validates contract rates                         │
│  ├─ RiskGuard: Assesses compliance gaps                             │
│  ├─ PayFlow: Prepares payment logic                                 │
│  ├─ Supplier360: Retrieves vendor history                           │
│  └─ Each agent generates questions for other agents                 │
│                                                                       │
│  ROUND 2: Answer & Challenge                                         │
│  ├─ Agents answer questions directed to them (parallel)             │
│  ├─ RiskGuard → All: "Use 5% tolerance due to missing insurance"   │
│  ├─ ContractCraft → InvoiceIQ: "Is $108 vs $100 an OCR error?"     │
│  ├─ InvoiceIQ → ContractCraft: "Re-verified. Real variance."       │
│  └─ Agents analyze answers and decide next actions                  │
│                                                                       │
│  ROUND 3: Resolution & Escalation                                    │
│  ├─ RiskGuard: "8% > 5% tolerance = POLICY VIOLATION"              │
│  ├─ PayFlow: "Payment BLOCKED per policy"                           │
│  ├─ Supplier360: "First variance event - update vendor KPI"         │
│  └─ Agents escalate to humans OR resolve                            │
│                                                                       │
│  FINAL SYNTHESIS: Verdict & Recommendations                          │
│  └─ Aggregate all agent decisions → ESCALATED_TO_HUMAN              │
│                                                                       │
│  AGENT ROSTER:                                                       │
│  🏢 VendorIntake: Validates vendor data, routes to risk/invoice     │
│  🛡️ RiskGuard: Sets policy thresholds, enforces variance tolerance  │
│  📋 ContractCraft: Validates rates vs contract, checks change orders│
│  📄 InvoiceIQ: Extracts invoice data, re-verifies when challenged   │
│  💰 PayFlow: Enforces payment policy, blocks violations             │
│  📊 Supplier360: Updates vendor KPIs, feeds learning back           │
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
   - **Invoice Variance & Compliance Gap** ⭐: Watch agents negotiate an 8% variance with missing insurance
   - **End-to-End Workflow**: Complete procurement cycle
3. Watch as sample files are loaded and processed automatically

### 🎯 Featured Scenario: Invoice Variance & Compliance Gap

This scenario demonstrates the full power of iterative agent negotiation:

**Setup:**
- Invoice shows $108/hr vs contract rate $100/hr (8% variance)
- Vendor missing insurance certificate (compliance gap)

**What Happens:**
1. **Orchestrator** scans documents → activates all 6 agents
2. **Round 1:** VendorIntake detects missing insurance → InvoiceIQ extracts $108 → ContractCraft finds $100 in contract
3. **Round 2:** RiskGuard sets 5% tolerance (due to compliance gap) → ContractCraft challenges InvoiceIQ: "Is this OCR error?" → InvoiceIQ re-verifies: "Real variance"
4. **Round 3:** RiskGuard: "8% > 5% = POLICY VIOLATION" → PayFlow blocks payment → Supplier360 updates vendor KPI
5. **Result:** ESCALATED_TO_HUMAN with 6 role-specific decision packages

**Key Observations:**
- Agents question each other (ContractCraft ↔ InvoiceIQ dialogue)
- Policy adapts to context (5% tolerance instead of 10%)
- Payment blocked automatically (policy enforcement)
- Learning loop activated (vendor profile updated)

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

## 📊 Real-Time Conversation Dashboard

Once processing starts, you'll see the **Multi-Agent Conversation** dashboard:

### Metrics (Top Row)
- **Questions Asked**: Total questions exchanged between agents (e.g., "0 of 12 questions asked")
- **Conversation Rounds**: Current round / max rounds (e.g., "Round 2 of 3")
- **Active Agents**: How many agents are currently working (e.g., "6 agents working in parallel")
- **Time Elapsed**: Real-time processing timer
- **Escalations**: Number of human escalations triggered
- **Avg Confidence**: Average confidence across all agent decisions (e.g., "87.65%")

### Agent Status Cards
Each agent shows:
- 🟢 **ACTIVE**: Currently thinking and generating messages
- ⏸️ **IDLE**: Waiting for responses or resolved
- ✅ **COMPLETED**: Finished all tasks
- ❌ **ERROR**: Encountered an issue

### Activity Stream
Watch agents communicate in real-time:
- **Questions** (blue): Agent asking another agent for information
- **Answers** (green): Agent responding to a question
- **Challenges** (yellow): Agent questioning another's finding (e.g., ContractCraft → InvoiceIQ)
- **Broadcasts** (red): Agent sending urgent signal to all agents
- **Round Separators**: Visual breaks showing "Round 2 Starting"
- **Challenge-Response Pairs**: Special cards highlighting verification dialogues

### Filters
- **All**: Show all conversation messages
- **Questions**: Show only question messages
- **Challenges**: Show only challenge-response pairs
- **Broadcasts**: Show only broadcast messages

## 🚨 Human-in-the-Loop (HITL) Escalations

When agents need human decisions, escalation modals appear:

### Escalation Types
- **POLICY_VIOLATION**: Exceeds policy thresholds (e.g., 8% > 5% variance)
- **LOW_CONFIDENCE**: Agent confidence too low to proceed (e.g., OCR < 70%)
- **AGENT_DEADLOCK**: Agents can't reach consensus after multiple rounds
- **HIGH_VALUE**: High-value transaction requiring executive approval
- **MISSING_DATA**: Critical data missing or incomplete
- **COMPLIANCE_ISSUE**: Regulatory concern detected

### HITL Modal Features
- **Navigation**: Previous/Next buttons to review multiple escalations
- **Counter**: Shows "2 of 6" escalations (with resolved count)
- **Context Table**: All evidence and data points
- **Agent Recommendation**: What the agent suggests you do
- **Conversation History**: Full dialogue leading to escalation
- **Action Buttons**:
  - ✅ **Approve**: Accept the action despite the issue
  - ❌ **Reject**: Block the action
  - ℹ️ **Request More Info**: Ask agents for additional data
- **Close Options**:
  - Click **X button** in top-right
  - Press **Esc key**
  - Click **outside modal** (on backdrop)
  - No need to resolve every escalation to dismiss modal

### Independent Escalation Resolution
Each escalation package is independent:
- CFO gets policy violation alert
- Compliance Officer gets missing insurance alert
- Procurement Manager gets vendor performance alert
- You can approve one, reject another, and close without resolving the third

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
| **D3.js** | Workflow visualization | 7.9.0 |

### Core Modules (ES6)

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **agenticAgent.js** | Agent class with reasoning | Initial analysis, question answering, answer analysis, escalation |
| **conversationManager.js** | Multi-round orchestration | Parallel activation, round transitions, agent injection |
| **messageBus.js** | Communication backbone | Message routing, HITL resolution, analytics tracking |
| **conversationUI.js** | Real-time feed | Message cards, challenge-response pairs, round separators |
| **conversationDashboard.js** | Executive dashboard | Metrics, agent status cards, activity stream filters |
| **hitlModal.js** | Human escalation UI | Independent resolution, navigation, close without resolving |
| **agentProtocol.js** | Message schemas | MessageType enum, QuestionMessage, AnswerMessage, EscalationMessage |
| **fileHandler.js** | Document processing | PDF extraction, OCR, Excel parsing, Word extraction |
| **promptLoader.js** | Dynamic prompts | Template loading, variable substitution, caching |

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
├── index.html                      # Main UI (conversation dashboard, HITL modals)
├── config.json                     # Agent & demo configurations
├── package.json                    # Dev dependencies & scripts
├── README.md                       # This file (comprehensive docs)
├── DEMO_SCRIPT.md                  # Client demo presentation script
├── src/                            # Source code (ES6 modules)
│   ├── main.js                     # Entry point, file upload, demo launcher
│   ├── agent.js                    # Multi-agentic workflow orchestration
│   ├── agenticAgent.js             # AgenticAgent class (questioning, answering)
│   ├── agentProtocol.js            # Message types, schemas, protocols
│   ├── conversationManager.js      # Multi-round conversation controller
│   ├── messageBus.js               # Agent communication bus, analytics
│   ├── conversationUI.js           # Real-time conversation feed UI
│   ├── conversationDashboard.js    # Executive dashboard with metrics
│   ├── hitlModal.js                # Human-in-the-Loop escalation modals
│   ├── fileHandler.js              # PDF/Excel/OCR document processing
│   ├── promptLoader.js             # Dynamic prompt templates
│   ├── ui.js                       # Results rendering, lit-html templates
│   ├── config.js                   # Configuration loader
│   └── workflow.js                 # Workflow visualization (D3.js)
├── prompts/                        # LLM prompt templates
│   ├── agent_initial.md            # Round 1 initial analysis
│   ├── agent_analyze.md            # Round 2+ answer analysis
│   ├── agent_answer.md             # Question answering template
│   └── orchestrator.md             # Orchestrator routing logic
├── data/                           # Sample synthetic data (168+ files)
│   ├── vendors.csv                 # 20 vendors
│   ├── invoices.csv                # 80 invoices
│   ├── invoices_pdf/               # 75 invoice PDFs
│   ├── kyc_samples/                # 40 KYC documents
│   ├── contracts/                  # 30 contracts
│   └── supplier_performance/       # 13 scorecards
└── DEMO_SCENARIOS.md               # Scenario descriptions & expected outcomes
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

### Multi-Agent Conversation Performance

**Round 1 (Initial Analysis):**
- All 6 agents process in parallel: ~30-60 seconds total
- Each agent makes 1 LLM call with document context
- **No prompt caching** - full processing for initial context

**Rounds 2-3 (Answer & Challenge):**
- Agents answer questions in parallel (up to 2 per agent per round)
- **70% faster with prompt caching** (Anthropic Claude 3.5+ only)
- Agent context (role, description, task) cached, only new prompts processed
- ~15-30 seconds per round (vs 60+ seconds without caching)

**Total Processing Time:**
- **Invoice Variance Scenario**: 2-3 minutes (12 questions, 2-3 rounds)
- **Simple Scenarios**: 1-2 minutes (6 questions, 2 rounds)
- **Complex Scenarios**: 4-5 minutes (25+ questions, 4-5 rounds)

**Performance Optimizations:**
- ✅ Parallel agent activation (not sequential)
- ✅ Parallel question answering within rounds
- ✅ Prompt caching for rounds 2+ (Anthropic API)
- ✅ Streaming responses with incremental UI updates
- ✅ Question limit per scenario (prevents runaway conversations)
- ✅ Agent resolution (stops when agent has no more questions)

**LLM Provider Comparison:**
- **Anthropic Claude 3.5+**: Full prompt caching support → 50-70% faster rounds 2-3
- **OpenAI**: No prompt caching → Full processing each round (slower but works)
- **Other Providers**: Caching headers ignored → Full processing (slower but works)

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

## 🎬 Client Demo Presentation

See **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)** for a complete presentation script including:

- **Opening pitch** (30 seconds): "Agents negotiate truth before money moves"
- **Act 1: Parallel Discovery** (90 seconds): Show orchestrator + parallel agent activation
- **Act 2: Policy Enforcement** (60 seconds): Highlight 8% > 5% variance, payment blocked
- **Act 3: Learning Loop** (30 seconds): Supplier360 updates vendor KPI
- **Closing** (45 seconds): "Conversation, not conveyor belt"
- **Q&A Preparation**: Answers to "What if agents make mistakes?", "How long in production?", etc.
- **Visual Aids**: What to point at during demo (metrics, agent roster, conversation feed)
- **Key Soundbites**: Memorable phrases to emphasize

**Demo Flow Summary:**
1. Upload documents → Orchestrator analyzes → Selects 6 agents
2. Round 1: All agents extract data in parallel, generate questions
3. Round 2: Agents answer + challenge each other (ContractCraft ↔ InvoiceIQ)
4. Round 3: Policy gate (8% > 5%), payment blocked, escalate to CFO
5. Result: ESCALATED_TO_HUMAN with 6 decision packages + vendor KPI updated

## Future Enhancements

**Conversation Enhancements:**
- [ ] Configurable max rounds per agent type (e.g., RiskGuard gets 5 rounds, PayFlow gets 2)
- [ ] Agent personality traits (conservative vs aggressive risk thresholds)
- [ ] Multi-level escalation hierarchy (Agent → Supervisor → Manager → Executive)
- [ ] Conversation summarization after each round

**Performance Improvements:**
- [ ] WebWorker-based agent processing (offload from main thread)
- [ ] Incremental streaming with partial JSON updates
- [ ] Batch LLM calls for similar questions (reduce API round-trips)

**Data & Integration:**
- [ ] Pyodide integration for Python-based data analysis
- [ ] DuckDB WASM for SQL queries on uploaded data
- [ ] Multi-language OCR support (Hindi, Spanish, etc.)
- [ ] Export conversation history as PDF reports
- [ ] Integration with ERP systems (SAP, Oracle) via API connectors

**User Experience:**
- [ ] Replay conversation history with playback controls
- [ ] Agent confidence trend visualization over rounds
- [ ] Real-time collaboration (multiple users viewing same conversation)
- [ ] Mobile-responsive conversation dashboard
- [ ] Voice narration of agent messages (text-to-speech)

---

## 📊 Summary: What You Get

### ✅ Fully Functional
- **6 specialized AI agents** with role-specific reasoning
- **Iterative conversation system** with 2-3 rounds of negotiation
- **Agent-to-agent questioning** with challenge-response verification
- **Dynamic policy adaptation** based on compliance context
- **Multi-level HITL escalations** with independent resolution
- **Real-time conversation dashboard** with metrics and activity stream
- **168+ synthetic documents** covering vendor onboarding to analytics
- **Zero backend** - pure front-end, deployable on GitHub Pages

### 🎯 Demo-Ready
- **Invoice Variance & Compliance Gap scenario** showcasing full negotiation flow
- **DEMO_SCRIPT.md** with 4-minute presentation guide
- **Agent roster display** for quick reference during demos
- **Visual round separators** showing conversation progression
- **Challenge-response cards** highlighting verification moments
- **Performance optimizations** (prompt caching, parallel processing)

### 🚀 Production-Grade Features
- **Prompt caching** for 50-70% faster rounds 2-3 (Anthropic Claude)
- **Confidence scoring** to 2 decimals for all decisions
- **Learning loop** - Supplier360 updates vendor KPIs for future behavior
- **Streaming responses** with incremental UI updates
- **Close HITL modal** without resolving every escalation

### 📈 Business Value
- **95% faster exception handling** (2-3 minutes vs 2-4 hours manual review)
- **Automated policy enforcement** (payment blocked when 8% > 5%)
- **Pre-analyzed decision packages** for CFO/Compliance/Procurement
- **Vendor performance learning** that adapts future processing
- **Audit trail** with full conversation history

---

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
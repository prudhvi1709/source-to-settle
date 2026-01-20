# Demo Scenarios - Agentic Features Guide

## 1. New Vendor Onboarding

**Files:** KYC PDF + Company Profile Word doc

### Why Agentic?

- VendorIntake detects incomplete KYC → questions RiskGuard: "Missing insurance cert - proceed?"
- RiskGuard responds with risk assessment + sets compliance requirements
- ContractCraft waits for RiskGuard approval before generating contract

### Orchestrator Decision

Routes to: VendorIntake → RiskGuard → ContractCraft (skips invoice/payment agents)

### HITL Trigger

- Missing compliance docs → Escalates to **Compliance Officer**
- High-risk industry → Escalates to **Compliance + Legal**

### Proof of Agentic

✅ Inter-agent questions (VendorIntake ↔ RiskGuard)
✅ Dynamic routing (skips irrelevant agents)
✅ Policy-based escalation

---

## 2. High-Risk Vendor Application

**Files:** KYC PDF + Contract Draft Word doc

### Why Agentic?

- RiskGuard detects high-risk factors → broadcasts to all agents: "Enhanced review required"
- ContractCraft finds risky clauses → challenges VendorIntake: "Vendor claims X, but contract says Y?"
- All agents adjust tolerance levels based on RiskGuard's signal

### Orchestrator Decision

Routes to: VendorIntake → RiskGuard → ContractCraft (enhanced scrutiny mode)

### HITL Trigger

- High-risk factors → **Compliance Officer**
- Risky contract clauses → **Legal Counsel**

### Proof of Agentic

✅ Broadcast messages (RiskGuard → all agents)
✅ Cross-validation challenges
✅ Adaptive tolerance levels

---

## 3. Invoice Processing

**Files:** Invoice PDF + Contract PDF + PO/GR CSV

### Why Agentic?

- InvoiceIQ extracts $X → questions ContractCraft: "What's contract rate for vendor?"
- ContractCraft responds with rate
- InvoiceIQ calculates variance → escalates to RiskGuard if >5%
- PayFlow questions RiskGuard before releasing payment

### Orchestrator Decision

Routes to: InvoiceIQ → ContractCraft → RiskGuard → PayFlow (skips vendor onboarding)

### HITL Trigger

- Amount >$100K → **CFO**
- Variance >5% → **CFO exception approval**
- No PO match → **Procurement Manager**

### Proof of Agentic

✅ Sequential questioning (InvoiceIQ → ContractCraft → RiskGuard)
✅ Variance-based escalation
✅ Payment authorization gates

---

## 4. Disputed Invoice (Variance) ⭐ **BEST DEMO**

**Files:** Invoice PDF ($108) + Contract PDF ($100) + PO/GR CSV

### Why Agentic?

**Round 1:** InvoiceIQ → ContractCraft: "Contract rate?"
**Round 2:** ContractCraft → InvoiceIQ: "$100. Variance is 8%"
**Round 3:** InvoiceIQ → RiskGuard: "8% variance detected"
**Round 4:** RiskGuard checks vendor → sees missing insurance → sets 5% tolerance
**Round 5:** RiskGuard → ContractCraft: "Any amendments?"
**Round 6:** ContractCraft → RiskGuard: "None found"
**Round 7:** RiskGuard → PayFlow: "BLOCK payment"
**Round 8:** PayFlow → HUMAN: "Need approval"

### Orchestrator Decision

Routes to: InvoiceIQ → ContractCraft → RiskGuard → PayFlow → HUMAN

### HITL Trigger

- 8% variance exceeds 5% policy → **CFO exception approval**
- Multiple agents agree payment should block → **Manager review**

### Proof of Agentic

✅ **Multi-round negotiation** (8 conversation rounds)
✅ **Policy enforcement** (RiskGuard sets tolerance dynamically)
✅ **Evidence gathering** (checks amendments before deciding)
✅ **Collaborative decision** (3 agents reach consensus to block)
✅ **Human escalation** (only after agents exhaust options)

---

## 5. Scanned Invoice (Low OCR)

**Files:** Scanned Invoice PDF (poor quality)

### Why Agentic?

- InvoiceIQ runs OCR → detects confidence <70%
- InvoiceIQ → ContractCraft: "I see $10X (low confidence). What's expected amount?"
- ContractCraft responds with contract rate
- InvoiceIQ compares → if mismatch, escalates: "Can't trust OCR, need human verification"

### Orchestrator Decision

Routes to: InvoiceIQ → ContractCraft → HUMAN (direct escalation due to low confidence)

### HITL Trigger

- OCR confidence <70% → **Procurement Specialist** for manual verification

### Proof of Agentic

✅ Confidence tracking (agent knows its limitations)
✅ Self-aware escalation ("I can't trust my data")
✅ Verification request before making decisions

---

## 6. Supplier Performance Analysis

**Files:** Supplier History CSV + Invoices CSV + Performance Scorecard Excel

### Why Agentic?

- Supplier360 analyzes performance → detects declining trend
- Supplier360 → RiskGuard: "Vendor showing 30% increase in disputes - should we adjust tolerance?"
- RiskGuard → VendorIntake: "Monitor this vendor - request updated compliance docs"
- Supplier360 → ContractCraft: "Add performance penalty clause to next contract"
- Learning shared across agents for future decisions

### Orchestrator Decision

Routes to: Supplier360 → RiskGuard → VendorIntake → ContractCraft (feedback loop)

### HITL Trigger

- Strategic vendor (>$10M) with declining performance → **CFO + CEO**
- High dispute rate → **Legal + Procurement**

### Proof of Agentic

✅ **Learning loops** (Supplier360 shares insights)
✅ **Proactive recommendations** (agents suggest policy changes)
✅ **Cross-agent memory** (future decisions consider past performance)

---

## 7. Complete Vendor Lifecycle

**Files:** KYC PDF + Invoice PDF + Supplier History CSV

### Why Agentic?

- Mixed documents trigger multiple agents
- VendorIntake processes KYC while InvoiceIQ processes invoice in parallel
- Both question RiskGuard simultaneously
- RiskGuard prioritizes based on urgency
- Supplier360 provides historical context to all agents
- Workflow emerges from agent negotiations, not predetermined

### Orchestrator Decision

Routes to: **All 6 agents** (full lifecycle) with parallel activation

### HITL Trigger

- **Any combination** of vendor, invoice, or performance triggers

### Proof of Agentic

✅ **Parallel activation** (multiple agents start simultaneously)
✅ **Priority-based processing** (RiskGuard handles urgent queries first)
✅ **Contextual routing** (workflow emerges from agent conversations)

---

## Agentic Features Summary

| Feature           | Linear BPM     | Agentic System                    |
| ----------------- | -------------- | --------------------------------- |
| **Communication** | ❌ None        | ✅ Agents question each other     |
| **Routing**       | ❌ Fixed path  | ✅ Dynamic based on content       |
| **Policy**        | ❌ Hardcoded   | ✅ Agents negotiate tolerance     |
| **Escalation**    | ❌ No HITL     | ✅ Exception-based human approval |
| **Learning**      | ❌ Static      | ✅ Agents share insights          |
| **Confidence**    | ❌ Not tracked | ✅ Agents express uncertainty     |

---

## How to Demonstrate

### For Quick Demo (5 min)

**Use Scenario 4: Disputed Invoice**

- Shows all agentic features
- Clear 8-round conversation
- Obvious HITL escalation
- Console shows agent negotiations

### For Deep Dive (15 min)

**Use Scenario 6: Supplier Performance**

- Shows learning loops
- Proactive recommendations
- Cross-agent memory
- Strategic HITL escalation

### Key Points to Highlight

1. **Open browser console** - show agent conversations in real-time
2. **Point out multi-round negotiation** - agents don't just pass data forward
3. **Show HITL trigger** - only escalates when agents can't decide
4. **Enable Agentic Mode** in settings to activate conversations

---

**Best Demo Flow:**

1. Enable Agentic Mode ✅
2. Run "Disputed Invoice (Variance)" ⭐
3. Open console → show conversation log
4. Watch agents negotiate (8 rounds)
5. See HITL escalation to CFO
6. Explain: "This would be 1 linear flow without agentic mode"

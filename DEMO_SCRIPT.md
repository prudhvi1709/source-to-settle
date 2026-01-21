# 🎯 Invoice Variance & Compliance Gap - Demo Script

**Scenario:** Invoice INV-4589 with 8% rate variance + missing insurance certificate
**Duration:** 3-4 minutes
**Audience:** CFO, Procurement Leadership, Finance Directors
**Goal:** Show iterative agentic reasoning - agents negotiate truth before money moves

---

## 🎬 Opening (30 seconds)

> "What you're about to see is fundamentally different from traditional invoice processing. Instead of a rigid workflow where documents move down a conveyor belt in sequence, you're going to watch **six AI agents negotiate with each other in real-time** to determine whether this invoice should be paid."

**[Navigate to demo homepage]**

> "This is our Source-to-Settle platform. Today we're running the most complex scenario..."

**[Click on "Invoice Variance & Compliance Gap" card]**

> "...an invoice with an **8% rate variance** above the contract rate, PLUS a **missing insurance certificate** for the vendor.
>
> In traditional systems, this would either:
> - Auto-reject and lose a good vendor
> - Auto-pay and violate policy
> - Get stuck in approval limbo for days
>
> Watch what happens when agents can **question each other** and **reason together**."

**[Click "Run Demo"]**

---

## 🚀 Act 1: Parallel Discovery & Negotiation (90 seconds)

**[Files load automatically, processing starts]**

> "Notice what's happening RIGHT NOW at the top..."

**[Point to "Multi-Agent Conversation - Real-Time" section]**

> "The system just activated **ALL SIX agents in parallel** - not in sequence. This is the first critical difference: **parallel start, not serial processing**."

**[Point to metrics: Rounds, Messages, Escalations updating]**

> "See these numbers updating in real-time? The agents are already:
> - Extracting invoice data
> - Validating vendor compliance
> - Cross-checking contract rates
> - **Questioning each other about discrepancies**
>
> This isn't a workflow. This is a **conversation**."

**[Scroll down to conversation feed showing messages]**

> "Let me show you the actual negotiation happening between agents..."

**[Point to VendorIntake → RiskGuard message]**

> "Here - **VendorIntake Agent** discovers the vendor profile has a **MISSING insurance certificate** and immediately asks RiskGuard:
>
> _'What's your recommended risk level for this vendor given the compliance gap?'_"

**[Point to RiskGuard's response]**

> "RiskGuard responds:
>
> _'Missing insurance triggers ENHANCED REVIEW mode. Apply stricter variance tolerance of 5% instead of standard 10%.'_
>
> Notice - RiskGuard is **dynamically adjusting the policy threshold** based on the compliance gap. The rules aren't fixed - they adapt to context."

**[Scroll to ContractCraft → InvoiceIQ exchange - THIS IS THE KEY MOMENT]**

> "Now here's the critical moment. **ContractCraft Agent** validates the invoice against the contract and finds:
>
> - Contract rate: **$100/hour**
> - Invoice rate: **$108/hour**
> - Variance: **8%**
>
> And ContractCraft **challenges InvoiceIQ back**:
>
> _'Is this a data extraction error, or is this a real commercial variance?'_"

**[Point to InvoiceIQ's response - highlight the challenge-response card if visible]**

> "InvoiceIQ **re-verifies the OCR extraction** and responds:
>
> _'Numbers are correct. Extraction confidence 92%. This is a TRUE COMMERCIAL VARIANCE, not an error.'_
>
> **This is the magic** - agents questioning each other's findings and re-verifying before escalating. InvoiceIQ didn't just extract once and move on - it was **challenged by another agent** and re-validated."

**[Point to the round indicator showing Round 2]**

> "We're now in Round 2. Watch what happens when the variance hits the policy gate..."

---

## 🔥 Act 2: Policy Enforcement & Escalation (60 seconds)

**[Point to RiskGuard decision in conversation feed]**

> "Now **RiskGuard applies the business rules**:
>
> - Vendor has compliance gap → Enhanced Review Mode
> - Enhanced Review → **5% tolerance** (not standard 10%)
> - Invoice variance → **8%**
> - **8% > 5% tolerance** → **POLICY VIOLATION**"

**[Scroll to PayFlow's decision]**

> "**PayFlow Agent** sees the policy violation and **HOLDS the payment**:
>
> _'Payment blocked. Variance exceeds enhanced tolerance threshold. Escalating to CFO for approval.'_
>
> Notice - PayFlow didn't auto-pay. It enforced the policy."

**[Point to the final verdict badge showing "ESCALATED_TO_HUMAN"]**

> "And here's the outcome: **ESCALATED_TO_HUMAN** in yellow.
>
> But this wasn't a simple rejection. Look at what the agents prepared..."

**[Scroll to show escalation count: "6 Escalations"]**

> "The agents generated **6 separate escalation packages** - one for the CFO, one for the Compliance Officer, one for Procurement Manager...
>
> Each package contains:
> - The specific issue from that agent's perspective
> - All the evidence gathered
> - Recommended actions
> - Context for decision-making"

**[Click on one of the escalation cards to expand it]**

> "Let me show you one. Here's RiskGuard's escalation to the CFO:
>
> _'Policy violation detected: Invoice INV-4589 shows $108/hr vs MSA rate $100/hr (8% variance). Vendor insurance certificate MISSING. Enhanced tolerance is 5%, so variance exceeds policy. **Recommendation: Hold payment and request CFO approval.** Provide invoice, MSA, and vendor profile snapshot.'_
>
> That's not a simple alert. That's a **decision support package** - everything a human needs to make an informed call in 30 seconds instead of 2 hours of investigation."

---

## 💡 Act 3: The Learning Loop (30 seconds)

**[Scroll to Supplier360 recommendations]**

> "And here's what makes this truly intelligent - **Supplier360 Agent** has already:
>
> - Recorded this as **TechFlow's FIRST variance event**
> - Updated their vendor KPI score
> - Fed insights back to RiskGuard: _'This is the first variance - monitor next invoice with same enhanced scrutiny'_
>
> This isn't just processing one invoice. **The system is learning**.
>
> The next time TechFlow submits an invoice:
> - RiskGuard will remember this variance
> - Tolerance will remain at 5% until insurance is provided
> - Routing will include extra validation steps
>
> The workflow for THIS vendor has **permanently changed** based on what just happened."

---

## 🎯 Closing: The Big Picture (45 seconds)

**[Scroll back to top to show full conversation timeline]**

> "Let me zoom out and show you what just happened in 2-3 minutes:
>
> ✅ **6 agents activated in parallel** - simultaneous, not serial
> ✅ **Agent-to-agent dialogue** - ContractCraft challenged InvoiceIQ's extraction
> ✅ **Policy adapted to context** - 5% tolerance applied due to compliance gap
> ✅ **Variance verified** - InvoiceIQ re-checked OCR when questioned
> ✅ **Payment blocked** - PayFlow enforced the policy gate
> ✅ **6 escalation packages prepared** - decision-ready for different roles
> ✅ **Learning loop activated** - system adapted future behavior for this vendor
>
> **This is not a conveyor belt. This is a conversation.**"

**[Point to the conversation feed with all the back-and-forth messages]**

> "The workflow didn't follow a fixed path - it **emerged from reasoning**.
>
> Agents negotiated the truth:
> - 'Is this an OCR error?' → 'No, verified.'
> - 'Any change orders?' → 'None found.'
> - 'Can we pay?' → 'No, exceeds tolerance.'
>
> Only after establishing the truth did they escalate to humans.
>
> **That's the difference between traditional automation and agentic AI.**
>
> Agents don't just execute steps - they **negotiate truth before money moves**."

---

## 🎤 Q&A Preparation

### Expected Questions:

**Q: "How long does this take in production?"**

> "What you saw in 2-3 minutes here would take 30-60 seconds in production with real API calls - still 95% faster than manual review, which typically takes 2-4 hours for an exception like this."

**Q: "What if the agents make a mistake?"**

> "Notice the system **escalated to humans** - it didn't auto-pay. The agents identified the exception and prepared decision packages with all the evidence. The final approval still requires human judgment. We're **augmenting decisions, not replacing them**.
>
> Plus, every agent includes a confidence score - InvoiceIQ reported 92% OCR confidence, which gave ContractCraft the signal to challenge and verify."

**Q: "Can we customize the 5% vs 10% tolerance thresholds?"**

> "Absolutely. RiskGuard's variance tolerance logic is fully configurable per:
> - Vendor risk band (LOW/MEDIUM/HIGH)
> - Contract type (MSA vs PO vs SOW)
> - Business unit
> - Compliance status
>
> You can adjust these rules in real-time without code changes. The system adapts."

**Q: "What prevents agents from escalating everything?"**

> "Great question. The agents have explicit instructions to only escalate when:
> 1. Policy thresholds are exceeded (like the 8% > 5% variance here)
> 2. Confidence is too low to proceed
> 3. Missing critical data that blocks processing
>
> In cases where everything checks out - rates match, vendor compliance current, no risk flags - the system will **auto-approve and process payment** without human intervention. The goal is to handle 80% automatically and escalate the 20% that truly need human judgment."

**Q: "Did ContractCraft really challenge InvoiceIQ's extraction?"**

> "Yes - that's the agent-to-agent questioning feature. When ContractCraft saw the 8% variance, it didn't just assume InvoiceIQ was right. It sent a message: _'Is this a data error or real variance?'_
>
> InvoiceIQ then **re-ran the OCR verification**, checked confidence scores, and responded: _'Verified. True commercial variance.'_
>
> That challenge-and-verify loop is visible in the conversation feed. It's not scripted - it's dynamic based on what agents discover."

**Q: "How does this integrate with our ERP?"**

> "The agents can pull contract data, vendor profiles, and payment history from your existing systems via API. The escalation packages can route directly into your approval workflow tools - ServiceNow, SAP Workflow, Workday, or email.
>
> This sits as an **intelligent reasoning layer** on top of your existing infrastructure. No rip-and-replace."

---

## 🎨 Visual Aids to Point At During Demo

Make sure to **visually point** to these UI elements:

1. ✅ **Real-time metrics updating** - Rounds, Messages, Escalations counters
2. ✅ **Agent conversation feed** - Showing actual messages exchanged
3. ✅ **Challenge-response cards** - ContractCraft ↔ InvoiceIQ dialogue (if styled)
4. ✅ **Round separators** - Visual break between Round 1 and Round 2
5. ✅ **Yellow "ESCALATED_TO_HUMAN" badge** - Final decision indicator
6. ✅ **Multiple escalation cards** - 6 different packages for different roles
7. ✅ **Confidence scores** - 92% OCR confidence from InvoiceIQ
8. ✅ **Supplier360 learning insights** - "First variance event recorded"
9. ✅ **Policy reasoning** - "Enhanced tolerance 5% applied due to compliance gap"

---

## 🎭 Demo Flow Timing

| Section                  | Time | Key Message                                      |
| ------------------------ | ---- | ------------------------------------------------ |
| Opening                  | 30s  | "Agents negotiate truth before money moves"      |
| Parallel Discovery       | 90s  | "Parallel start + agent-to-agent questioning"    |
| Policy & Escalation      | 60s  | "Policy adapts to context, payment blocked"      |
| Learning Loop            | 30s  | "System learns and adjusts future behavior"      |
| Closing                  | 45s  | "Conversation, not conveyor belt"                |
| **Total**                | ~4min|                                                  |

---

## 🔑 Key Soundbites (Memorize These)

Use these phrases for maximum impact:

> **"Agents negotiate the truth before money moves."**

> **"The workflow emerges from reasoning, not a fixed path."**

> **"This isn't a conveyor belt. This is a conversation."**

> **"Notice - agents question each other, not just humans questioning agents."**

> **"ContractCraft challenged InvoiceIQ's extraction, and InvoiceIQ re-verified. That's agentic reasoning."**

> **"The system learns. This vendor's next invoice will be handled differently based on what just happened."**

> **"Policy adapted to context - 5% tolerance instead of 10% because of the compliance gap."**

---

## 📊 Success Metrics from This Demo Run

Share these numbers after the demo:

- ✅ **6 agents** activated in parallel
- ✅ **12+ questions** exchanged between agents (true dialogue)
- ✅ **2 rounds** of negotiation (compressed timeline)
- ✅ **92% OCR confidence** from InvoiceIQ
- ✅ **8% variance** detected vs **5% enhanced tolerance**
- ✅ **6 escalation packages** prepared for different roles
- ✅ **100% policy compliance** - payment blocked per rules
- ✅ **Learning loop activated** - vendor KPI updated for future processing

---

## 🎯 The Punchline

> "In traditional systems, this invoice would either:
>
> 1. **Auto-reject** and lose a good vendor over a fixable variance
> 2. **Auto-pay** and violate company policy, creating audit risk
> 3. **Get stuck in approval limbo** for 2-4 days while people investigate
>
> With agentic AI, it took **2-3 minutes** to:
>
> - Detect BOTH the variance AND the compliance gap
> - Verify it wasn't an OCR error (via agent challenge)
> - Apply the RIGHT policy threshold based on risk context (5% not 10%)
> - Prepare decision packages for CFO, Compliance, and Procurement
> - Update vendor KPIs for future learning
>
> And most importantly - **agents questioned each other's findings** before escalating. ContractCraft didn't trust InvoiceIQ blindly. It challenged. InvoiceIQ re-verified. Then they agreed on the truth.
>
> **That's the power of agents that negotiate together.**"

---

## 🎬 Practice Tips

**Before the demo:**

1. ✅ Run through the scenario 2-3 times to nail timing
2. ✅ Practice pointing at specific UI elements without looking away from the audience
3. ✅ Memorize the key soundbites so they sound natural, not scripted
4. ✅ Have the Q&A responses ready - clients will ask about customization and ERP integration
5. ✅ Know where the ContractCraft ↔ InvoiceIQ challenge-response dialogue appears in the feed

**During the demo:**

- 🎯 **Speak slower than you think** - let the metrics update visibly
- 🎯 **Point and pause** - "See this? This is where ContractCraft challenges InvoiceIQ..."
- 🎯 **Use the numbers** - "8% variance vs 5% tolerance" is concrete
- 🎯 **Highlight the back-and-forth** - Show it's not linear, it's a negotiation

**The magic moments to emphasize:**

1. **Parallel activation** - All 6 agents start at once (not serial)
2. **Agent challenging agent** - ContractCraft → InvoiceIQ: "Is this an error?"
3. **Policy adapting to context** - 5% tolerance due to compliance gap
4. **Payment blocked** - Not auto-paid, enforced the rule
5. **Learning loop** - "This vendor will be treated differently next time"

---

**End of Script**

🎬 _Focus on showing the **conversation between agents** - that's what makes this different from traditional workflow automation. The workflow doesn't exist until the agents negotiate it into existence._

# Multi-Agentic System Implementation Plan

## Executive Summary

Transform the current **sequential workflow** into a true **multi-agentic system with HITL at its core** where agents:

- Run in **parallel** when independent
- **Question each other** iteratively across multiple rounds
- **Negotiate** decisions through back-and-forth dialogue
- **Broadcast** signals that affect other agents' behavior
- **Self-escalate** when uncertain or detecting issues
- **🎯 Escalate to humans intelligently** with full context, role-based routing
- **Resume work** after human decisions (not restart)
- **Learn** from each interaction and adjust future behavior

### Three Core Pillars

1. **Multi-Agent Conversation** - Agents talk, not just process
2. **Real-Time Visual UI** - Watch agents negotiate live
3. **🎯 HITL (Human-in-the-Loop)** - Safety net, not afterthought

---

## Current State Analysis

### What We Have (Sequential/Linear BPM)

```javascript
// Current: agents/agent.js line 359-396
for (let i = 0; i < orchestrationPlan.agentPlan.length; i++) {
  const agentName = orchestrationPlan.agentPlan[i];
  const agent = config.agents.find((a) => a.name === agentName);

  const agentResult = await runAgent(agent, extractedData, results);
  results.push(agentResult);
}
```

**Problems:**

- ❌ **Sequential execution**: Agents wait for previous agent to complete
- ❌ **No interaction**: Agents can't ask questions to each other
- ❌ **No loops**: Single pass through the workflow
- ❌ **No negotiation**: Agents can't challenge or verify peer outputs
- ❌ **No parallelism**: Can't process independent tasks simultaneously
- ❌ **Fixed workflow**: Path determined upfront by orchestrator

### What We Need (True Agentic System)

```javascript
// Desired: Parallel + Iterative + Conversational
const activeAgents = await activateAgents(['VendorIntake', 'InvoiceIQ']); // Parallel start
const conversation = await agentMessageBus.negotiate(activeAgents, maxRounds: 8);
// Agents question each other, RiskGuard joins mid-conversation,
// workflow emerges from their dialogue
```

**Goals:**

- ✅ **Parallel activation**: Multiple agents start simultaneously
- ✅ **Agent-to-agent messaging**: Questions, challenges, confirmations
- ✅ **Multi-round negotiation**: 5-10 conversation rounds
- ✅ **Broadcast signals**: "High risk detected" → all agents adjust tolerance
- ✅ **Dynamic routing**: Workflow emerges from conversation, not predetermined
- ✅ **Confidence tracking**: "I'm 60% sure - need verification from ContractCraft"

---

## Architecture Overview

### New Components to Build

```
                    ┌─────────────────────┐
                    │   HUMAN (HITL) 👤   │
                    │  - CFO              │
                    │  - Manager          │
                    │  - Specialist       │
                    └─────────────────────┘
                              ▲
                              │ Escalations
                              │
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR (Enhanced)                    │
│  - Initial agent activation (parallel)                       │
│  - Monitor conversation progress                             │
│  - Inject new agents mid-conversation if needed              │
│  - Trigger HITL when agents reach deadlock                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   MESSAGE BUS / BROKER (NEW)                 │
│  - Route messages between agents                             │
│  - Track conversation rounds                                 │
│  - Detect deadlocks / infinite loops                         │
│  - Broadcast signals to all agents                           │
│  - Log full conversation history                             │
│  - Handle HITL escalations and responses                     │
└─────────────────────────────────────────────────────────────┘
            │                │              │
            ▼                ▼              ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  VendorIntake    │  │  InvoiceIQ   │  │  RiskGuard   │
│  Agent           │  │  Agent       │  │  Agent       │
│  - Question      │  │  - Question  │  │  - Broadcast │
│  - Answer        │  │  - Answer    │  │  - Policy    │
│  - Escalate HITL │  │  - Verify    │  │  - Block     │
└──────────────────┘  └──────────────┘  └──────────────┘
         ↕                  ↕                  ↕
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  ContractCraft   │  │  PayFlow     │  │  Supplier360 │
│  Agent           │  │  Agent       │  │  Agent       │
│                  │  │  - HITL Gate │  │              │
└──────────────────┘  └──────────────┘  └──────────────┘
```

---

## Implementation Phases

## Phase 1: Message Bus & Agent Communication Protocol

### Goal

Enable agents to send messages to each other and track multi-round conversations.

### Files to Create

1. **`src/messageBus.js`** - Central message routing system
2. **`src/agentProtocol.js`** - Message types and schemas
3. **`src/conversationManager.js`** - Multi-round conversation orchestration

### Key Features

#### 1.1 Message Types

```javascript
// src/agentProtocol.js
export const MessageType = {
  QUESTION: "question", // "What's the contract rate?"
  ANSWER: "answer", // "Contract rate is $100"
  CHALLENGE: "challenge", // "Invoice shows $108, discrepancy?"
  BROADCAST: "broadcast", // "HIGH RISK - enhance scrutiny"
  REQUEST_DATA: "request_data", // "Send me vendor insurance docs"
  ESCALATE_HUMAN: "escalate_human", // "Need CFO approval"
  POLICY_UPDATE: "policy_update", // "Tolerance set to 5%"
  CONFIDENCE: "confidence", // "I'm 60% confident in this OCR"
};

export class AgentMessage {
  constructor(from, to, type, content, metadata = {}) {
    this.id = generateId();
    this.from = from; // 'InvoiceIQ'
    this.to = to; // 'ContractCraft' or ['all'] for broadcast
    this.type = type; // MessageType enum
    this.content = content; // Free text or structured data
    this.metadata = {
      round: metadata.round || 1,
      confidence: metadata.confidence, // 0-100
      urgency: metadata.urgency, // 'low', 'medium', 'high'
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }
}
```

#### 1.2 Message Bus

```javascript
// src/messageBus.js
export class MessageBus {
  constructor() {
    this.messages = []; // Full conversation history
    this.activeAgents = new Map(); // agent name → agent instance
    this.subscriptions = new Map(); // agent name → message handlers
    this.round = 0;
    this.maxRounds = 10;
  }

  // Register an agent
  registerAgent(agentName, agentInstance) {
    this.activeAgents.set(agentName, agentInstance);
    this.subscriptions.set(agentName, []);
  }

  // Send message from one agent to another (or broadcast)
  async sendMessage(message) {
    this.messages.push(message);
    console.log(
      `[Round ${this.round}] ${message.from} → ${message.to}: ${message.type}`,
    );

    // Broadcast to all agents
    if (Array.isArray(message.to) && message.to.includes("all")) {
      for (const [agentName, agent] of this.activeAgents) {
        if (agentName !== message.from) {
          await agent.receiveMessage(message);
        }
      }
    }
    // Direct message to specific agent
    else {
      const targetAgent = this.activeAgents.get(message.to);
      if (targetAgent) {
        await targetAgent.receiveMessage(message);
      }
    }
  }

  // Get conversation history
  getConversationHistory(filterByAgent = null) {
    if (filterByAgent) {
      return this.messages.filter(
        (m) =>
          m.from === filterByAgent ||
          m.to === filterByAgent ||
          m.to.includes("all"),
      );
    }
    return this.messages;
  }

  // Check if conversation should end
  shouldEndConversation() {
    if (this.round >= this.maxRounds) {
      console.warn("Max rounds reached - ending conversation");
      return true;
    }

    // No messages in last round = consensus reached
    const lastRoundMessages = this.messages.filter(
      (m) => m.metadata.round === this.round,
    );
    if (this.round > 2 && lastRoundMessages.length === 0) {
      console.log("No new messages - consensus reached");
      return true;
    }

    // All agents escalated to human
    const escalations = this.messages.filter(
      (m) => m.type === MessageType.ESCALATE_HUMAN,
    );
    if (escalations.length >= this.activeAgents.size) {
      console.log("All agents escalated - human intervention required");
      return true;
    }

    return false;
  }

  // Start new conversation round
  nextRound() {
    this.round++;
    console.log(`\n--- Starting Round ${this.round} ---\n`);
  }
}
```

#### 1.3 Conversation Manager

```javascript
// src/conversationManager.js
export class ConversationManager {
  constructor(messageBus, agents, extractedData) {
    this.bus = messageBus;
    this.agents = agents;
    this.extractedData = extractedData;
  }

  // Run multi-round conversation
  async runConversation() {
    console.log("Starting multi-agent conversation...");

    // Round 1: Parallel initial analysis
    this.bus.nextRound();
    await this.parallelAgentActivation();

    // Rounds 2-N: Iterative questioning and negotiation
    while (!this.bus.shouldEndConversation()) {
      this.bus.nextRound();
      await this.processConversationRound();
    }

    // Final synthesis
    const finalDecision = await this.synthesizeFinalDecision();
    return {
      conversationHistory: this.bus.getConversationHistory(),
      finalDecision,
      rounds: this.bus.round,
    };
  }

  // Activate multiple agents in parallel
  async parallelAgentActivation() {
    const promises = this.agents.map((agent) =>
      agent.initialAnalysis(this.extractedData),
    );

    await Promise.all(promises);
  }

  // Process one conversation round
  async processConversationRound() {
    // Collect pending questions from all agents
    const pendingMessages = [];

    for (const agent of this.agents) {
      const questions = await agent.generateQuestions(
        this.bus.getConversationHistory(),
      );
      pendingMessages.push(...questions);
    }

    // Send all messages
    for (const msg of pendingMessages) {
      await this.bus.sendMessage(msg);
    }
  }

  // Synthesize final decision from all agent inputs
  async synthesizeFinalDecision() {
    // Implementation in Phase 3
  }
}
```

---

## Phase 2: Enhanced Agent Implementation

### Goal

Refactor agents to support questioning, answering, and negotiation.

### Files to Modify

1. **`src/agent.js`** - Add agentic capabilities to base agent class
2. **`config.json`** - Add agent conversation prompts

### Key Changes

#### 2.1 Enhanced Agent Class

```javascript
// src/agent.js - Add new capabilities
export class AgenticAgent {
  constructor(config, messageBus, extractedData) {
    this.name = config.name;
    this.config = config;
    this.bus = messageBus;
    this.data = extractedData;
    this.internalState = {
      findings: null,
      confidence: 100,
      pendingQuestions: [],
      receivedAnswers: [],
    };
  }

  // Initial parallel analysis
  async initialAnalysis(data) {
    const prompt = this.buildPrompt({
      phase: "initial_analysis",
      data: data,
      instruction: `Analyze the provided documents from your perspective as ${this.name}.

        Identify:
        1. What information you CAN extract confidently
        2. What information you NEED from other agents
        3. Any red flags or concerns

        Return JSON:
        {
          "findings": "...",
          "confidence": 0-100,
          "questionsFor": {
            "ContractCraft": ["What's the contract rate?"],
            "RiskGuard": ["Is this vendor approved?"]
          },
          "concerns": ["..."]
        }`,
    });

    const response = await this.callLLM(prompt);
    this.internalState.findings = response.findings;
    this.internalState.confidence = response.confidence;

    // Generate questions for other agents
    if (response.questionsFor) {
      for (const [targetAgent, questions] of Object.entries(
        response.questionsFor,
      )) {
        for (const question of questions) {
          const msg = new AgentMessage(
            this.name,
            targetAgent,
            MessageType.QUESTION,
            question,
            { round: this.bus.round, confidence: response.confidence },
          );
          await this.bus.sendMessage(msg);
        }
      }
    }
  }

  // Receive and respond to messages
  async receiveMessage(message) {
    console.log(`${this.name} received ${message.type} from ${message.from}`);

    switch (message.type) {
      case MessageType.QUESTION:
        await this.answerQuestion(message);
        break;

      case MessageType.CHALLENGE:
        await this.handleChallenge(message);
        break;

      case MessageType.BROADCAST:
        await this.adjustBehavior(message);
        break;

      case MessageType.REQUEST_DATA:
        await this.provideData(message);
        break;
    }

    this.internalState.receivedAnswers.push(message);
  }

  // Answer a question from another agent
  async answerQuestion(message) {
    const prompt = this.buildPrompt({
      phase: "answer_question",
      question: message.content,
      context: this.internalState.findings,
      conversationHistory: this.bus.getConversationHistory(this.name),
      instruction: `Another agent (${message.from}) asked: "${message.content}"

        Based on your analysis, provide:
        1. Direct answer
        2. Confidence level (0-100)
        3. Any caveats or conditions

        If you need more information to answer, ask a follow-up question.

        Return JSON:
        {
          "answer": "...",
          "confidence": 0-100,
          "caveats": ["..."],
          "followUpQuestion": "..." (optional)
        }`,
    });

    const response = await this.callLLM(prompt);

    // Send answer
    const answerMsg = new AgentMessage(
      this.name,
      message.from,
      MessageType.ANSWER,
      response.answer,
      {
        round: this.bus.round,
        confidence: response.confidence,
        inReplyTo: message.id,
      },
    );
    await this.bus.sendMessage(answerMsg);

    // Send follow-up question if needed
    if (response.followUpQuestion) {
      const followUpMsg = new AgentMessage(
        this.name,
        message.from,
        MessageType.QUESTION,
        response.followUpQuestion,
        { round: this.bus.round },
      );
      await this.bus.sendMessage(followUpMsg);
    }
  }

  // Generate new questions based on conversation
  async generateQuestions(conversationHistory) {
    // Check if we got answers to our previous questions
    const myQuestions = conversationHistory.filter(
      (m) => m.from === this.name && m.type === MessageType.QUESTION,
    );
    const answersReceived = conversationHistory.filter(
      (m) => m.to === this.name && m.type === MessageType.ANSWER,
    );

    // If we have all answers, analyze and decide next action
    if (answersReceived.length >= myQuestions.length) {
      const prompt = this.buildPrompt({
        phase: "analyze_answers",
        answers: answersReceived,
        findings: this.internalState.findings,
        instruction: `You asked questions and received answers. Now:

          1. Analyze if answers resolve your concerns
          2. Identify any discrepancies or conflicts
          3. Determine if you need to:
             - Challenge another agent's data
             - Request clarification
             - Escalate to human
             - Mark as resolved

          Return JSON:
          {
            "resolved": true/false,
            "nextActions": [
              {
                "type": "challenge" | "question" | "escalate",
                "target": "AgentName" | "human",
                "content": "..."
              }
            ]
          }`,
      });

      const response = await this.callLLM(prompt);

      // Generate messages based on next actions
      const messages = [];
      for (const action of response.nextActions || []) {
        const msgType =
          action.type === "challenge"
            ? MessageType.CHALLENGE
            : action.type === "escalate"
              ? MessageType.ESCALATE_HUMAN
              : MessageType.QUESTION;

        messages.push(
          new AgentMessage(this.name, action.target, msgType, action.content, {
            round: this.bus.round,
          }),
        );
      }

      return messages;
    }

    return [];
  }

  // Adjust behavior based on broadcast signals
  async adjustBehavior(message) {
    if (message.content.includes("HIGH_RISK")) {
      console.log(`${this.name}: Adjusting to enhanced scrutiny mode`);
      this.internalState.riskTolerance = 5; // Stricter threshold
    } else if (message.content.includes("TOLERANCE_UPDATE")) {
      const tolerance = parseFloat(message.metadata.tolerance);
      this.internalState.riskTolerance = tolerance;
    }
  }

  // Call LLM with prompt
  async callLLM(prompt) {
    // Use existing streamLLM function from agent.js
    const fullResponse = await streamLLM(config, prompt, this.agentIndex);
    return JSON.parse(fullResponse);
  }
}
```

#### 2.2 Specialized Agent Behaviors

Each agent needs specific questioning/answering logic:

**InvoiceIQ Agent:**

- Questions ContractCraft: "What's the contract rate?"
- Questions RiskGuard: "Is 8% variance acceptable?"
- Challenges ContractCraft: "You said $100 but I see $108 - explain?"

**ContractCraft Agent:**

- Answers InvoiceIQ: "Contract rate is $100"
- Questions RiskGuard: "Are there any approved amendments?"
- Verifies with InvoiceIQ: "Confirmed invoice shows $108?"

**RiskGuard Agent:**

- Broadcasts: "HIGH_RISK detected - missing insurance"
- Sets policy: "Tolerance = 5% for this vendor"
- Asks ContractCraft: "Any change orders on file?"
- Blocks PayFlow: "Do not release payment"

**VendorIntake Agent:**

- Detects incomplete data: "Missing insurance cert"
- Questions RiskGuard: "Can we proceed without insurance?"
- Escalates: "Compliance officer approval needed"

**PayFlow Agent:**

- Asks RiskGuard: "Is payment approved?"
- Waits for authorization gate
- Escalates: "CFO approval needed for $100K+"

**Supplier360 Agent:**

- Provides historical context: "This vendor had 3 disputes last quarter"
- Broadcasts: "Declining performance trend detected"
- Recommends: "Monitor next invoice closely"

---

## Phase 3: Parallel Execution & Dynamic Routing

### Goal

Enable multiple agents to work simultaneously and route dynamically based on conversation.

### Files to Modify

1. **`src/agent.js`** - Update `processAgentWorkflow()`
2. **`src/workflow.js`** - Add dynamic path updates

### Key Changes

#### 3.1 Replace Sequential Loop with Parallel Activation

```javascript
// src/agent.js - REPLACE processAgentWorkflow()
export async function processAgentWorkflow(extractedData) {
  agentOutputs = [];

  try {
    // Step 1: Orchestrator determines initial agent set
    orchestrationPlan = await runOrchestrator(extractedData);

    if (!orchestrationPlan?.agentPlan?.length) {
      return { results: [], orchestrationPlan, finalEvaluation: null };
    }

    // Step 2: Initialize message bus
    const messageBus = new MessageBus();
    messageBus.maxRounds = 10;

    // Step 3: Create agentic agents
    const agenticAgents = orchestrationPlan.agentPlan.map((agentName) => {
      const agentConfig = config.agents.find((a) => a.name === agentName);
      const agent = new AgenticAgent(agentConfig, messageBus, extractedData);
      messageBus.registerAgent(agentName, agent);
      return agent;
    });

    // Step 4: Run multi-round conversation
    const conversationManager = new ConversationManager(
      messageBus,
      agenticAgents,
      extractedData,
    );

    const { conversationHistory, finalDecision, rounds } =
      await conversationManager.runConversation();

    // Step 5: Display conversation visualization
    displayConversationFlow(conversationHistory, rounds);

    // Step 6: Final evaluation
    const finalEvaluation = await runFinalEvaluation(
      extractedData,
      conversationHistory,
    );

    return {
      results: conversationHistory,
      orchestrationPlan,
      finalEvaluation,
      conversationRounds: rounds,
    };
  } catch (e) {
    console.error("Workflow processing error:", e);
    throw e;
  }
}
```

#### 3.2 Dynamic Agent Injection

```javascript
// src/conversationManager.js - Add mid-conversation agent activation
async processConversationRound() {
  // ... existing code ...

  // Check if new agents should be activated based on conversation
  const newAgentsNeeded = await this.detectNeededAgents();

  for (const agentName of newAgentsNeeded) {
    if (!this.bus.activeAgents.has(agentName)) {
      console.log(`Injecting ${agentName} into conversation (Round ${this.bus.round})`);
      const agentConfig = config.agents.find(a => a.name === agentName);
      const newAgent = new AgenticAgent(agentConfig, this.bus, this.extractedData);
      this.bus.registerAgent(agentName, newAgent);
      this.agents.push(newAgent);

      // New agent does initial analysis
      await newAgent.initialAnalysis(this.extractedData);
    }
  }
}

async detectNeededAgents() {
  // Example: If high-risk detected, add RiskGuard if not active
  const messages = this.bus.getConversationHistory();
  const needsRisk = messages.some(m =>
    m.content.toLowerCase().includes('risk') ||
    m.content.toLowerCase().includes('compliance')
  );

  const newAgents = [];
  if (needsRisk && !this.bus.activeAgents.has('RiskGuardAgent')) {
    newAgents.push('RiskGuardAgent');
  }

  return newAgents;
}
```

---

## Phase 4: UI Enhancements for Multi-Agent Conversations

### Goal

Visualize agent conversations, message flows, and iterative rounds in **REAL-TIME**.

### Visual Requirements

You MUST be able to:

- ✅ **SEE** agents activate in parallel (multiple agents light up simultaneously)
- ✅ **WATCH** messages fly between agents in real-time (animated arrows)
- ✅ **READ** agent conversations as they happen (live chat interface)
- ✅ **TRACK** which round is active (conversation progress bar)
- ✅ **UNDERSTAND** the workflow emerging (dynamic path drawing)

### Files to Modify

1. **`src/ui.js`** - Add live conversation feed
2. **`src/workflow.js`** - Real-time D3 visualization updates
3. **`index.html`** - Add conversation view section
4. **`src/messageBus.js`** - Emit UI events on every message

### Key Features

#### 4.1 Conversation Timeline View

```javascript
// src/ui.js - Add conversation rendering
export function displayConversationFlow(conversationHistory, rounds) {
  const container = document.querySelector("#conversation-flow");
  if (!container) return;

  const roundGroups = {};
  for (let i = 1; i <= rounds; i++) {
    roundGroups[i] = conversationHistory.filter((m) => m.metadata.round === i);
  }

  render(
    html`
      <div class="conversation-container">
        <h4>
          <i class="bi bi-chat-dots me-2"></i>Agent Conversation (${rounds}
          rounds)
        </h4>

        ${Object.entries(roundGroups).map(
          ([round, messages]) => html`
            <div class="conversation-round">
              <div class="round-header">
                <span class="badge bg-primary">Round ${round}</span>
                <span class="text-muted">${messages.length} messages</span>
              </div>

              <div class="messages">
                ${messages.map(
                  (msg) => html`
                    <div class="message-card ${msg.type}">
                      <div class="message-header">
                        <strong>${msg.from}</strong>
                        <i class="bi bi-arrow-right mx-2"></i>
                        <strong
                          >${Array.isArray(msg.to)
                            ? msg.to.join(", ")
                            : msg.to}</strong
                        >
                        <span class="badge bg-secondary ms-2">${msg.type}</span>
                      </div>
                      <div class="message-content">${msg.content}</div>
                      ${msg.metadata.confidence
                        ? html`
                            <div class="message-footer">
                              <span class="confidence-badge">
                                Confidence: ${msg.metadata.confidence}%
                              </span>
                            </div>
                          `
                        : ""}
                    </div>
                  `,
                )}
              </div>
            </div>
          `,
        )}
      </div>
    `,
    container,
  );
}
```

#### 4.2 Enhanced Workflow Visualization with Message Arrows

```javascript
// src/workflow.js - Add animated message flow between agents
export function animateMessageFlow(fromAgent, toAgent, messageType) {
  if (!workflowViz) return;

  const { svg, nodes } = workflowViz;
  const sourceNode = nodes.find((n) => n.id === fromAgent);
  const targetNode = nodes.find((n) => n.id === toAgent);

  if (!sourceNode || targetNode) return;

  const sx = sourceNode.x,
    sy = sourceNode.y;
  const tx = targetNode.x,
    ty = targetNode.y;

  // Create curved path
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2 - 50;
  const path = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;

  // Animate message particle
  const particle = svg
    .append("circle")
    .attr("class", `message-particle ${messageType}`)
    .attr("r", 8)
    .attr("cx", sx)
    .attr("cy", sy);

  particle
    .transition()
    .duration(1000)
    .attrTween("transform", function () {
      return function (t) {
        const point = getPointAtLength(path, t);
        return `translate(${point.x - sx}, ${point.y - sy})`;
      };
    })
    .on("end", function () {
      d3.select(this).remove();
    });
}
```

#### 4.3 Add HTML Section for Conversation View

```html
<!-- index.html - Add after workflow banner -->
<div id="conversation-section" class="container my-4 d-none">
  <div class="card">
    <div class="card-header">
      <h5><i class="bi bi-diagram-3 me-2"></i>Multi-Agent Conversation</h5>
    </div>
    <div class="card-body">
      <div id="conversation-flow"></div>
    </div>
  </div>
</div>
```

---

## Phase 4.5: Real-Time Dynamic UI - What You'll SEE 🎬

### Overview

This section describes **exactly** what happens on screen in real-time as the multi-agent conversation unfolds.

---

### 🎭 Screen Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  WORKFLOW VISUALIZATION (D3)                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Orchestrator]                                              │   │
│  │       │                                                       │   │
│  │       ├──→ [VendorIntake] ⚡ ACTIVE                          │   │
│  │       ├──→ [InvoiceIQ] ⚡ ACTIVE (parallel!)                 │   │
│  │       └──→ [ContractCraft] 💤 WAITING                        │   │
│  │                                                               │   │
│  │  Message arrow flying: InvoiceIQ ──→ ContractCraft           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CONVERSATION FEED (Live Chat)                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Round 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   │   │
│  │  [12:34:01] VendorIntake → RiskGuard                         │   │
│  │  "Missing insurance certificate - can we proceed?"            │   │
│  │  Confidence: 85%                                              │   │
│  │                                                               │   │
│  │  [12:34:02] InvoiceIQ → ContractCraft                        │   │
│  │  "What's the contract rate for this vendor?"                 │   │
│  │  Confidence: 95%                                              │   │
│  │  ──────────────────────────────────────────                  │   │
│  │  Round 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ [ACTIVE]          │   │
│  │  [12:34:05] ContractCraft → InvoiceIQ                        │   │
│  │  "Contract rate is $100. You have 8% variance."              │   │
│  │  ⚡ TYPING... RiskGuard is analyzing...                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ROUND PROGRESS                                                      │
│  Round 2 of 10  ████████░░░░░░░░░░  20% complete                   │
│  Active Agents: 4/6  |  Messages: 7  |  Escalations: 0              │
└─────────────────────────────────────────────────────────────────────┘
```

---

### ⚡ Real-Time Behavior: Step-by-Step

#### Moment 1: Parallel Activation (0:00 - 0:03 seconds)

**What you SEE:**

```
Workflow Viz:
  - Orchestrator node pulses (blue glow)
  - TWO agents light up SIMULTANEOUSLY:
    • VendorIntake node turns BLUE ⚡ (status: "ACTIVE")
    • InvoiceIQ node turns BLUE ⚡ (status: "ACTIVE")
  - Animation: Data particles flow from Orchestrator to BOTH agents at same time

Conversation Feed:
  [Auto-scroll to bottom, new messages appear]

Console Log:
  [Round 1] VendorIntake ACTIVATED
  [Round 1] InvoiceIQ ACTIVATED
  ⚡ Parallel execution started - 2 agents analyzing simultaneously
```

**Implementation:**

```javascript
// src/messageBus.js - Emit real-time events
async activateAgentsParallel(agentNames) {
  console.log(`⚡ Activating ${agentNames.length} agents in parallel...`);

  // UI Event: Show parallel activation
  this.emit('agents-activating', { agents: agentNames, mode: 'parallel' });

  // Start all agents simultaneously (Promise.all = parallel)
  const activationPromises = agentNames.map(agentName => {
    const agent = this.activeAgents.get(agentName);

    // Update UI: Agent node turns active
    this.emit('agent-status-change', {
      agent: agentName,
      status: 'active',
      timestamp: Date.now()
    });

    return agent.initialAnalysis(this.extractedData);
  });

  await Promise.all(activationPromises); // Wait for ALL to complete
}

// src/workflow.js - Listen to events and animate
messageBus.on('agent-status-change', ({ agent, status, timestamp }) => {
  // Animate node
  const node = svg.select(`[data-agent="${agent}"]`);
  node.classed('active', status === 'active')
      .transition()
      .duration(300)
      .attr('stroke-width', 4)
      .attr('stroke', '#0d6efd');

  // Add pulsing effect
  node.append('circle')
      .attr('r', 50)
      .attr('fill', 'none')
      .attr('stroke', '#0d6efd')
      .attr('stroke-width', 2)
      .style('opacity', 0.8)
      .transition()
      .duration(1000)
      .attr('r', 70)
      .style('opacity', 0)
      .remove();
});
```

---

#### Moment 2: First Messages Sent (0:03 - 0:05 seconds)

**What you SEE:**

```
Workflow Viz:
  - Animated arrow flies from VendorIntake → RiskGuard
    (curved path, particle animation)
  - Animated arrow flies from InvoiceIQ → ContractCraft
    (different color for question type)

Conversation Feed:
  [NEW MESSAGE appears with fade-in animation]

  Round 1 ━━━━━━━━━━━━━━━━━━

  🏢 VendorIntake → 🛡️ RiskGuard
  ❓ QUESTION
  "Missing insurance certificate - can we proceed?"
  📊 Confidence: 85%
  [AWAITING RESPONSE...]

  [NEW MESSAGE appears 1 second later]

  📄 InvoiceIQ → 📋 ContractCraft
  ❓ QUESTION
  "What's the contract rate for this vendor?"
  📊 Confidence: 95%
  [AWAITING RESPONSE...]
```

**Implementation:**

```javascript
// src/messageBus.js - Send message with UI updates
async sendMessage(message) {
  this.messages.push(message);

  // Console log
  console.log(`[Round ${this.round}] ${message.from} → ${message.to}: ${message.type}`);

  // UI Event: Show message in feed
  this.emit('message-sent', message);

  // UI Event: Animate message flow in workflow viz
  this.emit('message-animate', {
    from: message.from,
    to: message.to,
    type: message.type,
    duration: 1000
  });

  // Route message
  await this.routeMessage(message);
}

// src/ui.js - Listen and render in real-time
let conversationFeed = document.getElementById('conversation-feed');

messageBus.on('message-sent', (message) => {
  const messageHtml = createMessageCard(message);

  // Add with fade-in animation
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = messageHtml;
  messageDiv.style.opacity = '0';
  conversationFeed.appendChild(messageDiv);

  // Fade in
  setTimeout(() => {
    messageDiv.style.transition = 'opacity 0.5s';
    messageDiv.style.opacity = '1';
  }, 50);

  // Auto-scroll to bottom
  conversationFeed.scrollTop = conversationFeed.scrollHeight;

  // Play sound effect (optional)
  playMessageSound(message.type);
});

function createMessageCard(message) {
  const icons = {
    'VendorIntake': '🏢',
    'InvoiceIQ': '📄',
    'ContractCraft': '📋',
    'RiskGuard': '🛡️',
    'PayFlow': '💰',
    'Supplier360': '📊'
  };

  const typeColors = {
    'question': 'primary',
    'answer': 'success',
    'challenge': 'warning',
    'broadcast': 'danger',
    'escalate_human': 'dark'
  };

  return `
    <div class="message-card message-${message.type} animate-in">
      <div class="message-header">
        <span class="agent-icon">${icons[message.from] || '🤖'}</span>
        <strong>${message.from}</strong>
        <i class="bi bi-arrow-right mx-2"></i>
        <span class="agent-icon">${icons[message.to] || '🤖'}</span>
        <strong>${message.to}</strong>
        <span class="badge bg-${typeColors[message.type]} ms-2">
          ${message.type.toUpperCase()}
        </span>
        <span class="timestamp">${formatTime(message.metadata.timestamp)}</span>
      </div>
      <div class="message-content">${message.content}</div>
      ${message.metadata.confidence ? `
        <div class="message-footer">
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${message.metadata.confidence}%"></div>
          </div>
          <span class="confidence-label">Confidence: ${message.metadata.confidence}%</span>
        </div>
      ` : ''}
      <div class="message-status">
        <span class="status-indicator waiting">⏳ Awaiting response...</span>
      </div>
    </div>
  `;
}

// src/workflow.js - Animate message arrow
messageBus.on('message-animate', ({ from, to, type, duration }) => {
  const sourceNode = nodes.find(n => n.id === from);
  const targetNode = nodes.find(n => n.id === to);

  if (!sourceNode || !targetNode) return;

  // Create curved path
  const sx = sourceNode.x, sy = sourceNode.y + 40;
  const tx = targetNode.x, ty = targetNode.y - 40;
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2 - 80; // Curve upward

  const pathString = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;

  // Draw path temporarily
  const path = svg.append('path')
    .attr('d', pathString)
    .attr('stroke', getMessageColor(type))
    .attr('stroke-width', 3)
    .attr('fill', 'none')
    .attr('opacity', 0.6)
    .attr('stroke-dasharray', '5,5');

  // Animate particle along path
  const particle = svg.append('circle')
    .attr('r', 8)
    .attr('cx', sx)
    .attr('cy', sy)
    .attr('fill', getMessageColor(type))
    .attr('class', 'message-particle');

  const pathLength = path.node().getTotalLength();

  particle
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .attrTween('transform', function() {
      return function(t) {
        const point = path.node().getPointAtLength(t * pathLength);
        return `translate(${point.x - sx}, ${point.y - sy})`;
      };
    })
    .on('end', function() {
      d3.select(this).remove();
      path.transition().duration(500).attr('opacity', 0).remove();

      // Target node "receives" message - flash effect
      const targetNodeSvg = svg.select(`[data-agent="${to}"]`);
      targetNodeSvg
        .append('circle')
        .attr('r', 0)
        .attr('fill', getMessageColor(type))
        .attr('opacity', 0.6)
        .transition()
        .duration(500)
        .attr('r', 60)
        .attr('opacity', 0)
        .remove();
    });
});

function getMessageColor(messageType) {
  const colors = {
    'question': '#0d6efd',      // Blue
    'answer': '#198754',        // Green
    'challenge': '#ffc107',     // Yellow
    'broadcast': '#dc3545',     // Red
    'escalate_human': '#6c757d' // Gray
  };
  return colors[messageType] || '#0d6efd';
}
```

---

#### Moment 3: Round Transition (0:10 - 0:12 seconds)

**What you SEE:**

```
Round Progress Bar:
  Round 1 ████████████████████ 100% complete ✓
  [TRANSITION ANIMATION - bar slides left, new bar appears]
  Round 2 ░░░░░░░░░░░░░░░░░░░░ 0% starting...

Conversation Feed:
  [Round divider appears]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Round 2 Starting - 3 agents active
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Console Log:
  [Round 1 Complete] 4 messages exchanged

  --- Starting Round 2 ---

  Active agents: VendorIntake, InvoiceIQ, ContractCraft, RiskGuard
```

**Implementation:**

```javascript
// src/conversationManager.js - Round transition
async processConversationRound() {
  // Update UI: Round progress
  this.emit('round-transition', {
    from: this.bus.round - 1,
    to: this.bus.round,
    activeAgents: this.bus.activeAgents.size,
    messageCount: this.bus.messages.filter(m => m.metadata.round === this.bus.round - 1).length
  });

  // Wait for animation
  await sleep(500);

  // Continue processing...
}

// src/ui.js - Render round progress
messageBus.on('round-transition', ({ from, to, activeAgents, messageCount }) => {
  const progressBar = document.getElementById('round-progress-bar');
  const progressText = document.getElementById('round-progress-text');

  // Update progress bar
  const percentage = (to / 10) * 100; // Assuming max 10 rounds
  progressBar.style.width = `${percentage}%`;
  progressBar.classList.remove('bg-primary');
  progressBar.classList.add('bg-info');

  // Update text
  progressText.innerHTML = `
    Round ${to} of 10
    <span class="badge bg-secondary ms-2">${activeAgents} agents active</span>
    <span class="badge bg-secondary ms-2">${messageCount} messages in round ${from}</span>
  `;

  // Add round divider to conversation feed
  const divider = document.createElement('div');
  divider.className = 'round-divider';
  divider.innerHTML = `
    <hr>
    <div class="round-badge">
      <i class="bi bi-circle-fill text-primary me-2"></i>
      Round ${to} Starting - ${activeAgents} agents active
    </div>
    <hr>
  `;
  conversationFeed.appendChild(divider);
  conversationFeed.scrollTop = conversationFeed.scrollHeight;
});
```

---

#### Moment 4: Broadcast Signal (0:15 seconds)

**What you SEE:**

```
Workflow Viz:
  - RiskGuard node GLOWS RED 🔴
  - Animated shock wave expands from RiskGuard to ALL agents
  - All agent nodes flash briefly (acknowledging broadcast)

Conversation Feed:
  [SPECIAL BROADCAST MESSAGE CARD - full width, red background]

  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ 🚨 BROADCAST FROM RiskGuard              ┃
  ┃                                           ┃
  ┃ "HIGH RISK DETECTED - Enhanced scrutiny  ┃
  ┃  required. All agents adjust tolerance." ┃
  ┃                                           ┃
  ┃ → Sent to: ALL AGENTS                    ┃
  ┃ → Urgency: HIGH                          ┃
  ┃ → Policy: Tolerance set to 5%            ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

  [Below, each agent acknowledges]

  ✓ VendorIntake acknowledged (0.2s later)
  ✓ InvoiceIQ acknowledged (0.3s later)
  ✓ ContractCraft acknowledged (0.2s later)
  ✓ PayFlow acknowledged (0.4s later)
```

**Implementation:**

```javascript
// src/agentProtocol.js - Broadcast message
class BroadcastMessage extends AgentMessage {
  constructor(from, content, metadata = {}) {
    super(from, ['all'], MessageType.BROADCAST, content, {
      urgency: 'high',
      ...metadata
    });
  }
}

// src/messageBus.js - Handle broadcast
async sendMessage(message) {
  if (message.type === MessageType.BROADCAST) {
    // Special UI event for broadcasts
    this.emit('broadcast-signal', {
      from: message.from,
      content: message.content,
      urgency: message.metadata.urgency
    });

    // Send to all agents with delay (simulate propagation)
    for (const [agentName, agent] of this.activeAgents) {
      if (agentName !== message.from) {
        setTimeout(async () => {
          await agent.receiveMessage(message);

          // Emit acknowledgment
          this.emit('broadcast-acknowledged', {
            agent: agentName,
            from: message.from
          });
        }, Math.random() * 500); // Random delay 0-500ms
      }
    }
  }
}

// src/workflow.js - Animate broadcast wave
messageBus.on('broadcast-signal', ({ from, content, urgency }) => {
  const sourceNode = nodes.find(n => n.id === from);
  if (!sourceNode) return;

  // Source node glows
  const sourceNodeSvg = svg.select(`[data-agent="${from}"]`);
  sourceNodeSvg.classed('broadcasting', true);

  // Create expanding circle (shock wave)
  const wave = svg.append('circle')
    .attr('cx', sourceNode.x)
    .attr('cy', sourceNode.y)
    .attr('r', 60)
    .attr('fill', 'none')
    .attr('stroke', urgency === 'high' ? '#dc3545' : '#ffc107')
    .attr('stroke-width', 4)
    .attr('opacity', 0.8);

  wave.transition()
    .duration(1500)
    .ease(d3.easeCircleOut)
    .attr('r', 500)
    .attr('stroke-width', 1)
    .attr('opacity', 0)
    .on('end', function() {
      d3.select(this).remove();
      sourceNodeSvg.classed('broadcasting', false);
    });
});

messageBus.on('broadcast-acknowledged', ({ agent, from }) => {
  // Agent node flashes
  const agentNode = svg.select(`[data-agent="${agent}"]`);
  agentNode
    .append('circle')
    .attr('r', 50)
    .attr('fill', '#198754')
    .attr('opacity', 0.5)
    .transition()
    .duration(400)
    .attr('r', 70)
    .attr('opacity', 0)
    .remove();
});
```

---

#### Moment 5: Agent "Thinking" Indicator (Ongoing)

**What you SEE:**

```
Conversation Feed:
  [Latest message from InvoiceIQ]

  📄 InvoiceIQ → 🛡️ RiskGuard
  ❓ QUESTION
  "8% variance detected - is this acceptable?"

  [TYPING INDICATOR appears below]

  🛡️ RiskGuard is analyzing... ⏳
  [Three animated dots]
  ● ● ●
```

**Implementation:**

```javascript
// src/agent.js - Show thinking state
async answerQuestion(message) {
  // Emit typing indicator
  this.bus.emit('agent-thinking', {
    agent: this.name,
    action: 'analyzing'
  });

  const prompt = this.buildPrompt({ /* ... */ });
  const response = await this.callLLM(prompt);

  // Remove typing indicator
  this.bus.emit('agent-done-thinking', {
    agent: this.name
  });

  // Send answer...
}

// src/ui.js - Show typing indicator
messageBus.on('agent-thinking', ({ agent, action }) => {
  const indicator = document.createElement('div');
  indicator.id = `typing-${agent}`;
  indicator.className = 'typing-indicator';
  indicator.innerHTML = `
    <div class="typing-dots">
      <span class="agent-icon">${getAgentIcon(agent)}</span>
      <strong>${agent}</strong> is ${action}
      <span class="dot">●</span>
      <span class="dot">●</span>
      <span class="dot">●</span>
    </div>
  `;
  conversationFeed.appendChild(indicator);
  conversationFeed.scrollTop = conversationFeed.scrollHeight;
});

messageBus.on('agent-done-thinking', ({ agent }) => {
  const indicator = document.getElementById(`typing-${agent}`);
  if (indicator) {
    indicator.classList.add('fade-out');
    setTimeout(() => indicator.remove(), 300);
  }
});
```

---

### 🎨 CSS Animations

```css
/* Pulsing active agent */
.agent-node.active {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 5px #0d6efd);
  }
  50% {
    filter: drop-shadow(0 0 15px #0d6efd);
  }
}

/* Message card fade in */
.message-card.animate-in {
  animation: slideInUp 0.5s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing indicator dots */
.typing-dots .dot {
  animation: blink 1.4s infinite both;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

/* Broadcast message special styling */
.message-card.message-broadcast {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: 3px solid #dc3545;
  box-shadow: 0 0 20px rgba(220, 53, 69, 0.5);
}

/* Broadcasting agent glow */
.agent-node.broadcasting {
  filter: drop-shadow(0 0 20px #dc3545);
}
```

---

### 🎯 Complete Example: What You'll See for Disputed Invoice

**Timeline of Visual Events:**

```
0:00 - Orchestrator pulses, planning
0:02 - VendorIntake + InvoiceIQ light up IN PARALLEL ⚡⚡
0:03 - Blue arrow flies: InvoiceIQ → ContractCraft
0:03 - Blue arrow flies: VendorIntake → RiskGuard (simultaneous!)
0:04 - Message appears in feed: "What's contract rate?"
0:04 - Message appears in feed: "Missing insurance?"
0:05 - ContractCraft lights up, "thinking" dots appear
0:07 - Green arrow flies: ContractCraft → InvoiceIQ
0:08 - Message appears: "Contract rate is $100"
0:10 - RiskGuard glows RED, broadcast wave expands
0:11 - ALL agents flash (acknowledging broadcast)
0:11 - Red broadcast banner appears: "HIGH RISK DETECTED"
0:12 - Round 2 divider slides in
0:13 - InvoiceIQ → RiskGuard: "8% variance detected"
0:15 - Yellow arrow (challenge): ContractCraft → InvoiceIQ
... [continues for 8 rounds]
0:45 - PayFlow turns DARK, escalation banner appears
0:46 - "🚨 HUMAN ESCALATION: CFO approval required"
0:47 - Final evaluation modal pops up with full summary
```

Every action has a visual representation!

---

## Phase 5: Human-in-the-Loop (HITL) - Core Feature 🎯

### Overview

HITL is **NOT optional** - it's the safety net that makes the system trustworthy. Agents operate autonomously but **know when to stop and ask humans**.

### Core Principle

> **"Agents negotiate until they can't - then they escalate intelligently."**

Agents should:

- ✅ **Exhaust their options** before escalating
- ✅ **Explain WHY** they need human input (not just "I don't know")
- ✅ **Provide context** (conversation history, evidence, recommendations)
- ✅ **Resume work** after human decision (not start over)

---

### HITL Triggers (When Agents Escalate)

#### 1. Policy Violations

```javascript
// RiskGuard Agent
if (variance > toleranceThreshold) {
  this.bus.sendMessage(
    new AgentMessage(
      "RiskGuard",
      "human",
      MessageType.ESCALATE_HUMAN,
      `Payment variance (${variance}%) exceeds policy (${toleranceThreshold}%)`,
      {
        escalationType: "POLICY_VIOLATION",
        requiresRole: "CFO",
        urgency: "high",
        context: {
          invoiceAmount: 108,
          contractAmount: 100,
          variance: 8,
          tolerance: 5,
          reason: "Missing insurance certificate increases risk",
        },
      },
    ),
  );
}
```

**What user sees:**

```
🚨 HUMAN ESCALATION REQUIRED

From: RiskGuard
To: CFO
Urgency: HIGH

Issue: Payment variance exceeds policy threshold

Details:
  • Invoice Amount: $108
  • Contract Amount: $100
  • Variance: 8% (exceeds 5% tolerance)
  • Risk Factor: Missing insurance certificate

Agent Recommendation: BLOCK payment pending approval

Conversation History: [View 8 rounds]

Your Decision:
  [APPROVE EXCEPTION] [REJECT PAYMENT] [REQUEST MORE INFO]
```

#### 2. Low Confidence

```javascript
// InvoiceIQ Agent - OCR uncertainty
if (ocrConfidence < 70) {
  this.bus.sendMessage(
    new AgentMessage(
      "InvoiceIQ",
      "human",
      MessageType.ESCALATE_HUMAN,
      `OCR confidence too low (${ocrConfidence}%) - manual verification needed`,
      {
        escalationType: "LOW_CONFIDENCE",
        requiresRole: "Procurement Specialist",
        urgency: "medium",
        context: {
          extractedAmount: "10X", // Uncertain character
          ocrConfidence: 65,
          fileQuality: "poor scan",
          contractAmount: 100,
        },
        attachments: ["invoice-scan.pdf"],
      },
    ),
  );
}
```

**What user sees:**

```
⚠️ VERIFICATION NEEDED

From: InvoiceIQ
To: Procurement Specialist
Urgency: MEDIUM

Issue: Cannot read invoice amount with confidence

OCR Extracted: "10X" (65% confidence)
Expected (from contract): $100

Action Required:
  Please manually verify the invoice amount from the attached scan.

  [VIEW INVOICE PDF]

  Verified Amount: [________]
  [SUBMIT]
```

#### 3. Agent Disagreement / Deadlock

```javascript
// ConversationManager - Agents can't reach consensus
if (this.detectDeadlock() || this.round >= this.maxRounds) {
  this.bus.sendMessage(
    new AgentMessage(
      "ConversationManager",
      "human",
      MessageType.ESCALATE_HUMAN,
      "Agents unable to reach consensus - human decision required",
      {
        escalationType: "AGENT_DEADLOCK",
        requiresRole: "Manager",
        urgency: "high",
        context: {
          rounds: this.round,
          activeAgents: this.agents.map((a) => a.name),
          conflictingSummaries: {
            InvoiceIQ: "Variance detected, needs review",
            RiskGuard: "Block payment",
            ContractCraft: "No amendment found",
            PayFlow: "Awaiting authorization",
          },
        },
      },
    ),
  );
}
```

**What user sees:**

```
🤝 DECISION REQUIRED

From: Conversation Manager
To: Procurement Manager
Urgency: HIGH

Issue: Agents reached 10 rounds without consensus

Active Agents: 4
Conversation Rounds: 10

Agent Positions:
  • InvoiceIQ: "Variance detected, needs review"
  • RiskGuard: "Block payment due to policy"
  • ContractCraft: "No amendment authorizes variance"
  • PayFlow: "Awaiting your authorization"

[VIEW FULL CONVERSATION]

Your Decision:
  [APPROVE PAYMENT] [REJECT PAYMENT] [REQUEST AMENDMENT]
```

#### 4. Critical Thresholds

```javascript
// PayFlow Agent - High-value transactions
if (invoiceAmount > 100000) {
  this.bus.sendMessage(
    new AgentMessage(
      "PayFlow",
      "human",
      MessageType.ESCALATE_HUMAN,
      `High-value payment requires executive approval`,
      {
        escalationType: "HIGH_VALUE",
        requiresRole: "CFO",
        urgency: "high",
        context: {
          amount: invoiceAmount,
          vendor: vendorName,
          threshold: 100000,
          allChecksPass: true,
        },
      },
    ),
  );
}
```

---

### HITL Visual Design

**HITL Modal appears with:**

- 🚨 **Urgent red header** (pulsing animation for high-priority)
- 📋 **Context table** showing all relevant data
- 🎯 **Agent recommendation** (what they suggest)
- 📜 **Full conversation history** (expandable)
- 🎬 **Action buttons** (Approve, Reject, More Info)
- ⏱️ **Auto-tracking** resolution time

**After human decision:**

- ✅ **Decision logged** in conversation feed (green card)
- 🔄 **Agents resume** from where they stopped
- 📊 **Metrics tracked** (escalation rate, resolution time)

---

### HITL Metrics Dashboard

```javascript
// Display HITL metrics
HITL Stats:
  Total Escalations: 12
  By Type:
    - Policy Violations: 5
    - Low Confidence: 3
    - Deadlocks: 2
    - High Value: 2
  Avg Resolution Time: 45 seconds
  Approval Rate: 67%
  By Urgency:
    - High: 8
    - Medium: 4
```

---

### Success Criteria for HITL

✅ **Escalations are contextual** - Include full conversation history, not just current error
✅ **Escalations are actionable** - Clear buttons, not just "OK"
✅ **Agents resume intelligently** - Don't restart from scratch after human decision
✅ **Metrics tracked** - Know how often humans intervene, resolution times, approval rates
✅ **Role-based routing** - CFO sees high-value, Specialist sees low-confidence OCR
✅ **Visual prominence** - HITL modals can't be missed, urgent ones pulse

---

## Phase 6: Demo Scenario Implementation

### Goal

Implement specific demo scenarios from DEMO_SCENARIOS.md with full agentic behavior.

### Scenario 4: Disputed Invoice (8-Round Negotiation) ⭐

#### Setup

**Files:**

- `data/invoices_pdf/INV-4589.pdf` ($108 invoice)
- `data/contracts/VENDOR-0005_contract.pdf` ($100 contract rate)
- `data/kyc_samples/VENDOR-0005_KYC.pdf` (missing insurance)
- `data/po_gr.csv`

#### Expected Conversation Flow

**Round 1 - Parallel Start:**

```javascript
[VendorIntake] → Analyzes KYC, detects missing insurance
[InvoiceIQ] → Analyzes invoice, extracts $108 amount
[ContractCraft] → Loaded contract with $100 rate

Messages:
- VendorIntake → RiskGuard: "Missing insurance certificate - can we proceed?"
- InvoiceIQ → ContractCraft: "What's the contract rate for this vendor?"
```

**Round 2 - Initial Responses:**

```javascript
Messages:
- ContractCraft → InvoiceIQ: "Contract rate is $100. Variance is 8%."
- RiskGuard → VendorIntake: "Missing insurance = compliance gap. Set Enhanced Review."
- RiskGuard → [ALL]: "BROADCAST: Enhanced scrutiny required - high risk vendor"
```

**Round 3 - Variance Challenge:**

```javascript
Messages:
- InvoiceIQ → RiskGuard: "8% variance detected between invoice and contract"
- ContractCraft → InvoiceIQ: "Confirmed $100 rate. Is invoice data accurate?"
- InvoiceIQ → ContractCraft: "Re-checked OCR. $108 is correct. Real variance."
```

**Round 4 - Policy Gate:**

```javascript
Messages:
- RiskGuard → ContractCraft: "Check for approved change orders or amendments"
- RiskGuard: Sets tolerance = 5% (due to missing insurance)
- RiskGuard: Decision = BLOCK (8% > 5% tolerance)
```

**Round 5 - Amendment Check:**

```javascript
Messages:
- ContractCraft → RiskGuard: "No amendments found. No coverage for variance."
- RiskGuard → PayFlow: "BLOCK payment - variance exceeds policy"
```

**Round 6 - Payment Gate:**

```javascript
Messages:
- PayFlow → RiskGuard: "Confirmed block. Preparing exception package."
- PayFlow → [HUMAN]: "Need CFO approval for 8% variance exception"
```

**Round 7 - Historical Context:**

```javascript
Messages:
- Supplier360 → RiskGuard: "First variance event for this vendor"
- Supplier360 → PayFlow: "No prior payment issues detected"
- Supplier360: Updates vendor KPI with variance event
```

**Round 8 - Final Consensus:**

```javascript
Messages:
- RiskGuard → [ALL]: "Consensus: BLOCK payment pending CFO review"
- Supplier360 → [ALL]: "Recommendation: Monitor next invoice closely"
- PayFlow → [HUMAN]: "Escalation package ready for CFO"

CONVERSATION ENDS - Human escalation triggered
```

#### Implementation Code

```javascript
// config.json - Add Scenario 4
{
  "demos": [
    {
      "title": "Disputed Invoice (8-Round Negotiation) ⭐",
      "icon": "bi bi-exclamation-octagon",
      "description": "Best demo - shows multi-round agent negotiation, policy enforcement, and human escalation",
      "files": [
        "data/invoices_pdf/INV-4589.pdf",
        "data/contracts/VENDOR-0005_contract.pdf",
        "data/kyc_samples/VENDOR-0005_KYC.pdf",
        "data/po_gr.csv"
      ],
      "expectedBehavior": {
        "rounds": 8,
        "agentsInvolved": ["VendorIntake", "InvoiceIQ", "ContractCraft", "RiskGuard", "PayFlow", "Supplier360"],
        "keyMessages": [
          "InvoiceIQ questions ContractCraft about rate",
          "RiskGuard broadcasts high-risk signal",
          "RiskGuard sets 5% tolerance dynamically",
          "ContractCraft checks amendments",
          "PayFlow blocks payment",
          "Escalation to CFO"
        ],
        "finalOutcome": "BLOCK_PAYMENT_PENDING_APPROVAL"
      }
    }
  ]
}
```

---

## Phase 7: Testing & Validation

### Goal

Ensure system behaves correctly with edge cases and limits.

### Test Cases

#### 6.1 Infinite Loop Prevention

```javascript
// Test: Two agents keep asking each other the same question
// Expected: Detect loop after 3 identical exchanges, escalate or break

messageBus.detectLoop = function () {
  const recentMessages = this.messages.slice(-6);
  const questions = recentMessages.filter(
    (m) => m.type === MessageType.QUESTION,
  );

  // Check for repeated questions
  const questionTexts = questions.map((q) => q.content.toLowerCase());
  const uniqueQuestions = new Set(questionTexts);

  if (questionTexts.length >= 4 && uniqueQuestions.size <= 2) {
    console.warn("Potential loop detected - escalating to orchestrator");
    return true;
  }

  return false;
};
```

#### 6.2 Max Rounds Enforcement

```javascript
// Test: Conversation exceeds 10 rounds
// Expected: Force termination, synthesize best available decision

conversationManager.runConversation = async function () {
  while (!this.bus.shouldEndConversation()) {
    if (this.bus.round >= this.bus.maxRounds) {
      console.warn(
        `Max rounds (${this.bus.maxRounds}) reached - forcing conclusion`,
      );
      break;
    }
    this.bus.nextRound();
    await this.processConversationRound();
  }
};
```

#### 6.3 Deadlock Detection

```javascript
// Test: All agents waiting for answers, no progress
// Expected: Orchestrator injects decision or escalates

conversationManager.detectDeadlock = function () {
  const lastRound = this.bus.messages.filter(
    (m) => m.metadata.round === this.bus.round,
  );
  const allQuestions = lastRound.every((m) => m.type === MessageType.QUESTION);

  if (allQuestions && lastRound.length === this.agents.length) {
    console.warn("Deadlock detected - all agents waiting for answers");
    return true;
  }

  return false;
};
```

#### 6.4 Confidence Threshold Escalation

```javascript
// Test: All agents report <50% confidence
// Expected: Auto-escalate to human

conversationManager.checkConfidenceLevels = function () {
  const confidenceLevels = this.agents.map((a) => a.internalState.confidence);
  const avgConfidence =
    confidenceLevels.reduce((a, b) => a + b, 0) / confidenceLevels.length;

  if (avgConfidence < 50) {
    console.warn(
      `Low average confidence (${avgConfidence}%) - escalating to human`,
    );
    this.bus.sendMessage(
      new AgentMessage(
        "ConversationManager",
        "human",
        MessageType.ESCALATE_HUMAN,
        `Average agent confidence too low: ${avgConfidence}%`,
      ),
    );
  }
};
```

---

## Implementation Timeline

| Phase       | Tasks                   | Estimated Effort | Dependencies  |
| ----------- | ----------------------- | ---------------- | ------------- |
| **Phase 1** | Message Bus + Protocol  | 2-3 days         | None          |
| **Phase 2** | Enhanced Agent Class    | 3-4 days         | Phase 1       |
| **Phase 3** | Parallel Execution      | 2-3 days         | Phase 1, 2    |
| **Phase 4** | UI Enhancements         | 2-3 days         | Phase 1, 2, 3 |
| **Phase 5** | HITL (Core Feature) 🎯  | 2-3 days         | Phase 1, 2    |
| **Phase 6** | Demo Scenarios          | 2-3 days         | All previous  |
| **Phase 7** | Testing & Edge Cases    | 2-3 days         | All previous  |
| **Total**   | **15-22 days**          |                  |               |

---

## Success Metrics

### Before (Sequential)

- ❌ Agents execute sequentially: 60-90 seconds total
- ❌ No agent-to-agent interaction
- ❌ Single-pass workflow (no iterations)
- ❌ No dynamic routing
- ❌ Hard-coded escalation rules

### After (Multi-Agentic)

- ✅ **Parallelism**: Independent agents start simultaneously
- ✅ **Conversations**: 5-10 message rounds between agents
- ✅ **Negotiation**: Agents challenge, verify, and adjust
- ✅ **Broadcast**: RiskGuard signals affect all agents
- ✅ **Dynamic**: Workflow emerges from conversation
- ✅ **Confidence**: Agents express uncertainty and self-escalate
- ✅ **Learning**: Supplier360 provides historical context
- ✅ **HITL (Core)**: Intelligent escalation with full context, agents resume after human decision
  - Policy violations → CFO approval
  - Low confidence → Specialist verification
  - Agent deadlock → Manager decision
  - High-value → Executive approval

---

## Demo Script (5-Minute)

### Setup

1. Open `index.html`
2. Click "Configure LLM" and enter API credentials
3. Enable "Agentic Mode" in settings ✅

### Execution

1. Navigate to "Quick Demo Scenarios"
2. Click **"Disputed Invoice (8-Round Negotiation) ⭐"**
3. **Open browser console** (F12) to see agent messages in real-time

### Narration

> "Notice how multiple agents activate in parallel.
> InvoiceIQ questions ContractCraft about the contract rate.
> RiskGuard broadcasts a high-risk signal to all agents.
> ContractCraft challenges InvoiceIQ on the variance.
> After 8 rounds of negotiation, agents reach consensus: BLOCK payment.
> Finally, PayFlow escalates to CFO because agents couldn't resolve it.
>
> **This is not a conveyor belt - it's a conversation.**
> The workflow emerged from agent reasoning, not a fixed path."

### Visual Highlights

- **Workflow viz**: Show parallel activation + message arrows
- **Conversation timeline**: Expand to show all 8 rounds
- **Console logs**: Point out agent questioning logs
- **Final result**: HITL escalation with full context

---

## Next Steps

1. **Review this plan** and confirm approach
2. **Start Phase 1**: Build message bus foundation
3. **Parallel dev**: UI team can prototype conversation view (Phase 4) while core team builds Phase 1-2
4. **Weekly demos**: Show progress on Scenario 4 each week
5. **Iterate**: Adjust based on LLM performance and demo feedback

---

## Key Deliverables

### Code Files

- [ ] `src/messageBus.js` - Message routing system
- [ ] `src/agentProtocol.js` - Message types and schemas
- [ ] `src/conversationManager.js` - Multi-round orchestration
- [ ] `src/agent.js` - Enhanced with agentic capabilities
- [ ] `src/hitl.js` - 🎯 Human-in-the-Loop modal system (CORE)
- [ ] `src/ui.js` - Conversation timeline rendering + HITL UI
- [ ] `src/workflow.js` - Dynamic message flow animation
- [ ] `config.json` - Updated with conversation prompts

### Documentation

- [ ] `ARCHITECTURE.md` - System design documentation
- [ ] `API.md` - Message bus and agent protocol API reference
- [ ] `DEMO_GUIDE.md` - Step-by-step demo instructions
- [ ] `TROUBLESHOOTING.md` - Common issues and solutions

### Demo Assets

- [ ] Scenario 4 data files (invoice, contract, KYC)
- [ ] Video recording of 8-round conversation
- [ ] Screenshot annotations for presentation
- [ ] Slide deck with before/after comparison

---

## Risks & Mitigation

| Risk                           | Impact                       | Mitigation                                                    |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------- |
| **LLM latency**                | Conversations take too long  | Use faster models for agents (gpt-4.1-nano), stream responses |
| **Infinite loops**             | System gets stuck            | Max rounds limit (10), loop detection, deadlock prevention    |
| **Context overflow**           | Too many messages for LLM    | Summarize older rounds, prune irrelevant messages             |
| **Non-deterministic behavior** | Hard to debug                | Detailed logging, conversation replay capability              |
| **Cost**                       | Multiple LLM calls expensive | Use smaller models, cache common responses                    |
| **Complexity**                 | Hard to understand           | Clear visualizations, step-through debugging mode             |

---

## Conclusion

This plan transforms the current **linear BPM** into a true **multi-agentic system** with **HITL at its core** where:

1. **Agents talk to each other** - not just pass data forward
2. **Workflow emerges** from conversation - not predetermined
3. **Negotiation happens** - agents challenge and verify
4. **Policy is dynamic** - RiskGuard sets tolerance based on evidence
5. **Escalation is smart** - only when agents can't decide
6. **🎯 HITL is core** - intelligent escalation with context, role-based routing, agents resume after decision

The **Disputed Invoice scenario** demonstrates **all agentic features** including **HITL escalation** in **8 conversation rounds**, making it the perfect demo to showcase the difference between sequential and truly agentic workflows.

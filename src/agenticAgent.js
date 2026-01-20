// Agentic Agent - Enhanced agent with questioning, answering, and negotiation capabilities
import { asyncLLM } from "asyncllm";
import { openaiConfig } from "bootstrap-llm-provider";
import { parse } from "partial-json";
import { MessageType, AgentMessage, QuestionMessage, AnswerMessage, BroadcastMessage, EscalationMessage, EscalationType } from './agentProtocol.js';
import { config } from './config.js';
import { getPrompt } from './promptLoader.js';

/**
 * AgenticAgent - An agent that can:
 * - Analyze documents
 * - Ask questions to other agents
 * - Answer questions from other agents
 * - Challenge decisions
 * - Broadcast signals
 * - Escalate to humans when needed
 */
export class AgenticAgent {
  constructor(agentConfig, messageBus) {
    this.name = agentConfig.name;
    this.config = agentConfig;
    this.bus = messageBus;

    // Internal state
    this.state = {
      findings: null,
      confidence: 100,
      pendingQuestions: [],
      receivedAnswers: [],
      riskTolerance: 10, // Default 10% variance tolerance
      concerns: [],
      resolved: false
    };

    // Register with message bus
    this.bus.registerAgent(this.name, this);
  }

  /**
   * Initial parallel analysis - Round 1
   * Agent analyzes documents and generates initial questions
   */
  async initialAnalysis(extractedData, round) {
    console.log(`  🔍 ${this.name}: Starting initial analysis...`);
    console.log(`  📂 ${this.name}: Received ${extractedData?.length || 0} documents`);
    console.log(`  🔧 ${this.name}: Config check - role: ${this.config.role ? 'YES' : 'NO'}, desc: ${this.config.description ? 'YES' : 'NO'}`);

    // Emit thinking state
    this.bus.emit('agent-thinking', {
      agent: this.name,
      action: 'analyzing documents',
      timestamp: Date.now()
    });

    try {
      console.log(`  🏗️  ${this.name}: Building prompt...`);

      // Build prompt for initial analysis
      const prompt = await this.buildInitialAnalysisPrompt(extractedData);

      console.log(`  📝 ${this.name}: Generated prompt - type: ${typeof prompt}, length: ${prompt?.length || 0} chars`);

      if (!prompt) {
        throw new Error('Prompt generation returned null/undefined');
      }

      // Call LLM
      console.log(`  📞 ${this.name}: Calling LLM...`);
      const response = await this.callLLM(prompt);

      // Store findings
      this.state.findings = response.findings;
      this.state.confidence = response.confidence || 100;
      this.state.concerns = response.concerns || [];

      console.log(`  ✅ ${this.name}: Analysis complete (${this.state.confidence}% confidence)`);

      // Generate initial questions for other agents
      if (response.questionsFor) {
        for (const [targetAgent, questions] of Object.entries(response.questionsFor)) {
          // DEMO OPTIMIZATION: Limit to 1 strategic question per agent for focused demo
          const limitedQuestions = questions.slice(0, 1);

          if (questions.length > 1) {
            console.log(`  ⚠️  ${this.name}: Limited questions to ${targetAgent} from ${questions.length} to 1 (demo mode)`);
          }

          for (const question of limitedQuestions) {
            const msg = new QuestionMessage(
              this.name,
              targetAgent,
              question,
              {
                round: round,
                confidence: this.state.confidence
              }
            );
            await this.bus.sendMessage(msg);
          }
        }
      }

      // Emit done thinking
      this.bus.emit('agent-done-thinking', {
        agent: this.name,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error(`  ❌ ${this.name}: Analysis failed:`, error);
      this.bus.emit('agent-error', {
        agent: this.name,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * Build initial analysis prompt
   */
  async buildInitialAnalysisPrompt(extractedData) {
    try {
      const extractedDataText = extractedData.map(d => `File: ${d.filename}\n${d.text}`).join("\n\n---\n\n");

      const prompt = await getPrompt('agent_initial', {
        agentName: this.name,
        description: this.config.description,
        role: this.config.role,
        task: this.config.task,
        extractedData: extractedDataText
      });

      if (!prompt || prompt.trim() === '') {
        throw new Error('Prompt template is empty or not found');
      }

      return prompt;
    } catch (error) {
      console.error(`Failed to build prompt for ${this.name}:`, error);
      // Fallback to inline prompt if template loading fails
      const extractedDataText = extractedData.map(d => `File: ${d.filename}\n${d.text}`).join("\n\n---\n\n");

      return `You are ${this.name}, an AI agent in a multi-agent system.

## Your Role
${this.config.role}

## Your Description
${this.config.description}

## Your Task
${this.config.task}

## Documents to Analyze
${extractedDataText}

---

## Instructions for Initial Analysis

This is Round 1 of a multi-agent conversation. Analyze the documents and return valid JSON:

{
  "findings": "Your analysis summary - what you found and can confirm",
  "confidence": 85,
  "questionsFor": {
    "RiskGuardAgent": ["Question for RiskGuard"],
    "ContractCraftAgent": ["Question for ContractCraft"]
  },
  "concerns": ["Any issues or missing data"]
}

Return ONLY valid JSON, no other text.`;
    }
  }

  /**
   * Generate messages based on conversation history
   * This is called in each round after Round 1
   */
  async generateMessages(conversationHistory) {
    // Skip if already resolved
    if (this.state.resolved) {
      return [];
    }

    // Get messages relevant to this agent
    const myQuestions = conversationHistory.filter(
      m => m.from === this.name && m.type === MessageType.QUESTION
    );

    const answersToMe = conversationHistory.filter(
      m => m.to === this.name && m.type === MessageType.ANSWER
    );

    const questionsToMe = conversationHistory.filter(
      m => m.to === this.name && m.type === MessageType.QUESTION
    );

    const messages = [];

    // First, answer any questions directed to us
    // Filter out already answered questions
    const unansweredQuestions = questionsToMe.filter(question => {
      return !conversationHistory.some(
        m => m.from === this.name &&
          m.type === MessageType.ANSWER &&
          m.metadata.inReplyTo === question.id
      );
    });

    // OPTIMIZATION: Process only top 3 most urgent/recent questions per round
    // This prevents bottleneck of answering 60+ questions sequentially
    const questionsToAnswer = unansweredQuestions
      .sort((a, b) => {
        // Prioritize by urgency, then by recency
        const urgencyOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
        const urgencyDiff = (urgencyOrder[a.metadata.urgency] || 3) - (urgencyOrder[b.metadata.urgency] || 3);
        if (urgencyDiff !== 0) return urgencyDiff;
        return b.metadata.timestamp - a.metadata.timestamp;
      })
      .slice(0, 2); // Limit to 2 questions per round (demo mode)

    console.log(`  📋 ${this.name}: Answering ${questionsToAnswer.length} of ${unansweredQuestions.length} pending questions`);

    // OPTIMIZATION: Answer questions in parallel instead of sequential
    const answerPromises = questionsToAnswer.map(question =>
      this.answerQuestion(question, conversationHistory).catch(error => {
        console.error(`  ❌ ${this.name}: Failed to answer question from ${question.from}:`, error);
        return null; // Return null on error, don't block other answers
      })
    );

    // Answer questions in parallel - messages sent immediately for real-time UI
    await Promise.all(answerPromises);

    // Then, analyze answers we received and decide next actions
    if (answersToMe.length >= myQuestions.length && myQuestions.length > 0) {
      const nextActions = await this.analyzeAnswers(answersToMe, conversationHistory);
      messages.push(...nextActions);
    }

    return messages;
  }

  /**
   * Answer a question from another agent
   */
  async answerQuestion(questionMessage, conversationHistory) {
    console.log(`  🤔 ${this.name}: Answering question from ${questionMessage.from}...`);

    // Emit thinking
    this.bus.emit('agent-thinking', {
      agent: this.name,
      action: 'answering question',
      timestamp: Date.now()
    });

    try {
      let prompt;
      try {
        prompt = await getPrompt('agent_answer', {
          agentName: this.name,
          question: questionMessage.content,
          asker: questionMessage.from,
          context: JSON.stringify(this.state.findings),
          history: JSON.stringify(conversationHistory.slice(-5))
        });
      } catch (error) {
        // Fallback inline prompt
        prompt = `You are ${this.name}. Another agent (${questionMessage.from}) asked: "${questionMessage.content}"

Your previous analysis:
${JSON.stringify(this.state.findings)}

Provide a direct answer and return valid JSON:
{
  "answer": "Your answer",
  "confidence": 85,
  "caveats": ["Any limitations"],
  "followUpQuestion": "Optional follow-up question if needed"
}

Return ONLY valid JSON.`;
      }

      const response = await this.callLLM(prompt);

      // Emit done thinking
      this.bus.emit('agent-done-thinking', {
        agent: this.name,
        timestamp: Date.now()
      });

      // Create answer message
      const answerMsg = new AnswerMessage(
        this.name,
        questionMessage.from,
        response.answer,
        {
          round: this.bus.round,
          confidence: response.confidence,
          inReplyTo: questionMessage.id,
          caveats: response.caveats
        }
      );

      console.log(`  ✅ ${this.name}: Answered with ${response.confidence}% confidence`);

      // Send answer immediately for real-time UI updates
      await this.bus.sendMessage(answerMsg);
      console.log(`  📤 ${this.name}: Answer sent immediately to ${questionMessage.from}`);

      return null; // Return null since message already sent
    } catch (error) {
      console.error(`  ❌ ${this.name}: Failed to answer:`, error);
      this.bus.emit('agent-done-thinking', { agent: this.name, timestamp: Date.now() });
      return null;
    }
  }

  /**
   * Analyze answers received and determine next actions
   */
  async analyzeAnswers(answers, conversationHistory) {
    console.log(`  🧠 ${this.name}: Analyzing ${answers.length} answer(s)...`);

    // Emit thinking
    this.bus.emit('agent-thinking', {
      agent: this.name,
      action: 'analyzing answers',
      timestamp: Date.now()
    });

    try {
      let prompt;
      try {
        prompt = await getPrompt('agent_analyze', {
          agentName: this.name,
          answers: JSON.stringify(answers),
          findings: JSON.stringify(this.state.findings),
          concerns: JSON.stringify(this.state.concerns)
        });
      } catch (error) {
        // Fallback inline prompt
        prompt = `You are ${this.name}. You received these answers:
${JSON.stringify(answers, null, 2)}

Your findings:
${JSON.stringify(this.state.findings)}

Your concerns:
${JSON.stringify(this.state.concerns)}

Analyze if answers resolve your concerns and determine next actions. Return valid JSON:
{
  "resolved": false,
  "analysis": "Summary of what you learned",
  "nextActions": [
    {
      "type": "resolve",
      "target": "self",
      "content": "All concerns addressed"
    }
  ]
}

Action types: "question", "challenge", "escalate", "broadcast", "resolve"
Escalation types: "POLICY_VIOLATION", "LOW_CONFIDENCE", "AGENT_DEADLOCK", "HIGH_VALUE"
Required roles: "CFO", "Manager", "Compliance Officer"

Return ONLY valid JSON.`;
      }

      const response = await this.callLLM(prompt);

      // Update state
      if (response.resolved) {
        this.state.resolved = true;
        console.log(`  ✅ ${this.name}: Resolved - no further action needed`);
      }

      // Emit done thinking
      this.bus.emit('agent-done-thinking', {
        agent: this.name,
        timestamp: Date.now()
      });

      // Generate messages based on next actions
      const messages = [];
      for (const action of response.nextActions || []) {
        const msg = await this.createMessageFromAction(action);
        if (msg) {
          messages.push(msg);
        }
      }

      return messages;
    } catch (error) {
      console.error(`  ❌ ${this.name}: Failed to analyze answers:`, error);
      this.bus.emit('agent-done-thinking', { agent: this.name, timestamp: Date.now() });
      return [];
    }
  }

  /**
   * Create message from action specification
   */
  async createMessageFromAction(action) {
    const round = this.bus.round;

    switch (action.type) {
      case 'question':
        return new QuestionMessage(this.name, action.target, action.content, { round });

      case 'challenge':
        return new AgentMessage(this.name, action.target, MessageType.CHALLENGE, action.content, { round });

      case 'broadcast':
        return new BroadcastMessage(this.name, action.content, { round });

      case 'escalate':
        return new EscalationMessage(
          this.name,
          action.content,
          action.escalationType || EscalationType.AGENT_DEADLOCK,
          action.requiresRole || 'Manager',
          {
            findings: this.state.findings,
            confidence: this.state.confidence,
            concerns: this.state.concerns
          },
          { round }
        );

      case 'resolve':
        this.state.resolved = true;
        return null; // No message needed

      default:
        console.warn(`Unknown action type: ${action.type}`);
        return null;
    }
  }

  /**
   * Receive message from another agent or human
   */
  async receiveMessage(message) {
    console.log(`  📨 ${this.name} received ${message.type} from ${message.from}`);

    // Store in received answers
    this.state.receivedAnswers.push(message);

    // Handle broadcast messages - adjust behavior
    if (message.type === MessageType.BROADCAST) {
      await this.handleBroadcast(message);
    }

    // Handle human responses (after HITL)
    if (message.from === 'HUMAN') {
      await this.handleHumanResponse(message);
    }
  }

  /**
   * Handle broadcast messages - adjust agent behavior
   */
  async handleBroadcast(message) {
    console.log(`  📢 ${this.name}: Processing broadcast from ${message.from}`);

    // Check for risk signals
    if (message.content.includes('HIGH_RISK') || message.content.includes('HIGH RISK')) {
      console.log(`  ⚠️  ${this.name}: Adjusting to enhanced scrutiny mode`);
      this.state.riskTolerance = 5; // Stricter threshold
    }

    // Check for tolerance updates
    if (message.metadata.tolerance) {
      this.state.riskTolerance = parseFloat(message.metadata.tolerance);
      console.log(`  📊 ${this.name}: Tolerance updated to ${this.state.riskTolerance}%`);
    }
  }

  /**
   * Handle human response after HITL escalation
   */
  async handleHumanResponse(message) {
    console.log(`  👤 ${this.name}: Processing human decision: ${message.metadata.decision}`);

    // Store human decision in state
    this.state.humanDecision = message.metadata.decision;
    this.state.humanData = message.metadata.data;

    // Mark as resolved based on human decision
    if (message.metadata.decision === 'APPROVE' || message.metadata.decision === 'REJECT') {
      this.state.resolved = true;
    }
  }

  /**
   * Call LLM with streaming support
   */
  async callLLM(prompt) {
    const { baseUrl, apiKey } = await openaiConfig();

    if (!baseUrl || !apiKey) {
      throw new Error("LLM not configured");
    }

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error(`Invalid prompt for ${this.name}:`, prompt);
      throw new Error("Invalid or empty prompt");
    }

    const modelInput = document.querySelector("#model");
    const temperatureInput = document.querySelector("#temperature");

    const body = {
      model: modelInput?.value || config.defaults?.model || "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true, // Enable streaming
    };

    const temperatureValue = parseFloat(temperatureInput?.value || 0.7);
    if (temperatureValue && temperatureValue !== 1) {
      body.temperature = temperatureValue;
    }

    try {
      let fullResponse = "";

      for await (
        const { content, error } of asyncLLM(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body),
        })
      ) {
        if (error) {
          console.error(`API error for ${this.name}:`, error);
          throw new Error(`API returned error: ${JSON.stringify(error)}`);
        }
        if (content) {
          fullResponse = content;

          // Emit streaming update for UI
          try {
            const partialParsed = parse(fullResponse);
            if (partialParsed && typeof partialParsed === 'object') {
              this.bus.emit('agent-streaming', {
                agent: this.name,
                partialResponse: partialParsed,
                rawContent: fullResponse,
                timestamp: Date.now()
              });
            }
          } catch (parseError) {
            // Partial parse failed, continue streaming
          }
        }
      }

      // Check if we got a response
      if (!fullResponse || fullResponse.trim() === '') {
        console.error(`Empty response from LLM for ${this.name}`);
        throw new Error("Empty response from LLM");
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(fullResponse);
        return parsed;
      } catch (e) {
        console.warn(`JSON parse failed for ${this.name}, trying partial-json:`, e.message);
        // If not JSON, try partial-json parser
        try {
          const parsed = parse(fullResponse);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        } catch (parseError) {
          console.error(`Partial JSON parse failed for ${this.name}:`, parseError);
        }

        // If all parsing fails, return a default structure
        console.error(`All parsing failed. Raw response:`, fullResponse.substring(0, 500));
        throw new Error(`Failed to parse LLM response as JSON: ${fullResponse.substring(0, 100)}`);
      }
    } catch (e) {
      console.error(`LLM call failed for ${this.name}:`, e);
      throw e;
    }
  }

  /**
   * Get agent state for debugging
   */
  getState() {
    return {
      name: this.name,
      ...this.state
    };
  }
}

export default AgenticAgent;

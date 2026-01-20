// Conversation Manager - Orchestrates multi-round agent conversations
import { MessageType, AgentMessage, QuestionMessage } from './agentProtocol.js';

/**
 * ConversationManager - Manages multi-round agent negotiations
 * This is the core of the agentic system that enables agents to:
 * - Talk to each other over multiple rounds
 * - Question, challenge, and verify
 * - Reach consensus or escalate
 */
export class ConversationManager {
  constructor(messageBus, agents, extractedData) {
    this.bus = messageBus;
    this.agents = agents;
    this.extractedData = extractedData;
    this.agentMap = new Map();

    // Register all agents
    for (const agent of agents) {
      this.agentMap.set(agent.name, agent);
    }
  }

  /**
   * Run the multi-round conversation
   * This is the main entry point that replaces sequential agent execution
   */
  async runConversation() {
    console.log('\n🎬 Starting Multi-Agent Conversation...\n');

    // Emit conversation start
    this.bus.emit('conversation-start', {
      agents: this.agents.map(a => a.name),
      timestamp: Date.now()
    });

    try {
      // Round 1: Parallel Initial Analysis
      this.bus.nextRound();
      await this.parallelAgentActivation();

      // Rounds 2-N: Iterative questioning and negotiation
      while (!this.bus.shouldEndConversation()) {
        this.bus.nextRound();

        // Check if we should inject new agents
        await this.checkAndInjectAgents();

        // Process conversation round
        await this.processConversationRound();

        // Small delay between rounds for UI visualization
        await this.sleep(500);
      }

      // Final synthesis
      const finalDecision = await this.synthesizeFinalDecision();

      // Emit conversation end
      this.bus.emit('conversation-complete', {
        rounds: this.bus.round,
        finalDecision,
        timestamp: Date.now()
      });

      return {
        conversationHistory: this.bus.getConversationHistory(),
        finalDecision,
        rounds: this.bus.round,
        analytics: this.bus.getAnalytics()
      };
    } catch (error) {
      console.error('❌ Conversation error:', error);
      this.bus.emit('conversation-error', {
        error: error.message,
        round: this.bus.round,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * Activate multiple agents in parallel
   * This is what makes the system truly multi-agentic
   */
  async parallelAgentActivation() {
    console.log(`⚡ Activating ${this.agents.length} agents in PARALLEL...\n`);

    // Emit parallel activation event
    this.bus.emit('parallel-activation', {
      agents: this.agents.map(a => a.name),
      round: this.bus.round,
      timestamp: Date.now()
    });

    // Start all agents simultaneously using Promise.all
    const activationPromises = this.agents.map(async (agent) => {
      try {
        // Emit agent activation
        this.bus.emit('agent-activating', {
          agent: agent.name,
          round: this.bus.round,
          timestamp: Date.now()
        });

        // Agent performs initial analysis
        await agent.initialAnalysis(this.extractedData, this.bus.round);

        // Emit agent activated
        this.bus.emit('agent-activated', {
          agent: agent.name,
          round: this.bus.round,
          timestamp: Date.now()
        });

        console.log(`✅ ${agent.name} completed initial analysis`);
      } catch (error) {
        console.error(`❌ ${agent.name} activation failed:`, error);
        this.bus.emit('agent-activation-failed', {
          agent: agent.name,
          error: error.message,
          timestamp: Date.now()
        });
      }
    });

    // Wait for all agents to complete
    await Promise.all(activationPromises);

    console.log(`\n✅ All ${this.agents.length} agents activated\n`);
  }

  /**
   * Process one conversation round
   * Agents analyze conversation history and generate new messages
   */
  async processConversationRound() {
    console.log(`\n📣 Processing Round ${this.bus.round}...\n`);

    // Collect pending messages from all agents
    const pendingMessages = [];

    for (const agent of this.agents) {
      try {
        // Agent generates questions/responses based on conversation history
        const messages = await agent.generateMessages(
          this.bus.getConversationHistory()
        );

        if (messages && messages.length > 0) {
          pendingMessages.push(...messages);
          console.log(`  ${agent.name}: Generated ${messages.length} message(s)`);
        }
      } catch (error) {
        console.error(`  ❌ ${agent.name} failed to generate messages:`, error);
      }
    }

    if (pendingMessages.length === 0) {
      console.log('  ℹ️  No new messages - conversation may be complete');
      return;
    }

    console.log(`\n  Sending ${pendingMessages.length} messages...\n`);

    // Send all messages with slight delays for visualization
    for (const msg of pendingMessages) {
      await this.bus.sendMessage(msg);
      await this.sleep(300); // Small delay for UI animations
    }
  }

  /**
   * Check if new agents should be injected mid-conversation
   * Dynamic routing based on conversation content
   */
  async checkAndInjectAgents() {
    // Get conversation history
    const messages = this.bus.getConversationHistory();

    // Detect if certain keywords trigger new agent needs
    const needsRisk = messages.some(m =>
      m.content.toLowerCase().includes('risk') ||
      m.content.toLowerCase().includes('compliance') ||
      m.content.toLowerCase().includes('variance')
    );

    const needsPayment = messages.some(m =>
      m.content.toLowerCase().includes('payment') ||
      m.content.toLowerCase().includes('approve')
    );

    // Check if we need to inject RiskGuard
    if (needsRisk && !this.agentMap.has('RiskGuardAgent')) {
      console.log('🔍 Injecting RiskGuard into conversation...');
      // Note: In full implementation, would create and add agent here
    }

    // Check if we need to inject PayFlow
    if (needsPayment && !this.agentMap.has('PayFlowAgent')) {
      console.log('💰 Injecting PayFlow into conversation...');
      // Note: In full implementation, would create and add agent here
    }
  }

  /**
   * Synthesize final decision from all agent inputs
   * This creates the final evaluation based on the conversation
   */
  async synthesizeFinalDecision() {
    console.log('\n📊 Synthesizing final decision...\n');

    const messages = this.bus.getConversationHistory();
    const analytics = this.bus.getAnalytics();

    // Count escalations
    const escalations = messages.filter(m => m.type === MessageType.ESCALATE_HUMAN);

    // Check for consensus indicators
    const answers = messages.filter(m => m.type === MessageType.ANSWER);
    const challenges = messages.filter(m => m.type === MessageType.CHALLENGE);

    // Determine if there's consensus or conflict
    const hasConflict = challenges.length > 2;
    const hasEscalations = escalations.length > 0;

    let decision = {
      conversationRounds: this.bus.round,
      totalMessages: analytics.totalMessages,
      activeAgents: this.agents.length,
      escalations: escalations.length,

      // Summary
      summary: hasEscalations
        ? `${escalations.length} agent(s) escalated to human after ${this.bus.round} rounds of negotiation`
        : hasConflict
          ? `Agents identified concerns after ${this.bus.round} rounds - human review recommended`
          : `Agents reached consensus after ${this.bus.round} rounds`,

      // Recommendations from escalations
      recommendations: escalations.map(e => ({
        from: e.from,
        escalationType: e.metadata.escalationType,
        requiresRole: e.metadata.requiresRole,
        content: e.content
      })),

      // Verdict
      verdict: hasEscalations ? 'ESCALATED_TO_HUMAN' : hasConflict ? 'REVIEW_REQUIRED' : 'APPROVED',

      // Confidence
      confidenceScore: analytics.avgConfidence || 70,

      // Conversation summary
      conversationSummary: {
        questions: analytics.byType.question || 0,
        answers: analytics.byType.answer || 0,
        challenges: analytics.byType.challenge || 0,
        broadcasts: analytics.byType.broadcast || 0
      }
    };

    return decision;
  }

  /**
   * Utility: Sleep for animations
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get conversation statistics
   */
  getStatistics() {
    const analytics = this.bus.getAnalytics();

    return {
      rounds: this.bus.round,
      messages: analytics.totalMessages,
      agents: this.agents.length,
      avgConfidence: analytics.avgConfidence,
      escalations: analytics.escalations,
      messagesByType: analytics.byType,
      messagesByRound: analytics.byRound
    };
  }
}

export default ConversationManager;

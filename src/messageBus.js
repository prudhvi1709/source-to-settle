// Message Bus - Central routing and event system for agent communication
import { MessageType, MessageValidator, ConversationAnalyzer } from './agentProtocol.js';

/**
 * EventEmitter - Simple event system for UI updates
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  once(event, listener) {
    const onceWrapper = (data) => {
      listener(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
}

/**
 * MessageBus - Central hub for all agent-to-agent communication
 * Emits UI events for every action so it's fully visible in real-time
 */
export class MessageBus extends EventEmitter {
  constructor(maxRounds = 3, maxQuestions = null) {
    super();
    this.messages = [];           // Full conversation history
    this.activeAgents = new Map(); // agent name → agent instance
    this.round = 0;               // Current conversation round
    this.maxRounds = maxRounds;   // Maximum rounds before forced termination (demo-optimized)
    this.maxQuestions = maxQuestions; // Maximum total questions allowed (null = unlimited)
    this.questionCount = 0;       // Track total questions asked
    this.paused = false;          // HITL pause flag
    this.pendingHITL = null;      // Current HITL escalation awaiting response
  }

  /**
   * Register an agent with the message bus
   */
  registerAgent(agentName, agentInstance) {
    console.log(`📝 Registering agent: ${agentName}`);
    this.activeAgents.set(agentName, agentInstance);

    // Emit UI event
    this.emit('agent-registered', {
      agentName,
      totalAgents: this.activeAgents.size,
      timestamp: Date.now()
    });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentName) {
    console.log(`📝 Unregistering agent: ${agentName}`);
    this.activeAgents.delete(agentName);

    // Emit UI event
    this.emit('agent-unregistered', {
      agentName,
      totalAgents: this.activeAgents.size,
      timestamp: Date.now()
    });
  }

  /**
   * Send a message from one agent to another (or broadcast)
   * This is the CORE function - every message goes through here
   */
  async sendMessage(message) {
    // Validate message
    const validation = MessageValidator.validate(message);
    if (!validation.valid) {
      console.error('Invalid message:', validation.errors);
      throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
    }

    // Check question limit (if set)
    if (this.maxQuestions !== null && message.type === 'question') {
      if (this.questionCount >= this.maxQuestions) {
        console.warn(`⚠️ Question limit reached (${this.maxQuestions}/${this.maxQuestions}). Ignoring question from ${message.from}`);
        return; // Silently ignore additional questions
      }
    }

    // If paused (HITL in progress), queue message
    if (this.paused && !message.isHITL()) {
      console.log(`⏸️ Message queued (HITL in progress): ${message.toString()}`);
      return;
    }

    // Track questions
    if (message.type === 'question') {
      this.questionCount++;
    }

    // Store message
    this.messages.push(message);

    // Console log
    console.log(`[Round ${this.round}] ${message.toString()}`);

    // Emit UI event - THIS MAKES IT VISIBLE IN REAL-TIME
    this.emit('message-sent', {
      message: message.toJSON(),
      timestamp: Date.now(),
      round: this.round
    });

    // Handle different message types
    if (message.isBroadcast()) {
      await this.handleBroadcast(message);
    } else if (message.isHITL()) {
      await this.handleHITL(message);
    } else {
      await this.routeMessage(message);
    }
  }

  /**
   * Route message to specific agent
   */
  async routeMessage(message) {
    const targetAgent = this.activeAgents.get(message.to);

    if (!targetAgent) {
      console.warn(`⚠️ Target agent not found: ${message.to}`);
      this.emit('message-failed', {
        message: message.toJSON(),
        reason: 'Agent not found',
        timestamp: Date.now()
      });
      return;
    }

    // Emit UI event - show message flying to target
    this.emit('message-routing', {
      from: message.from,
      to: message.to,
      type: message.type,
      duration: 1000  // Animation duration
    });

    // Deliver message to agent
    try {
      await targetAgent.receiveMessage(message);

      // Emit delivery confirmation
      this.emit('message-delivered', {
        messageId: message.id,
        to: message.to,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Error delivering message to ${message.to}:`, error);
      this.emit('message-failed', {
        message: message.toJSON(),
        reason: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle broadcast messages - send to all agents except sender
   */
  async handleBroadcast(message) {
    console.log(`📢 Broadcasting from ${message.from} to all agents`);

    // Emit UI event - show broadcast wave animation
    this.emit('broadcast-signal', {
      from: message.from,
      content: message.content,
      urgency: message.metadata.urgency,
      timestamp: Date.now()
    });

    // Send to all agents (with random delays to simulate propagation)
    const deliveries = [];
    for (const [agentName, agent] of this.activeAgents) {
      if (agentName === message.from) continue; // Don't send to self

      const delay = Math.random() * 500; // Random delay 0-500ms
      deliveries.push(
        new Promise(resolve => {
          setTimeout(async () => {
            try {
              await agent.receiveMessage(message);

              // Emit acknowledgment
              this.emit('broadcast-acknowledged', {
                agent: agentName,
                from: message.from,
                messageId: message.id,
                timestamp: Date.now()
              });

              resolve();
            } catch (error) {
              console.error(`Error broadcasting to ${agentName}:`, error);
              resolve(); // Don't fail entire broadcast if one fails
            }
          }, delay);
        })
      );
    }

    await Promise.all(deliveries);

    // Emit broadcast complete
    this.emit('broadcast-complete', {
      messageId: message.id,
      recipients: this.activeAgents.size - 1,
      timestamp: Date.now()
    });
  }

  /**
   * Handle Human-in-the-Loop escalation
   */
  async handleHITL(message) {
    console.log(`🚨 HITL Escalation from ${message.from}:`, message.content);

    // Pause agent conversation
    this.pause();

    // Store pending escalation
    this.pendingHITL = message;

    // Emit UI event - show HITL modal
    this.emit('hitl-escalation', {
      message: message.toJSON(),
      conversationHistory: this.getConversationHistory(),
      round: this.round,
      timestamp: Date.now()
    });

    // Note: Resume will be called when human responds via resolveHITL()
  }

  /**
   * Resolve HITL escalation with human decision
   * This is called from the UI when human makes a decision
   */
  async resolveHITL(escalationId, decision, data = {}) {
    if (!this.pendingHITL || this.pendingHITL.id !== escalationId) {
      console.warn('No matching HITL escalation to resolve');
      return;
    }

    console.log(`✅ HITL Resolved: ${decision}`);

    // Create human response message
    const humanResponse = {
      id: `msg_human_${Date.now()}`,
      from: 'HUMAN',
      to: this.pendingHITL.from,
      type: MessageType.ANSWER,
      content: `Decision: ${decision}`,
      metadata: {
        round: this.round,
        escalationId: escalationId,
        decision: decision,
        data: data,
        timestamp: new Date().toISOString(),
        resolutionTime: Date.now() - new Date(this.pendingHITL.metadata.timestamp).getTime()
      }
    };

    // Store human response
    this.messages.push(humanResponse);

    // Emit UI event
    this.emit('hitl-resolved', {
      escalationId,
      decision,
      data,
      resolutionTime: humanResponse.metadata.resolutionTime,
      timestamp: Date.now()
    });

    // Deliver decision to agent
    const targetAgent = this.activeAgents.get(this.pendingHITL.from);
    if (targetAgent && targetAgent.receiveMessage) {
      await targetAgent.receiveMessage(humanResponse);
    }

    // Clear pending HITL
    this.pendingHITL = null;

    // Resume agent conversation
    this.resume();
  }

  /**
   * Pause agent conversation (during HITL)
   */
  pause() {
    this.paused = true;
    console.log('⏸️ Conversation paused for HITL');
    this.emit('conversation-paused', { timestamp: Date.now() });
  }

  /**
   * Resume agent conversation (after HITL)
   */
  resume() {
    this.paused = false;
    console.log('▶️ Conversation resumed');
    this.emit('conversation-resumed', { timestamp: Date.now() });
  }

  /**
   * Get conversation history, optionally filtered by agent
   */
  getConversationHistory(filterByAgent = null) {
    if (filterByAgent) {
      return this.messages.filter(m =>
        m.from === filterByAgent ||
        m.to === filterByAgent ||
        (Array.isArray(m.to) && m.to.includes('all'))
      );
    }
    return this.messages;
  }

  /**
   * Get messages for current round
   */
  getCurrentRoundMessages() {
    return this.messages.filter(m => m.metadata.round === this.round);
  }

  /**
   * Check if conversation should end
   */
  shouldEndConversation() {
    // Max questions reached (if limit set)
    if (this.maxQuestions !== null && this.questionCount >= this.maxQuestions) {
      console.warn(`⚠️ Max questions (${this.maxQuestions}) reached - ending conversation`);
      this.emit('max-questions-reached', {
        questionCount: this.questionCount,
        maxQuestions: this.maxQuestions
      });
      return true;
    }

    // Max rounds reached
    if (this.round >= this.maxRounds) {
      console.warn(`⚠️ Max rounds (${this.maxRounds}) reached - ending conversation`);
      this.emit('max-rounds-reached', {
        round: this.round,
        maxRounds: this.maxRounds
      });
      return true;
    }

    // No messages in last round = consensus reached
    const lastRoundMessages = this.getCurrentRoundMessages();
    if (this.round > 2 && lastRoundMessages.length === 0) {
      console.log('✅ No new messages - consensus reached');
      this.emit('consensus-reached', {
        round: this.round
      });
      return true;
    }

    // All agents escalated to human
    const escalations = this.messages.filter(m => m.type === MessageType.ESCALATE_HUMAN);
    if (escalations.length >= this.activeAgents.size) {
      console.log('✅ All agents escalated - human intervention required');
      this.emit('all-escalated', {
        escalations: escalations.length
      });
      return true;
    }

    // Check for infinite loop
    if (ConversationAnalyzer.detectLoop(this.messages)) {
      console.warn('⚠️ Infinite loop detected - ending conversation');
      this.emit('loop-detected', {
        round: this.round
      });
      return true;
    }

    // Check for deadlock
    if (ConversationAnalyzer.detectDeadlock(this.messages, this.activeAgents, this.round)) {
      console.warn('⚠️ Deadlock detected - all agents waiting');
      this.emit('deadlock-detected', {
        round: this.round
      });
      // Don't end immediately - let orchestrator handle it
      return false;
    }

    return false;
  }

  /**
   * Start new conversation round
   */
  nextRound() {
    this.round++;
    console.log(`\n━━━━ Starting Round ${this.round} ━━━━\n`);

    // Emit UI event - update round progress bar
    this.emit('round-transition', {
      from: this.round - 1,
      to: this.round,
      activeAgents: this.activeAgents.size,
      messageCount: this.messages.filter(m => m.metadata.round === this.round - 1).length,
      timestamp: Date.now()
    });
  }

  /**
   * Get conversation analytics
   */
  getAnalytics() {
    const health = ConversationAnalyzer.getHealthMetrics(this.messages);

    return {
      ...health,
      activeAgents: this.activeAgents.size,
      currentRound: this.round,
      isPaused: this.paused,
      hasPendingHITL: this.pendingHITL !== null
    };
  }

  /**
   * Clear all state (for reset)
   */
  reset() {
    this.messages = [];
    this.round = 0;
    this.questionCount = 0;
    this.paused = false;
    this.pendingHITL = null;

    console.log('🔄 Message bus reset');
    this.emit('bus-reset', { timestamp: Date.now() });
  }

  /**
   * Get summary for display
   */
  getSummary() {
    const analytics = this.getAnalytics();

    return {
      totalMessages: analytics.totalMessages,
      rounds: analytics.rounds,
      activeAgents: analytics.activeAgents,
      escalations: analytics.escalations,
      broadcasts: analytics.broadcasts,
      avgConfidence: analytics.avgConfidence
        ? `${Math.round(analytics.avgConfidence)}%`
        : 'N/A',
      status: this.paused ? 'PAUSED (HITL)' : 'ACTIVE'
    };
  }
}

/**
 * Create singleton instance
 */
let messageBusInstance = null;

export function getMessageBus() {
  if (!messageBusInstance) {
    messageBusInstance = new MessageBus();
  }
  return messageBusInstance;
}

export function resetMessageBus(maxRounds = 3, maxQuestions = null) {
  if (messageBusInstance) {
    messageBusInstance.reset();
  }
  messageBusInstance = new MessageBus(maxRounds, maxQuestions);
  return messageBusInstance;
}

export default MessageBus;

// Agent Communication Protocol
// Defines message types and schemas for agent-to-agent communication

/**
 * Message Types for agent communication
 */
export const MessageType = {
  QUESTION: 'question',           // Agent asks another agent a question
  ANSWER: 'answer',               // Agent responds to a question
  CHALLENGE: 'challenge',         // Agent challenges another's data/decision
  BROADCAST: 'broadcast',         // Agent sends message to all agents
  REQUEST_DATA: 'request_data',   // Agent requests specific data
  ESCALATE_HUMAN: 'escalate_human', // Agent escalates to human
  POLICY_UPDATE: 'policy_update', // Agent updates policy (e.g., RiskGuard sets tolerance)
  CONFIDENCE: 'confidence',       // Agent expresses confidence level
  INTERNAL: 'internal'            // Internal agent state (for logging)
};

/**
 * Escalation Types for HITL
 */
export const EscalationType = {
  POLICY_VIOLATION: 'POLICY_VIOLATION',   // Exceeds policy thresholds
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',       // Agent confidence too low
  AGENT_DEADLOCK: 'AGENT_DEADLOCK',       // Agents can't reach consensus
  HIGH_VALUE: 'HIGH_VALUE',               // High-value transaction
  MISSING_DATA: 'MISSING_DATA',           // Critical data missing
  COMPLIANCE_ISSUE: 'COMPLIANCE_ISSUE'    // Regulatory/compliance concern
};

/**
 * Generate unique message ID
 */
function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * AgentMessage - Base class for all inter-agent messages
 */
export class AgentMessage {
  constructor(from, to, type, content, metadata = {}) {
    this.id = generateId();
    this.from = from;              // Sender agent name (e.g., 'InvoiceIQ')
    this.to = to;                  // Recipient(s): agent name or ['all'] for broadcast
    this.type = type;              // MessageType enum
    this.content = content;        // Message content (string or object)
    this.metadata = {
      round: metadata.round || 1,
      confidence: metadata.confidence,  // 0-100
      urgency: metadata.urgency,        // 'low', 'medium', 'high'
      timestamp: new Date().toISOString(),
      inReplyTo: metadata.inReplyTo,    // ID of message this replies to
      ...metadata
    };
  }

  /**
   * Check if this is a broadcast message
   */
  isBroadcast() {
    return Array.isArray(this.to) && this.to.includes('all');
  }

  /**
   * Check if this is an escalation to human
   */
  isHITL() {
    return this.type === MessageType.ESCALATE_HUMAN;
  }

  /**
   * Get message age in milliseconds
   */
  getAge() {
    return Date.now() - new Date(this.metadata.timestamp).getTime();
  }

  /**
   * Serialize for logging
   */
  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      content: this.content,
      metadata: this.metadata
    };
  }

  /**
   * Format for console logging
   */
  toString() {
    const target = Array.isArray(this.to) ? this.to.join(',') : this.to;
    return `[${this.type.toUpperCase()}] ${this.from} → ${target}: ${this.content}`;
  }
}

/**
 * QuestionMessage - Specialized message for questions
 */
export class QuestionMessage extends AgentMessage {
  constructor(from, to, question, metadata = {}) {
    super(from, to, MessageType.QUESTION, question, metadata);
  }
}

/**
 * AnswerMessage - Specialized message for answers
 */
export class AnswerMessage extends AgentMessage {
  constructor(from, to, answer, metadata = {}) {
    super(from, to, MessageType.ANSWER, answer, metadata);
  }
}

/**
 * BroadcastMessage - Specialized message for broadcasts
 */
export class BroadcastMessage extends AgentMessage {
  constructor(from, content, metadata = {}) {
    super(from, ['all'], MessageType.BROADCAST, content, {
      urgency: 'high',
      ...metadata
    });
  }
}

/**
 * EscalationMessage - Specialized message for HITL escalations
 */
export class EscalationMessage extends AgentMessage {
  constructor(from, content, escalationType, requiresRole, context = {}, metadata = {}) {
    super(from, 'human', MessageType.ESCALATE_HUMAN, content, {
      escalationType,
      requiresRole,
      context,
      urgency: metadata.urgency || 'high',
      ...metadata
    });
  }
}

/**
 * MessageValidator - Validate message structure
 */
export class MessageValidator {
  static validate(message) {
    const errors = [];

    if (!message.id) errors.push('Message ID is required');
    if (!message.from) errors.push('Sender (from) is required');
    if (!message.to) errors.push('Recipient (to) is required');
    if (!message.type) errors.push('Message type is required');
    if (!Object.values(MessageType).includes(message.type)) {
      errors.push(`Invalid message type: ${message.type}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateEscalation(message) {
    const errors = [];

    if (message.type !== MessageType.ESCALATE_HUMAN) {
      errors.push('Not an escalation message');
    }

    if (!message.metadata.escalationType) {
      errors.push('Escalation type is required');
    }

    if (!message.metadata.requiresRole) {
      errors.push('Required role is required for HITL');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * ConversationAnalyzer - Analyze conversation patterns
 */
export class ConversationAnalyzer {
  /**
   * Detect if there's a loop in recent messages
   */
  static detectLoop(messages, lookback = 6) {
    if (messages.length < lookback) return false;

    const recent = messages.slice(-lookback);
    const questions = recent.filter(m => m.type === MessageType.QUESTION);

    if (questions.length < 4) return false;

    // Check for repeated question content
    const questionTexts = questions.map(q => q.content.toLowerCase().trim());
    const uniqueQuestions = new Set(questionTexts);

    // If we have 4+ questions but only 2 unique ones, it's likely a loop
    return questionTexts.length >= 4 && uniqueQuestions.size <= 2;
  }

  /**
   * Detect if agents are in deadlock
   */
  static detectDeadlock(messages, activeAgents, currentRound) {
    const roundMessages = messages.filter(m => m.metadata.round === currentRound);

    if (roundMessages.length === 0) return false;

    // All messages are questions = deadlock
    const allQuestions = roundMessages.every(m => m.type === MessageType.QUESTION);

    // All active agents sent messages but all are questions
    return allQuestions && roundMessages.length >= activeAgents.length;
  }

  /**
   * Calculate conversation health metrics
   */
  static getHealthMetrics(messages) {
    const totalMessages = messages.length;
    const byType = {};
    const byRound = {};
    const avgConfidence = [];

    for (const msg of messages) {
      // Count by type
      byType[msg.type] = (byType[msg.type] || 0) + 1;

      // Count by round
      const round = msg.metadata.round;
      byRound[round] = (byRound[round] || 0) + 1;

      // Collect confidence scores
      if (msg.metadata.confidence) {
        avgConfidence.push(msg.metadata.confidence);
      }
    }

    return {
      totalMessages,
      byType,
      byRound,
      avgConfidence: avgConfidence.length > 0
        ? avgConfidence.reduce((a, b) => a + b, 0) / avgConfidence.length
        : null,
      escalations: byType[MessageType.ESCALATE_HUMAN] || 0,
      broadcasts: byType[MessageType.BROADCAST] || 0,
      rounds: Object.keys(byRound).length
    };
  }
}

/**
 * Export all message utilities
 */
export default {
  MessageType,
  EscalationType,
  AgentMessage,
  QuestionMessage,
  AnswerMessage,
  BroadcastMessage,
  EscalationMessage,
  MessageValidator,
  ConversationAnalyzer
};

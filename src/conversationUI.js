// Conversation UI - Real-time visualization of agent conversations
import { html, render } from 'lit-html';
import { MessageType } from './agentProtocol.js';

/**
 * Agent icons mapping
 */
const AGENT_ICONS = {
  'VendorIntakeAgent': '🏢',
  'InvoiceIQAgent': '📄',
  'ContractCraftAgent': '📋',
  'RiskGuardAgent': '🛡️',
  'PayFlowAgent': '💰',
  'Supplier360Agent': '📊',
  'orchestrator': '🎯',
  'HUMAN': '👤'
};

/**
 * Message type colors for badges
 */
const MESSAGE_TYPE_COLORS = {
  'question': 'primary',
  'answer': 'success',
  'challenge': 'warning',
  'broadcast': 'danger',
  'escalate_human': 'dark',
  'policy_update': 'info',
  'confidence': 'secondary'
};

/**
 * ConversationUI - Manages the conversation feed display
 */
export class ConversationUI {
  constructor(messageBus) {
    this.bus = messageBus;
    this.conversationSection = document.querySelector('#conversation-section');
    this.conversationFeed = document.querySelector('#conversation-feed');
    this.roundProgressBar = document.querySelector('#round-progress-bar');
    this.roundProgressText = document.querySelector('#round-progress-text');
    this.conversationStatus = document.querySelector('#conversation-status');

    // Stats elements
    this.statRounds = document.querySelector('#stat-rounds');
    this.statMessages = document.querySelector('#stat-messages');
    this.statEscalations = document.querySelector('#stat-escalations');

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup message bus event listeners
   */
  setupEventListeners() {
    // Conversation lifecycle
    this.bus.on('conversation-start', () => this.onConversationStart());
    this.bus.on('conversation-complete', (data) => this.onConversationComplete(data));
    this.bus.on('conversation-paused', () => this.onConversationPaused());
    this.bus.on('conversation-resumed', () => this.onConversationResumed());

    // Round transitions
    this.bus.on('round-transition', (data) => this.onRoundTransition(data));

    // Messages
    this.bus.on('message-sent', (data) => this.onMessageSent(data));

    // Agent states
    this.bus.on('agent-thinking', (data) => this.onAgentThinking(data));
    this.bus.on('agent-done-thinking', (data) => this.onAgentDoneThinking(data));

    // Broadcasts
    this.bus.on('broadcast-signal', (data) => this.onBroadcastSignal(data));
    this.bus.on('broadcast-acknowledged', (data) => this.onBroadcastAcknowledged(data));
  }

  /**
   * Show conversation section
   */
  show() {
    if (this.conversationSection) {
      this.conversationSection.classList.remove('d-none');

      // Scroll to conversation section
      setTimeout(() => {
        this.conversationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  /**
   * Hide conversation section
   */
  hide() {
    if (this.conversationSection) {
      this.conversationSection.classList.add('d-none');
    }
  }

  /**
   * Clear conversation feed
   */
  clear() {
    if (this.conversationFeed) {
      this.conversationFeed.innerHTML = '';
    }
    this.updateStats(0, 0, 0);
  }

  /**
   * Update statistics
   */
  updateStats(rounds, messages, escalations) {
    if (this.statRounds) this.statRounds.textContent = rounds;
    if (this.statMessages) this.statMessages.textContent = messages;
    if (this.statEscalations) this.statEscalations.textContent = escalations;
  }

  /**
   * Event: Conversation started
   */
  onConversationStart() {
    console.log('📺 UI: Conversation started');
    this.show();
    this.clear();
    if (this.conversationStatus) {
      this.conversationStatus.textContent = 'ACTIVE';
      this.conversationStatus.className = 'small text-success';
    }
  }

  /**
   * Event: Conversation complete
   */
  onConversationComplete(data) {
    console.log('📺 UI: Conversation complete', data);
    if (this.conversationStatus) {
      this.conversationStatus.textContent = 'COMPLETE';
      this.conversationStatus.className = 'small text-success';
    }

    // Update final stats
    const analytics = this.bus.getAnalytics();
    this.updateStats(analytics.currentRound, analytics.totalMessages, analytics.escalations);
  }

  /**
   * Event: Conversation paused (HITL)
   */
  onConversationPaused() {
    console.log('📺 UI: Conversation paused');
    if (this.conversationStatus) {
      this.conversationStatus.textContent = 'PAUSED (HITL)';
      this.conversationStatus.className = 'small text-warning';
    }
  }

  /**
   * Event: Conversation resumed
   */
  onConversationResumed() {
    console.log('📺 UI: Conversation resumed');
    if (this.conversationStatus) {
      this.conversationStatus.textContent = 'ACTIVE';
      this.conversationStatus.className = 'small text-success';
    }
  }

  /**
   * Event: Round transition
   */
  onRoundTransition(data) {
    console.log('📺 UI: Round transition', data);

    // Update progress bar
    if (this.roundProgressBar) {
      const percentage = (data.to / 3) * 100; // Max 3 rounds for demo
      this.roundProgressBar.style.width = `${percentage}%`;
    }

    // Update progress text
    if (this.roundProgressText) {
      this.roundProgressText.textContent = `Round ${data.to} of 3 - ${data.activeAgents} agents active`;
    }

    // Add round divider to feed
    this.addRoundDivider(data.to, data.activeAgents, data.messageCount);

    // Update stats
    const analytics = this.bus.getAnalytics();
    this.updateStats(data.to, analytics.totalMessages, analytics.escalations);
  }

  /**
   * Add round divider to conversation feed
   */
  addRoundDivider(round, activeAgents, messageCount) {
    if (!this.conversationFeed) return;

    const divider = document.createElement('div');
    divider.className = 'round-divider';
    divider.innerHTML = `
      <hr>
      <div class="round-badge">
        <i class="bi bi-circle-fill text-primary"></i>
        Round ${round} Starting - ${activeAgents} agents active
        ${messageCount > 0 ? `<span class="badge bg-secondary ms-2">${messageCount} messages in previous round</span>` : ''}
      </div>
      <hr>
    `;

    this.conversationFeed.appendChild(divider);
    this.scrollToBottom();
  }

  /**
   * Event: Message sent
   */
  onMessageSent(data) {
    console.log('📺 UI: Message sent', data);

    const messageCard = this.createMessageCard(data.message);
    if (this.conversationFeed && messageCard) {
      this.conversationFeed.appendChild(messageCard);

      // Trigger animation
      setTimeout(() => {
        messageCard.classList.add('animate-in');
      }, 10);

      this.scrollToBottom();
    }

    // Update stats
    const analytics = this.bus.getAnalytics();
    this.updateStats(analytics.currentRound, analytics.totalMessages, analytics.escalations);
  }

  /**
   * Create message card element
   */
  createMessageCard(message) {
    const card = document.createElement('div');
    card.className = `message-card message-${message.type}`;
    card.dataset.messageId = message.id;

    const fromIcon = AGENT_ICONS[message.from] || '🤖';
    const toIcon = Array.isArray(message.to) && message.to.includes('all')
      ? '📢'
      : AGENT_ICONS[message.to] || '🤖';
    const typeColor = MESSAGE_TYPE_COLORS[message.type] || 'secondary';

    // Format timestamp
    const timestamp = new Date(message.metadata.timestamp).toLocaleTimeString();

    // Build HTML
    card.innerHTML = `
      <div class="message-header">
        <span class="agent-icon">${fromIcon}</span>
        <strong>${message.from}</strong>
        <i class="bi bi-arrow-right mx-2"></i>
        <span class="agent-icon">${toIcon}</span>
        <strong>${Array.isArray(message.to) ? message.to.join(', ') : message.to}</strong>
        <span class="badge bg-${typeColor} ms-2">${message.type.toUpperCase()}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${this.escapeHtml(message.content)}</div>
      ${message.metadata.confidence ? `
        <div class="message-footer">
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${message.metadata.confidence}%"></div>
          </div>
          <span class="confidence-label">Confidence: ${message.metadata.confidence}%</span>
        </div>
      ` : ''}
      ${message.metadata.urgency ? `
        <div class="message-footer">
          <span class="badge bg-${message.metadata.urgency === 'high' ? 'danger' : message.metadata.urgency === 'medium' ? 'warning' : 'info'}">
            ${message.metadata.urgency.toUpperCase()} URGENCY
          </span>
        </div>
      ` : ''}
    `;

    return card;
  }

  /**
   * Event: Agent thinking
   */
  onAgentThinking(data) {
    console.log('📺 UI: Agent thinking', data);

    if (!this.conversationFeed) return;

    // Create typing indicator
    const indicator = document.createElement('div');
    indicator.id = `typing-${data.agent}`;
    indicator.className = 'typing-indicator';

    const agentIcon = AGENT_ICONS[data.agent] || '🤖';

    indicator.innerHTML = `
      <div class="typing-dots">
        <span class="agent-icon">${agentIcon}</span>
        <strong>${data.agent}</strong> is ${data.action}
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;

    this.conversationFeed.appendChild(indicator);
    this.scrollToBottom();
  }

  /**
   * Event: Agent done thinking
   */
  onAgentDoneThinking(data) {
    console.log('📺 UI: Agent done thinking', data);

    const indicator = document.getElementById(`typing-${data.agent}`);
    if (indicator) {
      indicator.classList.add('fade-out');
      setTimeout(() => indicator.remove(), 300);
    }
  }

  /**
   * Event: Broadcast signal
   */
  onBroadcastSignal(data) {
    console.log('📺 UI: Broadcast signal', data);

    if (!this.conversationFeed) return;

    // Create special broadcast card
    const card = document.createElement('div');
    card.className = 'message-card message-broadcast animate-in';

    const fromIcon = AGENT_ICONS[data.from] || '🤖';
    const timestamp = new Date().toLocaleTimeString();

    card.innerHTML = `
      <div class="message-header">
        <span class="agent-icon">${fromIcon}</span>
        <strong>${data.from}</strong>
        <i class="bi bi-megaphone-fill mx-2"></i>
        <strong>ALL AGENTS</strong>
        <span class="badge bg-danger ms-2">BROADCAST</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="message-content">
        <strong>🚨 ${this.escapeHtml(data.content)}</strong>
      </div>
      <div class="message-footer">
        <span class="badge bg-${data.urgency === 'high' ? 'danger' : 'warning'}">
          ${data.urgency.toUpperCase()} URGENCY
        </span>
        <span class="small text-muted">Sent to: ALL AGENTS</span>
      </div>
      <div id="broadcast-acks-${Date.now()}" class="mt-2 small text-muted"></div>
    `;

    this.conversationFeed.appendChild(card);
    this.scrollToBottom();
  }

  /**
   * Event: Broadcast acknowledged
   */
  onBroadcastAcknowledged(data) {
    console.log('📺 UI: Broadcast acknowledged', data);
    // Could add visual feedback here if needed
  }

  /**
   * Scroll conversation feed to bottom
   */
  scrollToBottom() {
    if (this.conversationFeed) {
      this.conversationFeed.scrollTop = this.conversationFeed.scrollHeight;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get conversation HTML for export/display
   */
  getConversationHTML() {
    return this.conversationFeed ? this.conversationFeed.innerHTML : '';
  }
}

export default ConversationUI;

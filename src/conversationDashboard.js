// Executive Conversation Dashboard - Clean UI for client demos
import { html, render } from 'lit-html';
import { MessageType } from './agentProtocol.js';

const AGENT_ICONS = {
  'VendorIntakeAgent': '🏢',
  'InvoiceIQAgent': '📄',
  'ContractCraftAgent': '📋',
  'RiskGuardAgent': '🛡️',
  'PayFlowAgent': '💰',
  'Supplier360Agent': '📊'
};

const AGENT_COLORS = {
  'VendorIntakeAgent': '#6366f1',
  'InvoiceIQAgent': '#8b5cf6',
  'ContractCraftAgent': '#ec4899',
  'RiskGuardAgent': '#ef4444',
  'PayFlowAgent': '#10b981',
  'Supplier360Agent': '#3b82f6'
};

/**
 * Executive Conversation Dashboard
 * Shows only key insights and important messages
 */
export class ConversationDashboard {
  constructor(messageBus) {
    this.bus = messageBus;
    this.startTime = Date.now();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.bus.on('conversation-start', () => this.onStart());
    this.bus.on('message-sent', (data) => this.onMessage(data));
    this.bus.on('round-transition', (data) => this.onRoundChange(data));
    this.bus.on('conversation-complete', (data) => this.onComplete(data));
    this.bus.on('hitl-escalation', (data) => this.onEscalation(data));
    this.bus.on('agent-streaming', (data) => this.onAgentStreaming(data));
  }

  onStart() {
    console.log('📊 Dashboard: Conversation started, rendering dashboard');
    this.startTime = Date.now();
    this.renderDashboard();
    // Initialize header stats
    this.updateHeaderStats(this.bus.getAnalytics());
  }

  onMessage(data) {
    const message = data.message;
    console.log(`📊 Dashboard: Received message ${message.type} from ${message.from}`);

    // Show important messages - including ANSWERS to show agents actively working
    const importantTypes = [
      MessageType.QUESTION,
      MessageType.ANSWER,      // Added: Show answers so UI reflects agent activity
      MessageType.CHALLENGE,
      MessageType.BROADCAST,
      MessageType.ESCALATE_HUMAN
    ];

    if (importantTypes.includes(message.type)) {
      console.log(`📊 Dashboard: Adding important message to activity stream`);
      this.addActivityItem(message);
    } else {
      console.log(`📊 Dashboard: Filtered out ${message.type} message (not important type)`);
    }

    this.updateMetrics();
    this.updateAgentCards();
  }

  onRoundChange(data) {
    console.log(`📊 Dashboard: Round change to ${data.to}`);
    this.updateMetrics();
    this.updateHeaderStats(this.bus.getAnalytics());
    this.addRoundDivider(data.to);
  }

  onComplete(data) {
    this.updateMetrics();
    this.updateHeaderStats(this.bus.getAnalytics());
    const elapsed = Date.now() - this.startTime;
    this.showCompletionBanner(data.rounds, elapsed);
  }

  onEscalation(data) {
    this.addEscalationCard(data);
    // Update header stats to reflect new escalation count
    this.updateHeaderStats(this.bus.getAnalytics());
  }

  onAgentStreaming(data) {
    // Update agent card with streaming indicator
    const agentCard = document.querySelector(`[data-agent="${data.agent}"]`);
    if (agentCard) {
      const badge = agentCard.querySelector('.agent-status-badge span');
      const pulse = agentCard.querySelector('.agent-pulse-indicator');
      if (badge) {
        badge.textContent = 'Thinking...';
        badge.className = 'badge bg-info badge-sm';
      }
      if (pulse) pulse.style.display = 'block';
    }
  }

  renderDashboard() {
    const container = document.querySelector('#conversation-feed');
    if (!container) {
      console.error('❌ Dashboard: #conversation-feed not found! Cannot render dashboard.');
      return;
    }
    console.log('📊 Dashboard: Rendering dashboard structure');

    container.innerHTML = '';

    // Render metrics cards
    const metricsRow = document.createElement('div');
    metricsRow.className = 'row g-3 mb-4';
    metricsRow.id = 'dashboard-metrics';
    container.appendChild(metricsRow);

    this.renderMetrics();

    // Render agent status cards
    const agentsRow = document.createElement('div');
    agentsRow.className = 'row g-3 mb-4';
    agentsRow.id = 'agent-cards';
    container.appendChild(agentsRow);

    this.renderAgentCards();

    // Activity stream header
    const activityHeader = document.createElement('div');
    activityHeader.className = 'd-flex justify-content-between align-items-center mb-3';
    activityHeader.innerHTML = `
      <h6 class="mb-0"><i class="bi bi-activity me-2"></i>Key Activity Stream</h6>
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-outline-primary active" data-filter="all">All</button>
        <button type="button" class="btn btn-outline-primary" data-filter="question">Questions</button>
        <button type="button" class="btn btn-outline-warning" data-filter="challenge">Challenges</button>
        <button type="button" class="btn btn-outline-danger" data-filter="broadcast">Broadcasts</button>
      </div>
    `;
    container.appendChild(activityHeader);

    // Activity stream
    const activityStream = document.createElement('div');
    activityStream.id = 'activity-stream';
    activityStream.className = 'activity-stream';
    container.appendChild(activityStream);
  }

  renderMetrics() {
    const analytics = this.bus.getAnalytics();
    const elapsed = Date.now() - this.startTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);

    // Update header stats
    this.updateHeaderStats(analytics);

    const metricsContainer = document.querySelector('#dashboard-metrics');
    if (!metricsContainer) {
      console.warn('⚠️ Dashboard: #dashboard-metrics not found');
      return;
    }
    console.log(`📊 Dashboard: Updating metrics - Round ${analytics.currentRound}, Messages ${analytics.totalMessages}`);

    // Check if question limit is set
    const questionCount = this.bus.questionCount || 0;
    const maxQuestions = this.bus.maxQuestions;
    const questionSubtext = maxQuestions
      ? `${questionCount} of ${maxQuestions} questions asked`
      : `${questionCount} questions asked`;

    const metrics = [
      {
        icon: 'bi-question-circle',
        label: 'Questions Asked',
        value: questionCount,
        color: maxQuestions && questionCount >= maxQuestions ? 'danger' : 'primary',
        subtext: questionSubtext
      },
      {
        icon: 'bi-arrow-repeat',
        label: 'Conversation Rounds',
        value: analytics.currentRound || 0,
        color: 'info',
        subtext: `Max: ${this.bus.maxRounds} rounds`
      },
      {
        icon: 'bi-people',
        label: 'Active Agents',
        value: analytics.activeAgents || 0,
        color: 'success',
        subtext: 'Working in parallel'
      },
      {
        icon: 'bi-clock',
        label: 'Time Elapsed',
        value: `${elapsedSeconds}s`,
        color: 'warning',
        subtext: 'Real-time processing'
      },
      {
        icon: 'bi-exclamation-triangle',
        label: 'Escalations',
        value: analytics.escalations || 0,
        color: 'danger',
        subtext: analytics.escalations > 0 ? 'Human review needed' : 'No issues'
      },
      {
        icon: 'bi-percent',
        label: 'Avg Confidence',
        value: analytics.avgConfidence ? `${Math.round(analytics.avgConfidence)}%` : 'N/A',
        color: 'secondary',
        subtext: 'Agent certainty level'
      }
    ];

    metricsContainer.innerHTML = metrics.map(metric => `
      <div class="col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100 metric-card">
          <div class="card-body text-center">
            <i class="bi ${metric.icon} fs-2 text-${metric.color} mb-2"></i>
            <h3 class="mb-0 fw-bold">${metric.value}</h3>
            <p class="text-muted small mb-1">${metric.label}</p>
            <p class="text-muted" style="font-size: 0.7rem; margin-bottom: 0;">${metric.subtext}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderAgentCards() {
    const agentsContainer = document.querySelector('#agent-cards');
    if (!agentsContainer) return;

    const agents = Array.from(this.bus.activeAgents.keys());

    agentsContainer.innerHTML = agents.map(agentName => {
      const icon = AGENT_ICONS[agentName] || '🤖';
      const color = AGENT_COLORS[agentName] || '#6b7280';

      return `
        <div class="col-md-6 col-lg-4 col-xl-2">
          <div class="card border-0 shadow-sm agent-status-card" data-agent="${agentName}">
            <div class="card-body text-center p-3">
              <div class="agent-icon-large mb-2" style="font-size: 2.5rem;">${icon}</div>
              <h6 class="mb-1 small">${agentName.replace('Agent', '')}</h6>
              <div class="agent-status-badge">
                <span class="badge bg-secondary badge-sm">Idle</span>
              </div>
              <div class="agent-pulse-indicator mt-2" style="display: none;">
                <div class="pulse-dot" style="background: ${color};"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateMetrics() {
    this.renderMetrics();
  }

  updateAgentCards() {
    // Update agent activity status
    const recentMessages = this.bus.messages.slice(-10);

    // Reset all to idle
    document.querySelectorAll('.agent-status-card').forEach(card => {
      const badge = card.querySelector('.agent-status-badge span');
      const pulse = card.querySelector('.agent-pulse-indicator');
      if (badge) badge.textContent = 'Idle';
      if (badge) badge.className = 'badge bg-secondary badge-sm';
      if (pulse) pulse.style.display = 'none';
    });

    // Mark active agents
    recentMessages.forEach(msg => {
      const senderCard = document.querySelector(`[data-agent="${msg.from}"]`);
      if (senderCard) {
        const badge = senderCard.querySelector('.agent-status-badge span');
        const pulse = senderCard.querySelector('.agent-pulse-indicator');
        if (badge) {
          badge.textContent = 'Active';
          badge.className = 'badge bg-success badge-sm';
        }
        if (pulse) pulse.style.display = 'block';
      }
    });
  }

  updateHeaderStats(analytics) {
    // Update conversation header stats
    const statRounds = document.querySelector('#stat-rounds');
    const statMessages = document.querySelector('#stat-messages');
    const statEscalations = document.querySelector('#stat-escalations');

    if (statRounds) {
      statRounds.textContent = analytics.currentRound || 0;
    }
    if (statMessages) {
      statMessages.textContent = analytics.totalMessages || 0;
    }
    if (statEscalations) {
      statEscalations.textContent = analytics.escalations || 0;
    }
  }

  addActivityItem(message) {
    const stream = document.querySelector('#activity-stream');
    if (!stream) return;

    const fromIcon = AGENT_ICONS[message.from] || '🤖';
    const toIcon = Array.isArray(message.to) && message.to.includes('all')
      ? '📢'
      : AGENT_ICONS[message.to] || '🤖';

    const typeIcons = {
      'question': '❓',
      'answer': '✅',
      'challenge': '⚡',
      'broadcast': '📢',
      'escalate_human': '🚨'
    };

    const typeColors = {
      'question': 'primary',
      'answer': 'success',
      'challenge': 'warning',
      'broadcast': 'danger',
      'escalate_human': 'dark'
    };

    const icon = typeIcons[message.type] || '💬';
    const color = typeColors[message.type] || 'secondary';

    const item = document.createElement('div');
    item.className = `activity-item activity-${message.type} animate-slide-in`;
    item.innerHTML = `
      <div class="d-flex align-items-start gap-3 p-3 bg-white rounded shadow-sm mb-2">
        <div class="activity-icon">
          <div class="icon-badge bg-${color} text-white rounded-circle d-flex align-items-center justify-content-center"
               style="width: 40px; height: 40px; font-size: 1.2rem;">
            ${icon}
          </div>
        </div>
        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span style="font-size: 1.2rem;">${fromIcon}</span>
            <strong class="small">${message.from.replace('Agent', '')}</strong>
            <i class="bi bi-arrow-right text-muted"></i>
            <span style="font-size: 1.2rem;">${toIcon}</span>
            <strong class="small">${Array.isArray(message.to) ? 'ALL' : message.to.replace('Agent', '')}</strong>
            <span class="badge bg-${color} ms-auto">${message.type.toUpperCase()}</span>
          </div>
          <p class="mb-0 text-muted small message-content"
             data-bs-toggle="tooltip"
             data-bs-placement="top"
             title="${this.escapeHtml(message.content)}"
             style="cursor: help;">
            ${this.truncate(message.content, 150)}
          </p>
          ${message.metadata.confidence ? `
            <div class="mt-2">
              <div class="progress" style="height: 4px;">
                <div class="progress-bar bg-${color}" style="width: ${message.metadata.confidence}%"></div>
              </div>
              <small class="text-muted">Confidence: ${message.metadata.confidence}%</small>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    stream.appendChild(item);

    // Initialize Bootstrap tooltip for the message content
    const tooltip = item.querySelector('[data-bs-toggle="tooltip"]');
    if (tooltip && typeof bootstrap !== 'undefined') {
      new bootstrap.Tooltip(tooltip);
    }

    stream.scrollTop = stream.scrollHeight;
  }

  addRoundDivider(round) {
    const stream = document.querySelector('#activity-stream');
    if (!stream) {
      console.warn(`⚠️ Dashboard: #activity-stream not found, cannot add round ${round} divider`);
      return;
    }
    console.log(`📊 Dashboard: Adding round ${round} divider`);

    const divider = document.createElement('div');
    divider.className = 'round-divider text-center my-3';
    divider.innerHTML = `
      <div class="d-inline-flex align-items-center gap-2 px-3 py-1 bg-primary text-white rounded-pill shadow-sm">
        <i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i>
        <strong>Round ${round}</strong>
        <i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i>
      </div>
    `;

    stream.appendChild(divider);
  }

  addEscalationCard(data) {
    const stream = document.querySelector('#activity-stream');
    if (!stream) return;

    const message = data.message;

    const card = document.createElement('div');
    card.className = 'escalation-card animate-slide-in mb-3';
    card.style.cursor = 'pointer';
    card.title = 'Click to review this escalation';

    // Store escalation data for reopening modal
    card.dataset.escalationId = message.id;
    card._escalationData = data; // Store full escalation data

    card.innerHTML = `
      <div class="alert alert-danger border-danger border-2 shadow hover-lift">
        <div class="d-flex align-items-start">
          <div class="escalation-icon me-3">
            <i class="bi bi-exclamation-triangle-fill fs-1 text-danger animate-pulse"></i>
          </div>
          <div class="flex-grow-1">
            <h5 class="alert-heading mb-2">
              <i class="bi bi-person-fill me-2"></i>Human Decision Required
              <small class="text-muted ms-2">(Click to review)</small>
            </h5>
            <p class="mb-2"><strong>From:</strong> ${message.from} <strong>To:</strong> ${message.metadata.requiresRole}</p>
            <p class="mb-2"><strong>Type:</strong> <span class="badge bg-danger">${message.metadata.escalationType}</span></p>
            <p class="mb-0">${message.content}</p>
          </div>
        </div>
      </div>
    `;

    // Add click handler to reopen modal
    card.addEventListener('click', () => {
      console.log('🚨 Reopening HITL modal for escalation:', message.id);
      // Re-emit the escalation event to trigger modal
      this.bus.emit('hitl-escalation', data);
    });

    // Add hover effect
    const alertDiv = card.querySelector('.alert');
    card.addEventListener('mouseenter', () => {
      alertDiv.style.transform = 'translateY(-2px)';
      alertDiv.style.transition = 'transform 0.2s ease';
    });
    card.addEventListener('mouseleave', () => {
      alertDiv.style.transform = 'translateY(0)';
    });

    stream.appendChild(card);
    stream.scrollTop = stream.scrollHeight;
  }

  showCompletionBanner(rounds, elapsed) {
    const stream = document.querySelector('#activity-stream');
    if (!stream) return;

    const banner = document.createElement('div');
    banner.className = 'completion-banner animate-slide-in';
    banner.innerHTML = `
      <div class="alert alert-success border-success border-2 shadow-lg">
        <div class="text-center">
          <i class="bi bi-check-circle-fill fs-1 text-success mb-2"></i>
          <h4 class="alert-heading">Conversation Complete!</h4>
          <p class="mb-0">Completed ${rounds} rounds in ${Math.floor(elapsed / 1000)} seconds</p>
        </div>
      </div>
    `;

    stream.appendChild(banner);
  }

  truncate(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default ConversationDashboard;

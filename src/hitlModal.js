// HITL Modal - Human-in-the-Loop escalation interface
import { MessageType } from './agentProtocol.js';

/**
 * HITLModal - Manages the human escalation modal
 */
export class HITLModal {
  constructor(messageBus) {
    this.bus = messageBus;
    this.modal = null;
    this.bsModal = null;
    this.escalationHistory = []; // Track all escalations
    this.currentIndex = 0; // Current escalation being viewed

    // Get modal elements
    this.modalElement = document.querySelector('#hitl-modal');

    if (this.modalElement) {
      // Initialize Bootstrap modal
      this.bsModal = new bootstrap.Modal(this.modalElement, {
        backdrop: 'static',
        keyboard: false
      });

      // Get all sub-elements
      this.titleElement = document.querySelector('#hitl-title');
      this.fromElement = document.querySelector('#hitl-from');
      this.roleElement = document.querySelector('#hitl-role');
      this.urgencyElement = document.querySelector('#hitl-urgency');
      this.typeElement = document.querySelector('#hitl-type');
      this.contentElement = document.querySelector('#hitl-content');
      this.contextTable = document.querySelector('#hitl-context-table');
      this.recommendationElement = document.querySelector('#hitl-recommendation');
      this.conversationHistory = document.querySelector('#hitl-conversation-history');
      this.conversationCount = document.querySelector('#hitl-conversation-count');
      this.timestampElement = document.querySelector('#hitl-timestamp');

      // Action buttons
      this.approveBtn = document.querySelector('#hitl-approve-btn');
      this.rejectBtn = document.querySelector('#hitl-reject-btn');
      this.moreInfoBtn = document.querySelector('#hitl-more-info-btn');

      // Navigation elements
      this.counterElement = document.querySelector('#hitl-counter');
      this.prevBtn = document.querySelector('#hitl-prev-btn');
      this.nextBtn = document.querySelector('#hitl-next-btn');

      // Setup event listeners
      this.setupEventListeners();
    }
  }

  /**
   * Setup message bus and button event listeners
   */
  setupEventListeners() {
    // Listen for HITL escalations
    this.bus.on('hitl-escalation', (data) => this.onEscalation(data));
    this.bus.on('hitl-resolved', (data) => this.onResolved(data));

    // Button click handlers
    if (this.approveBtn) {
      this.approveBtn.addEventListener('click', () => this.handleDecision('APPROVE'));
    }

    if (this.rejectBtn) {
      this.rejectBtn.addEventListener('click', () => this.handleDecision('REJECT'));
    }

    if (this.moreInfoBtn) {
      this.moreInfoBtn.addEventListener('click', () => this.handleDecision('REQUEST_MORE_INFO'));
    }

    // Navigation button handlers
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.navigatePrevious());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.navigateNext());
    }
  }

  /**
   * Event: HITL escalation received
   */
  onEscalation(data) {
    console.log('🚨 HITL Modal: Escalation received', data);

    // Check if this escalation already exists in history
    const existingIndex = this.escalationHistory.findIndex(
      e => e.message.id === data.message.id
    );

    if (existingIndex !== -1) {
      // Already in history - just navigate to it
      console.log('🚨 HITL Modal: Escalation already in history, navigating to it');
      this.currentIndex = existingIndex;
      this.populateModal(this.escalationHistory[existingIndex]);
      this.updateNavigationButtons();
    } else {
      // New escalation - add to history
      this.escalationHistory.push(data);
      this.currentIndex = this.escalationHistory.length - 1;
      this.populateModal(data);
      this.updateNavigationButtons();

      // Play alert sound only for new escalations
      this.playAlertSound();
    }

    // Show modal
    if (this.bsModal) {
      this.bsModal.show();
    }
  }

  /**
   * Populate modal with escalation data
   */
  populateModal(data) {
    const message = data.message;
    const context = message.metadata.context || {};
    const isResolved = data.resolved || false;

    // Title
    if (this.titleElement) {
      const titles = {
        'POLICY_VIOLATION': 'Policy Violation - Decision Required',
        'LOW_CONFIDENCE': 'Verification Needed',
        'AGENT_DEADLOCK': 'Agent Consensus Required',
        'HIGH_VALUE': 'High-Value Transaction Approval',
        'MISSING_DATA': 'Missing Critical Data',
        'COMPLIANCE_ISSUE': 'Compliance Review Required'
      };
      this.titleElement.textContent = titles[message.metadata.escalationType] || 'Human Decision Required';
    }

    // From agent
    if (this.fromElement) {
      this.fromElement.textContent = message.from;
    }

    // Required role
    if (this.roleElement) {
      this.roleElement.textContent = message.metadata.requiresRole || 'Manager';
      this.roleElement.className = 'badge bg-primary';
    }

    // Urgency
    if (this.urgencyElement) {
      const urgency = message.metadata.urgency || 'medium';
      this.urgencyElement.textContent = urgency.toUpperCase();
      this.urgencyElement.className = `badge bg-${urgency === 'high' ? 'danger' : urgency === 'medium' ? 'warning' : 'info'}`;
    }

    // Escalation type
    if (this.typeElement) {
      this.typeElement.textContent = message.metadata.escalationType || 'AGENT_ESCALATION';
      this.typeElement.className = 'badge bg-secondary';
    }

    // Content/Issue
    if (this.contentElement) {
      this.contentElement.textContent = message.content;
    }

    // Context table
    if (this.contextTable && context) {
      this.populateContextTable(context);
    }

    // Recommendation
    if (this.recommendationElement) {
      this.recommendationElement.textContent = this.generateRecommendation(message, context);
    }

    // Conversation history
    if (this.conversationHistory && this.conversationCount) {
      const history = data.conversationHistory || [];
      this.conversationCount.textContent = history.length;
      this.populateConversationHistory(history);
    }

    // Timestamp
    if (this.timestampElement) {
      const timestamp = new Date(message.metadata.timestamp);
      this.timestampElement.textContent = timestamp.toLocaleString();
    }

    // Handle resolved status
    if (isResolved) {
      // Update title to show resolved
      if (this.titleElement) {
        this.titleElement.innerHTML = `${this.titleElement.textContent} <span class="badge bg-success ms-2">✓ Resolved</span>`;
      }

      // Disable action buttons
      if (this.approveBtn) this.approveBtn.disabled = true;
      if (this.rejectBtn) this.rejectBtn.disabled = true;
      if (this.moreInfoBtn) this.moreInfoBtn.disabled = true;

      // Show decision that was made
      const decisionBadge = document.createElement('div');
      decisionBadge.className = 'alert alert-success mt-3';
      decisionBadge.innerHTML = `
        <strong><i class="bi bi-check-circle me-2"></i>Decision Made:</strong> ${data.decision}
        <br><small class="text-muted">Resolved at: ${new Date(data.resolvedAt).toLocaleString()}</small>
      `;

      // Insert after recommendation
      if (this.recommendationElement && this.recommendationElement.parentElement) {
        this.recommendationElement.parentElement.insertAdjacentElement('afterend', decisionBadge);
      }
    } else {
      // Enable action buttons for unresolved
      if (this.approveBtn) this.approveBtn.disabled = false;
      if (this.rejectBtn) this.rejectBtn.disabled = false;
      if (this.moreInfoBtn) this.moreInfoBtn.disabled = false;

      // Remove any existing decision badge
      const existingBadge = this.modalElement?.querySelector('.alert-success');
      if (existingBadge && existingBadge.innerHTML.includes('Decision Made:')) {
        existingBadge.remove();
      }
    }
  }

  /**
   * Populate context table with escalation data
   */
  populateContextTable(context) {
    if (!this.contextTable) return;

    let html = '<tbody>';

    for (const [key, value] of Object.entries(context)) {
      // Format key
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();

      // Format value
      let formattedValue = value;
      if (typeof value === 'object' && value !== null) {
        formattedValue = JSON.stringify(value, null, 2);
      } else if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
        formattedValue = `$${value.toFixed(2)}`;
      } else if (typeof value === 'number' && key.toLowerCase().includes('percent')) {
        formattedValue = `${value}%`;
      }

      html += `
        <tr>
          <th class="bg-light" style="width: 30%;">${formattedKey}</th>
          <td>${this.escapeHtml(String(formattedValue))}</td>
        </tr>
      `;
    }

    html += '</tbody>';
    this.contextTable.innerHTML = html;
  }

  /**
   * Generate recommendation based on escalation
   */
  generateRecommendation(message, context) {
    const type = message.metadata.escalationType;

    switch (type) {
      case 'POLICY_VIOLATION':
        return `Agents recommend BLOCKING this action due to policy violation. The detected variance of ${context.variance}% exceeds the allowed threshold of ${context.tolerance}%. Manual exception approval is required to proceed.`;

      case 'LOW_CONFIDENCE':
        return `Agents cannot extract data with sufficient confidence (${context.ocrConfidence}% < 70%). Manual verification is required before proceeding with processing.`;

      case 'AGENT_DEADLOCK':
        return `Agents reached ${data.round} rounds without consensus. Multiple concerns were identified. Your decision is needed to break the deadlock.`;

      case 'HIGH_VALUE':
        return context.allChecksPass
          ? `All automated checks passed. This high-value transaction ($${context.amount}) requires executive approval per company policy.`
          : `High-value transaction ($${context.amount}) with some concerns identified. Executive review and approval required.`;

      case 'MISSING_DATA':
        return `Critical data is missing or incomplete. Agents cannot proceed without this information. Please provide the missing data or authorize proceeding with incomplete information.`;

      case 'COMPLIANCE_ISSUE':
        return `Potential compliance or regulatory issue detected. Legal/compliance review recommended before proceeding.`;

      default:
        return `Agent ${message.from} requires human decision to proceed. Please review the details and make a decision.`;
    }
  }

  /**
   * Populate conversation history
   */
  populateConversationHistory(history) {
    if (!this.conversationHistory) return;

    let html = '';

    for (const msg of history) {
      const timestamp = new Date(msg.metadata.timestamp).toLocaleTimeString();
      const typeColor = this.getMessageTypeColor(msg.type);

      html += `
        <div class="mb-3 p-2 border-start border-3 border-${typeColor} bg-light" style="border-radius: 0.25rem;">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <strong>${msg.from} → ${Array.isArray(msg.to) ? msg.to.join(', ') : msg.to}</strong>
            <span class="badge bg-${typeColor}">${msg.type}</span>
          </div>
          <div class="small mb-1">${this.escapeHtml(msg.content)}</div>
          <div class="small text-muted">${timestamp}</div>
        </div>
      `;
    }

    this.conversationHistory.innerHTML = html || '<p class="text-muted">No conversation history available.</p>';
  }

  /**
   * Get message type color for styling
   */
  getMessageTypeColor(type) {
    const colors = {
      'question': 'primary',
      'answer': 'success',
      'challenge': 'warning',
      'broadcast': 'danger',
      'escalate_human': 'dark'
    };
    return colors[type] || 'secondary';
  }

  /**
   * Handle user decision
   */
  async handleDecision(decision) {
    console.log(`🚨 HITL Modal: Decision made: ${decision}`);

    const currentEscalation = this.escalationHistory[this.currentIndex];
    if (!currentEscalation) {
      console.error('No current escalation to resolve');
      return;
    }

    // Check if already resolved
    if (currentEscalation.resolved) {
      console.warn('⚠️ This escalation has already been resolved');
      return;
    }

    // Get escalation ID
    const escalationId = currentEscalation.message.id;

    // Prepare decision data
    const decisionData = {
      decision: decision,
      timestamp: new Date().toISOString(),
      role: currentEscalation.message.metadata.requiresRole
    };

    // Resolve HITL through message bus
    await this.bus.resolveHITL(escalationId, decision, decisionData);

    // Mark as resolved in history
    currentEscalation.resolved = true;
    currentEscalation.decision = decision;
    currentEscalation.resolvedAt = new Date().toISOString();

    // Show success feedback
    this.showDecisionSuccess(decision);

    // Check if there are more unresolved escalations
    const hasMoreUnresolved = this.escalationHistory.some(
      (e, idx) => !e.resolved && idx !== this.currentIndex
    );

    if (hasMoreUnresolved) {
      // Move to next unresolved escalation after a short delay
      setTimeout(() => {
        const nextUnresolvedIndex = this.escalationHistory.findIndex(
          (e, idx) => !e.resolved && idx > this.currentIndex
        );
        if (nextUnresolvedIndex !== -1) {
          this.currentIndex = nextUnresolvedIndex;
        } else {
          // Wrap around to first unresolved
          this.currentIndex = this.escalationHistory.findIndex(e => !e.resolved);
        }
        this.populateModal(this.escalationHistory[this.currentIndex]);
        this.updateNavigationButtons();
      }, 1500);
    } else {
      // All escalations resolved - close modal after showing success
      setTimeout(() => {
        if (this.bsModal) {
          this.bsModal.hide();
        }
      }, 2000);
    }
  }

  /**
   * Event: HITL resolved
   */
  onResolved(data) {
    console.log('🚨 HITL Modal: Escalation resolved', data);

    // Show success message
    this.showToast('Success', `Decision recorded: ${data.decision}`, 'success');
  }

  /**
   * Play alert sound (optional)
   */
  playAlertSound() {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }

  /**
   * Show toast notification
   */
  showToast(title, message, type = 'info') {
    // Simple console log for now
    // In production, would use Bootstrap Toast component
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }

  /**
   * Show decision success feedback
   */
  showDecisionSuccess(decision) {
    // Create overlay message
    const overlay = document.createElement('div');
    overlay.className = 'position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div class="text-center">
        <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
        <h4 class="mt-3 text-success">Decision Recorded</h4>
        <p class="text-muted">${decision}</p>
      </div>
    `;

    // Add to modal body
    const modalBody = this.modalElement?.querySelector('.modal-body');
    if (modalBody) {
      modalBody.style.position = 'relative';
      modalBody.appendChild(overlay);

      // Remove after delay
      setTimeout(() => {
        overlay.remove();
      }, 1400);
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
   * Show modal manually (for testing)
   */
  show() {
    if (this.bsModal) {
      this.bsModal.show();
    }
  }

  /**
   * Hide modal manually
   */
  hide() {
    if (this.bsModal) {
      this.bsModal.hide();
    }
  }

  /**
   * Navigate to previous escalation
   */
  navigatePrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const escalation = this.escalationHistory[this.currentIndex];
      this.populateModal(escalation);
      this.updateNavigationButtons();
    }
  }

  /**
   * Navigate to next escalation
   */
  navigateNext() {
    if (this.currentIndex < this.escalationHistory.length - 1) {
      this.currentIndex++;
      const escalation = this.escalationHistory[this.currentIndex];
      this.populateModal(escalation);
      this.updateNavigationButtons();
    }
  }

  /**
   * Update navigation buttons state
   */
  updateNavigationButtons() {
    if (!this.prevBtn || !this.nextBtn || !this.counterElement) return;

    const total = this.escalationHistory.length;
    const current = this.currentIndex + 1;
    const resolved = this.escalationHistory.filter(e => e.resolved).length;
    const currentResolved = this.escalationHistory[this.currentIndex]?.resolved;

    // Update counter with resolved status
    const statusIcon = currentResolved ? '✓' : '⚠️';
    this.counterElement.innerHTML = `${statusIcon} ${current} of ${total} <small>(${resolved} resolved)</small>`;

    // Enable/disable buttons
    this.prevBtn.disabled = this.currentIndex === 0;
    this.nextBtn.disabled = this.currentIndex === total - 1;

    // Hide navigation if only one escalation
    if (total === 1) {
      this.prevBtn.style.display = 'none';
      this.nextBtn.style.display = 'none';
      this.counterElement.style.display = 'none';
    } else {
      this.prevBtn.style.display = 'inline-block';
      this.nextBtn.style.display = 'inline-block';
      this.counterElement.style.display = 'inline-block';
    }
  }
}

export default HITLModal;

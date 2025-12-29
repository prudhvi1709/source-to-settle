// UI Rendering Module
import { html, render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { Marked } from "marked";
import hljs from "highlight.js";

// Setup Markdown
const marked = new Marked();
marked.use({
  renderer: {
    code(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return `<pre class="hljs language-${language}"><code>${hljs.highlight(code, { language }).value.trim()}</code></pre>`;
    },
  },
});

export { marked };

// Render timeline
export function renderTimeline(items) {
  const timeline = document.querySelector("#progress-timeline");
  if (!timeline) return;

  render(
    items.map(item => html`
      <div class="timeline-item ${item.completed ? 'completed' : ''} ${item.active ? 'active' : ''} ${item.error ? 'text-danger' : ''}">
        ${item.icon ? html`<i class="${item.icon}"></i>` : ''}
        <h6>${item.title}</h6>
        <small class="text-muted">${item.description}</small>
      </div>
    `),
    timeline
  );
}

// Update timeline
export function updateTimeline(title, description, index = null, completed = false, error = false, icon = null) {
  const timeline = document.querySelector("#progress-timeline");
  if (!timeline) return;

  const existingItems = Array.from(timeline.querySelectorAll(".timeline-item"));
  const items = existingItems.map((el) => {
    const iconEl = el.querySelector("i");
    const h6El = el.querySelector("h6");
    const smallEl = el.querySelector("small");
    return {
      title: h6El?.textContent || '',
      description: smallEl?.textContent || '',
      icon: iconEl?.className || null,
      completed: el.classList.contains("completed"),
      active: false,
    };
  });

  if (index !== null && index < items.length) {
    items[index] = { title, description, icon: icon || items[index].icon, completed, active: !completed && !error, error };
  } else {
    items.push({ title, description, icon, completed, active: !completed && !error, error });
  }

  renderTimeline(items);
}

// Render agent outputs in accordion
export function renderAgentOutputs(agentOutputs) {
  const accordion = document.querySelector("#agent-accordion");

  // Only render to accordion (orchestration plan and buttons are above it)
  if (!accordion) return;

  const loading = html`<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>`;

  render(
    agentOutputs.map((output, index) => {
        const agent = output.agent;
        const isActive = output.status === 'processing' || output.status === 'streaming';
        const isCompleted = output.status === 'completed';
        const isFailed = output.status === 'failed';
        const collapseId = `collapse-agent-${index}`;

        return html`
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button ${!isActive ? 'collapsed' : ''}"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#${collapseId}"
                aria-expanded="${isActive ? 'true' : 'false'}"
              >
                <i class="${agent.icon} me-2"></i>
                <strong>${agent.name}</strong>
                <span class="ms-2 badge ${isCompleted ? 'bg-success' : isFailed ? 'bg-danger' : 'bg-primary'}">
                  ${isCompleted ? 'Completed' : isFailed ? 'Failed' : isActive ? 'Processing...' : 'Pending'}
                </span>
              </button>
            </h2>
            <div id="${collapseId}" class="accordion-collapse collapse ${isActive ? 'show' : ''}" data-bs-parent="#agent-accordion">
              <div class="accordion-body">
                ${output.status === 'processing' ? html`
                  <div class="text-center py-3">
                    ${loading}
                    <p class="mt-2 text-muted">Analyzing data...</p>
                  </div>
                ` : output.status === 'failed' ? html`
                  <div class="alert alert-danger">
                    <strong>Error:</strong> ${output.error}
                  </div>
                ` : output.data ? renderAgentData(output.data) : html`<p class="text-muted">No data yet</p>`}
              </div>
            </div>
          </div>
        `;
      }),
    accordion
  );
}

// Render agent data
function renderAgentData(data) {
  if (data.raw) {
    return html`<pre class="border p-3 rounded">${data.raw}</pre>`;
  }

  if (data.verdict && data.confidenceScore !== undefined) {
    return renderFinalVerdict(data);
  }

  return html`
    <div class="agent-data-tables">
      ${data.summary ? html`
        <div class="mb-4">
          <h6 class="text-primary"><i class="bi bi-file-text me-2"></i>Summary</h6>
          <div class="card">
            <div class="card-body">${unsafeHTML(marked.parse(data.summary))}</div>
          </div>
        </div>
      ` : ''}
      ${data.findings ? html`
        <div class="mb-4">
          <h6 class="text-primary"><i class="bi bi-search me-2"></i>Key Findings</h6>
          <div class="card">
            <div class="card-body">${renderContent(data.findings)}</div>
          </div>
        </div>
      ` : ''}
      ${data.recommendations ? html`
        <div class="mb-4">
          <h6 class="text-success"><i class="bi bi-lightbulb me-2"></i>Recommendations</h6>
          <div class="card border-success">
            <div class="card-body">${renderContent(data.recommendations)}</div>
          </div>
        </div>
      ` : ''}
      ${data.concerns ? html`
        <div class="mb-4">
          <h6 class="text-warning"><i class="bi bi-exclamation-triangle me-2"></i>Concerns</h6>
          <div class="card border-warning">
            <div class="card-body bg-warning bg-opacity-10">${renderContent(data.concerns)}</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Render final verdict
function renderFinalVerdict(evaluation) {
  const isApproved = evaluation.verdict === "APPROVE";
  const verdictColor = isApproved ? "success" : "danger";
  const verdictIcon = isApproved ? "bi-check-circle-fill" : "bi-x-circle-fill";

  let confidenceLevel = "Low", confidenceColor = "danger";
  if (evaluation.confidenceScore >= 80) { confidenceLevel = "High"; confidenceColor = "success"; }
  else if (evaluation.confidenceScore >= 60) { confidenceLevel = "Medium"; confidenceColor = "warning"; }

  const riskColors = { "LOW": "success", "MEDIUM": "warning", "HIGH": "danger" };
  const riskColor = riskColors[evaluation.riskLevel] || "secondary";

  return html`
    <div class="final-verdict">
      <div class="card border-${verdictColor} mb-4">
        <div class="card-body text-center py-4">
          <i class="bi ${verdictIcon} display-1 text-${verdictColor} mb-3"></i>
          <h2 class="display-4 fw-bold text-${verdictColor} mb-2">${evaluation.verdict}</h2>
          <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
            <span class="badge bg-${confidenceColor} fs-5 px-4 py-2">${evaluation.confidenceScore}% Confidence</span>
            <span class="badge bg-${riskColor} fs-5 px-4 py-2">${evaluation.riskLevel} Risk</span>
          </div>
          <div class="progress mb-2" style="height: 25px;">
            <div class="progress-bar bg-${confidenceColor}" role="progressbar"
                 style="width: ${evaluation.confidenceScore}%">${evaluation.confidenceScore}%</div>
          </div>
          <p class="text-muted mb-0"><small>Confidence Level: ${confidenceLevel}</small></p>
        </div>
      </div>
      ${evaluation.reasoning ? html`
        <div class="card mb-4">
          <div class="card-header bg-primary text-white"><i class="bi bi-lightbulb-fill me-2"></i><strong>Reasoning</strong></div>
          <div class="card-body"><p class="mb-0">${evaluation.reasoning}</p></div>
        </div>
      ` : ''}
      ${evaluation.keyFactors?.length > 0 ? html`
        <div class="card mb-4">
          <div class="card-header bg-info text-white"><i class="bi bi-list-check me-2"></i><strong>Key Factors</strong></div>
          <div class="card-body"><ul class="mb-0">${evaluation.keyFactors.map(f => html`<li>${f}</li>`)}</ul></div>
        </div>
      ` : ''}
      ${evaluation.criticalIssues?.length > 0 ? html`
        <div class="card border-danger mb-4">
          <div class="card-header bg-danger text-white"><i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Critical Issues</strong></div>
          <div class="card-body"><ul class="mb-0 text-danger">${evaluation.criticalIssues.map(i => html`<li><strong>${i}</strong></li>`)}</ul></div>
        </div>
      ` : ''}
      ${evaluation.recommendations?.length > 0 ? html`
        <div class="card border-success">
          <div class="card-header bg-success text-white"><i class="bi bi-arrow-right-circle-fill me-2"></i><strong>Final Recommendations</strong></div>
          <div class="card-body"><ul class="mb-0">${evaluation.recommendations.map(r => html`<li>${r}</li>`)}</ul></div>
        </div>
      ` : ''}
    </div>
  `;
}

// Render content (string, array, or object)
function renderContent(content) {
  if (!content) return '';
  if (typeof content === 'string') {
    if (content.includes('|') || content.includes('\n-') || content.includes('\n*') || content.includes('\n1.')) {
      return unsafeHTML(marked.parse(content));
    }
    return unsafeHTML(marked.parse(content));
  }
  if (Array.isArray(content)) {
    if (content.length === 0) return html`<p class="text-muted">No data</p>`;
    if (typeof content[0] === 'object') {
      const keys = Object.keys(content[0]);
      return html`
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead class="table-light">
              <tr>${keys.map(key => html`<th>${key}</th>`)}</tr>
            </thead>
            <tbody>
              ${content.map(row => html`<tr>${keys.map(key => html`<td>${renderValue(row[key])}</td>`)}</tr>`)}
            </tbody>
          </table>
        </div>
      `;
    }
    return html`<ul class="list-group list-group-flush">${content.map(item => html`<li class="list-group-item">${item}</li>`)}</ul>`;
  }
  if (typeof content === 'object') {
    return html`
      <div class="table-responsive">
        <table class="table table-sm table-borderless">
          <tbody>
            ${Object.entries(content).map(([key, value]) => html`
              <tr>
                <th class="text-nowrap align-top" style="width: 30%">${key}</th>
                <td>${renderValue(value)}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
  return html`<p>${content}</p>`;
}

// Render value
function renderValue(value) {
  if (value === null || value === undefined) return html`<span class="text-muted">—</span>`;
  if (typeof value === 'boolean') return html`<span class="badge ${value ? 'bg-success' : 'bg-secondary'}">${value ? 'Yes' : 'No'}</span>`;
  if (typeof value === 'number') return html`<code>${value}</code>`;
  if (typeof value === 'string') {
    if (value.length > 500) {
      return html`<details><summary>View (${value.length} chars)</summary><pre class="mt-2 p-2 border rounded">${value}</pre></details>`;
    }
    return html`<span>${value}</span>`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return html`<span class="text-muted">[ ]</span>`;
    if (value.length <= 3 && value.every(v => typeof v !== 'object')) {
      return html`<code>[${value.join(', ')}]</code>`;
    }
    return html`
      <details>
        <summary>${value.length} items</summary>
        <ul class="list-group list-group-flush mt-2">
          ${value.map(item => html`<li class="list-group-item">${renderValue(item)}</li>`)}
        </ul>
      </details>
    `;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return html`<span class="text-muted">{ }</span>`;
    return html`
      <details>
        <summary>${entries.length} properties</summary>
        <table class="table table-sm table-borderless mt-2 ms-3">
          <tbody>
            ${entries.map(([k, v]) => html`
              <tr>
                <th class="text-nowrap align-top" style="width: 40%">${k}</th>
                <td>${renderValue(v)}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </details>
    `;
  }
  return html`<span>${String(value)}</span>`;
}

// Display final results
export function displayResults(results, plan = null, finalEvaluation = null) {
  document.querySelector("#results-section")?.classList.remove("d-none");
  const resultsDiv = document.querySelector("#results-output");
  if (!resultsDiv) return;

  render(
    html`
      ${finalEvaluation ? html`
        <div class="mb-5">
          <h3 class="text-center mb-4"><i class="bi bi-clipboard-check me-2"></i>Final Decision</h3>
          ${renderFinalVerdict(finalEvaluation)}
        </div>
      ` : ''}
      ${plan ? html`
        <div class="alert alert-info border-info mb-4">
          <div class="d-flex align-items-start">
            <i class="bi bi-diagram-3 display-5 me-3"></i>
            <div class="flex-grow-1">
              <h4 class="alert-heading mb-2"><i class="bi bi-diagram-3 me-2"></i>Orchestration Summary</h4>
              <p class="mb-2"><strong>Scenario:</strong> ${plan.scenario}</p>
              <p class="mb-2"><strong>Agents Executed:</strong> ${plan.agentPlan?.join(' → ') || 'N/A'}</p>
              <p class="mb-0"><strong>Outcome:</strong> ${plan.expectedOutcome}</p>
            </div>
          </div>
        </div>
      ` : ''}
      <h4 class="mt-5 mb-3"><i class="bi bi-person-workspace me-2"></i>Detailed Agent Reports</h4>
      <div class="row g-4">
        ${results.map(result => html`
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-header bg-primary text-white">
                <i class="bi bi-check-circle me-2"></i>${result.agent}
                <span class="badge bg-white text-primary ms-2">${result.stage}</span>
              </div>
              <div class="card-body">
                ${result.summary ? html`<div class="mb-3"><strong>Summary:</strong><br>${unsafeHTML(marked.parse(result.summary))}</div>` : ""}
                ${result.findings ? html`<details class="mb-3"><summary><strong>Findings</strong></summary>${unsafeHTML(marked.parse(result.findings))}</details>` : ""}
                ${result.recommendations ? html`<details class="mb-3"><summary><strong>Recommendations</strong></summary>${unsafeHTML(marked.parse(result.recommendations))}</details>` : ""}
                ${result.concerns ? html`<div class="alert alert-warning mb-0"><strong>Concerns:</strong><br>${unsafeHTML(marked.parse(result.concerns))}</div>` : ""}
              </div>
            </div>
          </div>
        `)}
      </div>
    `,
    resultsDiv
  );

  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Toggle all agents
export function toggleAllAgents(open) {
  const accordion = document.getElementById('agent-accordion');
  if (!accordion) return;

  const allCollapses = accordion.querySelectorAll('.accordion-collapse');
  allCollapses.forEach(collapse => {
    const bsCollapse = new bootstrap.Collapse(collapse, { toggle: false });
    if (open) bsCollapse.show();
    else bsCollapse.hide();
  });

  if (open) {
    const allDetails = accordion.querySelectorAll('details');
    allDetails.forEach(detail => { detail.open = true; });
  }
}

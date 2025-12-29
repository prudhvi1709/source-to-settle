// Main Application Bootstrap
import { bootstrapAlert } from "bootstrap-alert";
import { openaiConfig } from "bootstrap-llm-provider";
import { html, render } from "lit-html";
import saveform from "saveform";
import { config } from "./config.js";
import { setupFileHandlers, getUploadedFiles, loadSampleFiles, extractText } from "./fileHandler.js";
import { initWorkflowViz, activateWorkflowPath } from "./workflow.js";
import { renderTimeline, displayResults, toggleAllAgents } from "./ui.js";
import { processAgentWorkflow } from "./agent.js";

// Helpers
const $ = (selector) => document.querySelector(selector);

// Setup settings form persistence
const settingsForm = saveform("#settings-form");
$("#settings-form [type=reset]")?.addEventListener("click", () => settingsForm.clear());

// Configure LLM button
$("#configure-llm")?.addEventListener("click", async () => await openaiConfig({ show: true }));

// Workflow banner controls
const workflowBanner = $("#workflow-banner");
const workflowToggleBtn = $("#workflow-toggle-btn");
const workflowBannerContent = $("#workflow-banner-content");
const workflowBannerHeader = $("#workflow-banner-header");

// Toggle workflow banner
if (workflowToggleBtn) {
  workflowToggleBtn.addEventListener("click", () => {
    const isExpanded = workflowToggleBtn.getAttribute("aria-expanded") === "true";
    new bootstrap.Collapse(workflowBannerContent, { toggle: true });
    workflowToggleBtn.setAttribute("aria-expanded", !isExpanded);

    const btnText = workflowToggleBtn.querySelector("span");
    if (btnText) {
      btnText.textContent = isExpanded ? "Show Details" : "Hide Details";
    }

    if (!isExpanded) {
      setTimeout(() => {
        if (window.workflowViz) {
          initWorkflowViz();
          const orchestrationPlan = window.orchestrationPlan;
          if (orchestrationPlan?.agentPlan) {
            activateWorkflowPath(orchestrationPlan.agentPlan);
          }
        }
      }, 350);
    }
  });
}

// Click header to toggle
if (workflowBannerHeader) {
  workflowBannerHeader.addEventListener("click", (e) => {
    if (!e.target.closest("#workflow-toggle-btn")) {
      workflowToggleBtn?.click();
    }
  });
}

// Show/hide workflow banner
function showWorkflowBanner() {
  if (workflowBanner) {
    workflowBanner.classList.remove("d-none");
    if (!window.workflowViz) {
      initWorkflowViz();
    }
    setTimeout(() => {
      if (workflowToggleBtn && workflowToggleBtn.getAttribute("aria-expanded") !== "true") {
        workflowToggleBtn.click();
      }
    }, 300);
  }
}

// Render demo cards
function renderDemoCards() {
  const demos = config.demos || [];
  const demoCards = $("#demo-cards");
  if (!demoCards) return;

  if (demos.length === 0) {
    render(html`<div class="col-12 text-center text-muted">No demo scenarios configured</div>`, demoCards);
    return;
  }

  render(
    demos.map((demo, index) => html`
      <div class="col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body d-flex flex-column text-center">
            <div class="mb-3">
              <i class="display-3 text-primary ${demo.icon}"></i>
            </div>
            <h6 class="card-title mb-2">${demo.title}</h6>
            <p class="card-text small text-muted">${demo.description}</p>
            <button class="mt-auto btn btn-primary btn-sm" data-run-demo=${index}>
              <i class="bi bi-play-circle me-2"></i>Run Demo
            </button>
          </div>
        </div>
      </div>
    `),
    demoCards
  );
}

// Handle demo runs
$("#demo-cards")?.addEventListener("click", async (e) => {
  const button = e.target.closest("button[data-run-demo]");
  if (!button) return;

  const index = button.getAttribute("data-run-demo");
  const demo = config.demos[index];
  if (!demo) return;

  await loadSampleFiles(demo.files || []);

  const uploadZone = $("#file-upload-zone");
  if (uploadZone) {
    uploadZone.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  bootstrapAlert({
    color: "info",
    title: "Files Loaded",
    body: `Loaded ${getUploadedFiles().length} file(s). Preview them using the eye icon 👁️, then click "Process Documents" when ready.`
  });
});

// Load sample data buttons
document.querySelectorAll(".load-sample").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    const type = e.target.getAttribute("data-type");
    await loadSampleFilesByType(type);
  });
});

async function loadSampleFilesByType(type) {
  const sampleMap = {
    csv: ["data/vendors.csv", "data/invoices.csv"],
    pdf: ["data/invoices_pdf/INV-00001.pdf", "data/kyc_samples/VENDOR-0002-kyc.pdf"],
    excel: ["data/Vendor_Database.xlsx", "data/supplier_performance/Scorecard_VENDOR-0002.xlsx"],
  };

  const files = sampleMap[type] || [];
  try {
    await loadSampleFiles(files);
    bootstrapAlert({ color: "success", title: "Success", body: `Loaded ${files.length} sample file(s)` });
  } catch (e) {
    bootstrapAlert({ color: "danger", title: "Error", body: `Failed to load sample files: ${e.message}` });
  }
}

// Process documents
async function processDocuments() {
  const uploadedFiles = getUploadedFiles();
  if (uploadedFiles.length === 0) return;

  showWorkflowBanner();
  const statusText = $("#workflow-status-text");
  if (statusText) statusText.textContent = "Initializing workflow...";

  $("#processing-section")?.classList.remove("d-none");
  $("#results-section")?.classList.add("d-none");

  renderTimeline([]);

  // Extract text from files
  const extractedData = [];
  for (const file of uploadedFiles) {
    const timeline = $("#progress-timeline");
    if (timeline) {
      render(html`
        <div class="timeline-item active">
          <h6>Extracting text</h6>
          <small class="text-muted">Processing ${file.name}...</small>
        </div>
      `, timeline);
    }

    try {
      const text = await extractText(file);
      extractedData.push({
        filename: file.name,
        type: file.type,
        text: text,
      });
    } catch (e) {
      console.error(`Error extracting from ${file.name}:`, e);
      extractedData.push({
        filename: file.name,
        type: file.type,
        text: `[Error extracting text: ${e.message}]`,
        error: true,
      });
    }
  }

  // Process through agent workflow
  try {
    const { results, orchestrationPlan, finalEvaluation } = await processAgentWorkflow(extractedData);

    // Store for potential workflow banner re-render
    window.orchestrationPlan = orchestrationPlan;

    // Display results
    displayResults(results, orchestrationPlan, finalEvaluation);
  } catch (e) {
    console.error("Processing error:", e);
    bootstrapAlert({ color: "danger", title: "Processing Error", body: e.message });
  }
}

// Initialize application
async function init() {
  // Setup file handlers
  setupFileHandlers();

  // Render demo cards
  renderDemoCards();

  // Setup process button
  const processBtn = $("#process-btn");
  if (processBtn) {
    processBtn.addEventListener("click", processDocuments);
  }

  // Make toggleAllAgents available globally for lit-html event handlers
  window.toggleAllAgents = toggleAllAgents;
}

// Start application
init();

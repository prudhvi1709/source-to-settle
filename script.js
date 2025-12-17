import { asyncLLM } from "asyncllm";
import { bootstrapAlert } from "bootstrap-alert";
import { openaiConfig } from "bootstrap-llm-provider";
import hljs from "highlight.js";
import { html, render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { Marked } from "marked";
import { parse } from "partial-json";
import saveform from "saveform";
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";
import mammoth from "mammoth";

// Helpers
const $ = (selector, el = document) => el.querySelector(selector);
const loading = html`<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>`;

// Configure PDF.js worker and standard fonts
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

// Set standard fonts path to suppress warnings
const PDFJS_STANDARD_FONT_DATA_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/";

// Set up settings form persistence
const settingsForm = saveform("#settings-form");
$("#settings-form [type=reset]").addEventListener("click", () => settingsForm.clear());

// Set up Markdown rendering
const marked = new Marked();
marked.use({
  renderer: {
    code(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return /* html */ `<pre class="hljs language-${language}"><code>${
        hljs.highlight(code, { language }).value.trim()
      }</code></pre>`;
    },
  },
});

// Configure LLM on demand
$("#configure-llm").addEventListener("click", async () => await openaiConfig({ show: true }));

// Load configuration
let config;
try {
  config = await fetch("config.json").then((res) => res.json());
} catch (e) {
  console.error("Failed to load config.json:", e);
  config = { agents: [], demos: [] };
}

// Track agent outputs globally
let agentOutputs = [];

// Track orchestration plan
let orchestrationPlan = null;

// Render workflow stages
renderWorkflowStages();

// Render demo cards
renderDemoCards();

// File upload handling
const fileInput = $("#file-input");
const uploadZone = $("#file-upload-zone");
const processBtn = $("#process-btn");
let uploadedFiles = [];

uploadZone.addEventListener("click", () => fileInput.click());

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("dragover");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  uploadedFiles = Array.from(files);
  renderFileList();
  processBtn.disabled = uploadedFiles.length === 0;

  if (uploadedFiles.length > 0) {
    previewFile(uploadedFiles[0]);
  }
}

function renderFileList() {
  const fileList = $("#file-list");
  if (uploadedFiles.length === 0) {
    fileList.innerHTML = "";
    return;
  }

  render(
    html`
      <div class="list-group">
        ${uploadedFiles.map((file, index) => html`
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <i class="bi ${getFileIcon(file.name)} me-2"></i>
              <span>${file.name}</span>
              <small class="text-muted ms-2">(${formatFileSize(file.size)})</small>
            </div>
            <div>
              <button class="btn btn-sm btn-outline-primary me-2" @click=${() => previewFile(file)} title="Preview file">
                <i class="bi bi-eye"></i> Preview
              </button>
              <button class="btn btn-sm btn-outline-danger" @click=${() => removeFile(index)} title="Remove file">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `)}
      </div>
    `,
    fileList
  );
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
  processBtn.disabled = uploadedFiles.length === 0;
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const iconMap = {
    pdf: "bi-file-pdf-fill text-danger",
    xlsx: "bi-file-excel-fill text-success",
    xls: "bi-file-excel-fill text-success",
    csv: "bi-file-spreadsheet-fill text-success",
    doc: "bi-file-word-fill text-primary",
    docx: "bi-file-word-fill text-primary",
    jpg: "bi-file-image-fill text-warning",
    jpeg: "bi-file-image-fill text-warning",
    png: "bi-file-image-fill text-warning",
  };
  return iconMap[ext] || "bi-file-earmark-fill";
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

async function previewFile(file) {
  const preview = $("#file-preview");
  render(html`<div class="text-center">${loading}</div>`, preview);

  const ext = file.name.split('.').pop().toLowerCase();

  try {
    if (ext === "pdf") {
      await previewPDF(file, preview);
    } else if (["xlsx", "xls", "csv"].includes(ext)) {
      await previewExcel(file, preview);
    } else if (["jpg", "jpeg", "png"].includes(ext)) {
      await previewImage(file, preview);
    } else if (["doc", "docx"].includes(ext)) {
      render(html`<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Word document preview: ${file.name}<br><small>Text extraction will be performed during processing.</small></div>`, preview);
    } else {
      render(html`<div class="alert alert-warning">Preview not available for this file type</div>`, preview);
    }
  } catch (e) {
    console.error("Preview error:", e);
    render(html`<div class="alert alert-danger">Error previewing file: ${e.message}</div>`, preview);
  }
}

async function previewPDF(file, preview) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    standardFontDataUrl: PDFJS_STANDARD_FONT_DATA_URL
  }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

  render(html`
    <div>
      <p class="text-muted mb-2">PDF Preview (Page 1 of ${pdf.numPages})</p>
      ${unsafeHTML(canvas.outerHTML)}
    </div>
  `, preview);
}

async function previewExcel(file, preview) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const html_table = XLSX.utils.sheet_to_html(firstSheet, { header: 1 });

  render(html`
    <div>
      <p class="text-muted mb-2">Excel Preview (${workbook.SheetNames[0]})</p>
      <div class="table-responsive">${unsafeHTML(html_table)}</div>
    </div>
  `, preview);
}

async function previewImage(file, preview) {
  const url = URL.createObjectURL(file);
  render(html`<img src="${url}" class="img-fluid" alt="${file.name}">`, preview);
}

// Extract text from various file formats
async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === "pdf") {
    return await extractTextFromPDF(file);
  } else if (["xlsx", "xls", "csv"].includes(ext)) {
    return await extractTextFromExcel(file);
  } else if (["doc", "docx"].includes(ext)) {
    return await extractTextFromWord(file);
  } else if (["jpg", "jpeg", "png"].includes(ext)) {
    const ocrEnabled = $("#ocr-enabled").checked;
    if (ocrEnabled) {
      return await extractTextFromImage(file);
    } else {
      return `[Image file: ${file.name}. OCR disabled.]`;
    }
  } else {
    return `[Unsupported file type: ${file.name}]`;
  }
}

async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      standardFontDataUrl: PDFJS_STANDARD_FONT_DATA_URL
    }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      text += `\n--- Page ${i} ---\n${pageText}\n`;
    }

    // If text is too short, might be a scanned PDF - try OCR
    if (text.trim().length < 100 && $("#ocr-enabled").checked) {
      console.log("PDF appears to be scanned, attempting OCR...");
      // For scanned PDFs, we'd need to render pages to canvas and OCR them
      // Simplified: just return the minimal text
      return text + "\n[Note: This appears to be a scanned PDF. OCR processing would be applied here.]";
    }

    return text;
  } catch (error) {
    console.error(`PDF extraction error for ${file.name}:`, error);
    // Return error message as text so processing can continue
    return `[PDF extraction failed for ${file.name}: ${error.message}. This may be a corrupted, encrypted, or unsupported PDF format.]`;
  }
}

async function extractTextFromExcel(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  let text = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    text += `\n--- Sheet: ${sheetName} ---\n`;
    text += json.map(row => row.join(" | ")).join("\n");
    text += "\n";
  }

  return text;
}

async function extractTextFromImage(file) {
  const { data: { text } } = await Tesseract.recognize(file, "eng", {
    logger: (m) => console.log(m),
  });
  return text;
}

async function extractTextFromWord(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || `[No text extracted from ${file.name}]`;
  } catch (error) {
    console.error(`Word extraction error for ${file.name}:`, error);
    // Return a descriptive placeholder instead of failing completely
    return `[Word Document: ${file.name}]

Note: This document could not be automatically extracted. It may be:
- An older .doc format (only .docx is supported)
- A corrupted or invalid file
- Password protected

The document filename and type will still be considered by the agents for context.`;
  }
}

// Workflow stages rendering
function renderWorkflowStages() {
  const workflowContainer = $("#workflow-stages");
  const stages = config.agents || [];

  render(
    html`
      <div class="col-12 mb-3">
        <div class="alert alert-info">
          <div class="d-flex align-items-center">
            <i class="bi bi-diagram-3 display-6 me-3"></i>
            <div>
              <h5 class="mb-1">Dynamic Agent Orchestration</h5>
              <p class="mb-0 small">Upload documents and the Orchestrator will intelligently route to the right agents in the optimal sequence.</p>
            </div>
          </div>
        </div>
      </div>
      ${stages.map((agent, index) => html`
        <div class="col-md-6 col-lg-4 col-xl-2">
          <div class="card workflow-stage text-center h-100" data-stage="${index}">
            <div class="card-body">
              <i class="${agent.icon} stage-icon text-primary"></i>
              <h6 class="card-title">${agent.name}</h6>
              <p class="card-text small text-muted">${agent.description}</p>
              <span class="badge bg-secondary">${agent.stage}</span>
            </div>
          </div>
        </div>
      `)}
    `,
    workflowContainer
  );
}

// Demo cards rendering
function renderDemoCards() {
  const demos = config.demos || [];
  if (demos.length === 0) {
    render(html`<div class="col-12 text-center text-muted">No demo scenarios configured</div>`, $("#demo-cards"));
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
    $("#demo-cards")
  );
}

// Handle demo runs
$("#demo-cards").addEventListener("click", async (e) => {
  const button = e.target.closest("button[data-run-demo]");
  if (!button) return;

  const index = button.getAttribute("data-run-demo");
  const demo = config.demos[index];
  if (!demo) return;

  // Load sample files for demo
  await loadSampleFiles(demo.files || []);

  // Scroll to file upload area to show files and preview
  const uploadZone = $("#file-upload-zone");
  if (uploadZone) {
    uploadZone.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Show alert prompting user to preview or process
  bootstrapAlert({
    color: "info",
    title: "Files Loaded",
    body: `Loaded ${uploadedFiles.length} file(s). Preview them using the eye icon 👁️, then click "Process Documents" when ready.`
  });
});

// Load sample data
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
  await loadSampleFiles(files);
}

async function loadSampleFiles(filePaths) {
  try {
    render(html`<div class="alert alert-info"><i class="bi bi-download me-2"></i>Loading sample files...</div>`, $("#file-list"));

    const filePromises = filePaths.map(async (path) => {
      const response = await fetch(path);
      const blob = await response.blob();
      const filename = path.split('/').pop();
      return new File([blob], filename, { type: blob.type });
    });

    uploadedFiles = await Promise.all(filePromises);
    renderFileList();
    processBtn.disabled = false;

    if (uploadedFiles.length > 0) {
      await previewFile(uploadedFiles[0]);
    }

    bootstrapAlert({ color: "success", title: "Success", body: `Loaded ${uploadedFiles.length} sample file(s)` });
  } catch (e) {
    console.error("Error loading sample files:", e);
    bootstrapAlert({ color: "danger", title: "Error", body: `Failed to load sample files: ${e.message}` });
  }
}

// Process documents button
processBtn.addEventListener("click", processDocuments);

async function processDocuments() {
  if (uploadedFiles.length === 0) return;

  // Show processing section
  $("#processing-section").classList.remove("d-none");
  $("#results-section").classList.add("d-none");

  // Initialize timeline
  renderTimeline([]);

  // Extract text from all files
  const extractedData = [];
  for (const file of uploadedFiles) {
    updateTimeline("Extracting text", `Processing ${file.name}...`);
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
  await processAgentWorkflow(extractedData);
}

// Run orchestrator to determine agent plan
async function runOrchestrator(extractedData) {
  const orchestratorConfig = config.orchestrator;
  if (!orchestratorConfig) {
    console.error("No orchestrator configuration found");
    return null;
  }

  updateTimeline("Orchestrator", "Analyzing documents and planning agent execution...", 0, false, false, orchestratorConfig.icon);

  // Prepare agent catalog for orchestrator
  const agentCatalog = config.agents.map(agent => ({
    name: agent.name,
    description: agent.description,
    role: agent.role,
    capabilities: agent.task
  }));

  // Build prompt for orchestrator
  const prompt = `You are ${orchestratorConfig.name}, ${orchestratorConfig.description}.

${orchestratorConfig.role}

**Available Agents:**
${JSON.stringify(agentCatalog, null, 2)}

**Uploaded Files:**
${extractedData.map(d => `- ${d.filename} (${d.type || 'unknown type'})`).join('\n')}

**File Content Preview:**
${extractedData.map(d => `File: ${d.filename}\nPreview: ${d.text.substring(0, 300)}...\n`).join('\n---\n')}

**Task:** ${orchestratorConfig.task}

**IMPORTANT:** Return ONLY valid JSON with this exact structure:
{
  "scenario": "brief description of detected scenario",
  "reasoning": "why you chose this scenario and agent sequence",
  "agentPlan": ["AgentName1", "AgentName2", ...],
  "expectedOutcome": "what we expect to achieve"
}`;

  try {
    const result = await runAgent(orchestratorConfig, extractedData, [], true);
    updateTimeline("Orchestrator", `Plan created: ${result.agentPlan?.length || 0} agents selected`, 0, true, false, orchestratorConfig.icon);
    return result;
  } catch (e) {
    console.error("Orchestrator error:", e);
    updateTimeline("Orchestrator", `Error: ${e.message}`, 0, false, true, orchestratorConfig.icon);
    throw e;
  }
}

async function processAgentWorkflow(extractedData) {
  const results = [];
  agentOutputs = []; // Reset outputs

  // Clear agent output area and initialize accordion
  const outputDiv = $("#agent-output");
  render(html`<div class="accordion" id="agent-accordion"></div>`, outputDiv);

  try {
    // Step 1: Run orchestrator to get agent plan
    orchestrationPlan = await runOrchestrator(extractedData);

    if (!orchestrationPlan || !orchestrationPlan.agentPlan || orchestrationPlan.agentPlan.length === 0) {
      bootstrapAlert({ color: "warning", title: "No Agents Selected", body: "Orchestrator did not select any agents to run." });
      displayResults(results, orchestrationPlan);
      return;
    }

    // Display orchestration plan
    render(html`
      <div class="mb-4">
        <div class="alert alert-info">
          <div class="d-flex align-items-start">
            <i class="bi bi-diagram-3 display-6 me-3"></i>
            <div class="flex-grow-1">
              <h5 class="mb-2"><i class="bi bi-lightbulb me-2"></i>Orchestration Plan</h5>
              <p class="mb-2"><strong>Scenario:</strong> ${orchestrationPlan.scenario}</p>
              <p class="mb-2"><strong>Reasoning:</strong> ${orchestrationPlan.reasoning}</p>
              <p class="mb-2"><strong>Agent Sequence:</strong> ${orchestrationPlan.agentPlan.join(' → ')}</p>
              <p class="mb-0"><strong>Expected Outcome:</strong> ${orchestrationPlan.expectedOutcome}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-3 d-flex justify-content-end">
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-primary btn-sm" @click=${() => toggleAllAgents(true)}>
            <i class="bi bi-arrows-expand me-1"></i>Expand All Agents
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click=${() => toggleAllAgents(false)}>
            <i class="bi bi-arrows-collapse me-1"></i>Collapse All Agents
          </button>
        </div>
      </div>
      <div class="accordion" id="agent-accordion"></div>
    `, outputDiv);

    // Step 2: Execute agents according to plan
    for (let i = 0; i < orchestrationPlan.agentPlan.length; i++) {
      const agentName = orchestrationPlan.agentPlan[i];
      const agent = config.agents.find(a => a.name === agentName);

      if (!agent) {
        console.warn(`Agent ${agentName} not found in config`);
        continue;
      }

      // Update timeline
      updateTimeline(agent.name, agent.description, i + 1, false, false, agent.icon);

      // Mark stages
      const agentIndex = config.agents.findIndex(a => a.name === agentName);
      document.querySelectorAll(".workflow-stage").forEach((stage, idx) => {
        if (idx === agentIndex) {
          stage.classList.add("active");
        }
      });

      try {
        const agentResult = await runAgent(agent, extractedData, results);
        results.push({
          agent: agent.name,
          stage: agent.stage,
          ...agentResult,
        });

        updateTimeline(agent.name, agent.description, i + 1, true, false, agent.icon);

        // Mark stage as completed
        document.querySelectorAll(".workflow-stage").forEach((stage, idx) => {
          if (idx === agentIndex) {
            stage.classList.remove("active");
            stage.classList.add("completed");
          }
        });
      } catch (e) {
        console.error(`Error in ${agent.name}:`, e);
        updateTimeline(agent.name, `Error: ${e.message}`, i + 1, false, true, agent.icon);
        bootstrapAlert({ color: "danger", title: `${agent.name} Error`, body: e.message });
      }
    }

    // Step 3: Run final evaluation agent
    const finalEvaluation = await runFinalEvaluation(extractedData, results, orchestrationPlan);

    // Show results with final evaluation
    displayResults(results, orchestrationPlan, finalEvaluation);

  } catch (e) {
    console.error("Workflow processing error:", e);
    bootstrapAlert({ color: "danger", title: "Workflow Error", body: e.message });
  }
}

// Run final evaluation to approve/reject
async function runFinalEvaluation(extractedData, agentResults, orchestrationPlan) {
  updateTimeline("Final Evaluation", "Synthesizing all agent outputs for final decision...", agentResults.length + 1, false, false, "bi bi-clipboard-check");

  try {
    const { baseUrl, apiKey } = await openaiConfig();

    if (!baseUrl || !apiKey) {
      throw new Error("LLM not configured");
    }

    // Prepare summary of all agent outputs
    const agentSummaries = agentResults.map(r => ({
      agent: r.agent,
      stage: r.stage,
      summary: r.summary,
      concerns: r.concerns,
      recommendations: r.recommendations
    }));

    const prompt = `You are a Final Decision Agent responsible for making the ultimate APPROVE or REJECT decision based on all agent analyses.

**Scenario:** ${orchestrationPlan?.scenario || 'Document processing'}

**Agent Analyses:**
${JSON.stringify(agentSummaries, null, 2)}

**Documents Processed:**
${extractedData.map(d => `- ${d.filename}`).join('\n')}

**Your Task:**
Synthesize all the agent findings and make a final decision. Consider:
1. Risk factors identified by agents
2. Compliance and validation issues
3. Financial concerns
4. Overall document quality and completeness
5. Recommendations from all agents

**Return ONLY valid JSON with this exact structure:**
{
  "verdict": "APPROVE" or "REJECT",
  "confidenceScore": 85,
  "reasoning": "Detailed explanation of why this verdict was reached",
  "keyFactors": [
    "Factor 1 that influenced the decision",
    "Factor 2 that influenced the decision"
  ],
  "riskLevel": "LOW", "MEDIUM", or "HIGH",
  "criticalIssues": ["Issue 1", "Issue 2"] or [],
  "recommendations": ["Final recommendation 1", "Final recommendation 2"]
}

The confidenceScore should be 0-100 based on:
- Completeness of data (30%)
- Absence of critical issues (40%)
- Agent consensus (20%)
- Data quality (10%)`;

    const body = {
      model: $("#model").value || config.defaults?.model || "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    };

    const temperatureValue = parseFloat($("#temperature").value);
    if (temperatureValue && temperatureValue !== 1) {
      body.temperature = temperatureValue;
    }

    let fullResponse = "";
    const evalIndex = agentOutputs.length;

    // Add placeholder for evaluation agent
    agentOutputs.push({
      agent: {
        name: "Final Evaluation",
        icon: "bi bi-clipboard-check",
        description: "Final approval decision"
      },
      status: 'processing',
      data: null
    });

    renderAgentOutputs();

    // Stream the response
    for await (
      const { content, error } of asyncLLM(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
    ) {
      if (error) {
        throw new Error(`API error: ${JSON.stringify(error)}`);
      }
      if (!content) continue;

      fullResponse = content;

      try {
        const parsed = parse(fullResponse);
        agentOutputs[evalIndex].data = parsed;
        agentOutputs[evalIndex].status = 'streaming';
        renderAgentOutputs();
      } catch (parseError) {
        agentOutputs[evalIndex].data = { raw: fullResponse };
        agentOutputs[evalIndex].status = 'streaming';
        renderAgentOutputs();
      }
    }

    agentOutputs[evalIndex].status = 'completed';
    renderAgentOutputs();

    const evaluation = JSON.parse(fullResponse);
    updateTimeline("Final Evaluation", `${evaluation.verdict} (${evaluation.confidenceScore}% confidence)`, agentResults.length + 1, true, false, "bi bi-clipboard-check");

    return evaluation;

  } catch (e) {
    console.error("Final evaluation error:", e);
    updateTimeline("Final Evaluation", `Error: ${e.message}`, agentResults.length + 1, false, true, "bi bi-clipboard-check");
    throw e;
  }
}

async function runAgent(agent, extractedData, previousResults, isOrchestrator = false) {
  const { baseUrl, apiKey } = await openaiConfig();

  // Check if LLM is configured
  if (!baseUrl || !apiKey) {
    throw new Error("LLM not configured. Please click the 'Configure LLM' button (🪄) in the navigation bar to set your API endpoint and key.");
  }

  let prompt;

  if (isOrchestrator) {
    // For orchestrator, use custom prompt with agent catalog
    const agentCatalog = config.agents.map(agent => ({
      name: agent.name,
      description: agent.description,
      role: agent.role,
      capabilities: agent.task
    }));

    prompt = `You are ${agent.name}, ${agent.description}.

${agent.role}

**Available Agents:**
${JSON.stringify(agentCatalog, null, 2)}

**Uploaded Files:**
${extractedData.map(d => `- ${d.filename} (${d.type || 'unknown type'})`).join('\n')}

**File Content Preview:**
${extractedData.map(d => `File: ${d.filename}\nPreview: ${d.text.substring(0, 300)}...\n`).join('\n---\n')}

**Task:** ${agent.task}

**IMPORTANT:** Return ONLY valid JSON with this exact structure:
{
  "scenario": "brief description of detected scenario",
  "reasoning": "why you chose this scenario and agent sequence",
  "agentPlan": ["AgentName1", "AgentName2", ...],
  "expectedOutcome": "what we expect to achieve"
}`;
  } else {
    // Regular agent prompt
    const context = {
      files: extractedData.map(d => ({ filename: d.filename, preview: d.text.substring(0, 500) })),
      previousResults: previousResults.map(r => ({ agent: r.agent, summary: r.summary })),
    };

    prompt = `You are ${agent.name}, an AI agent specialized in ${agent.description}.

Your role: ${agent.role}

Context:
${JSON.stringify(context, null, 2)}

Full extracted data:
${extractedData.map(d => `File: ${d.filename}\n${d.text}`).join("\n\n---\n\n")}

Task: ${agent.task}

Provide a structured analysis with:
1. Summary of findings
2. Key data points extracted
3. Recommendations or next steps
4. Any risks or concerns identified

Format your response as JSON with keys: summary, findings, recommendations, concerns`;
  }

  const body = {
    model: $("#model").value || config.defaults?.model || "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  };

  // Only add temperature if it's explicitly set and not the default (1)
  // Some models don't support custom temperature values
  const temperatureValue = parseFloat($("#temperature").value);
  if (temperatureValue && temperatureValue !== 1) {
    body.temperature = temperatureValue;
  }

  let fullResponse = "";
  const agentIndex = agentOutputs.length;

  // Add placeholder for this agent
  agentOutputs.push({
    agent: agent,
    status: 'processing',
    data: null
  });

  // Render all agent outputs with current one processing
  renderAgentOutputs();

  try {
    for await (
      const { content, error } of asyncLLM(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
    ) {
      if (error) {
        console.error("LLM API error:", error);
        const errorMsg = typeof error === 'object' ? JSON.stringify(error) : String(error);
        throw new Error(`API returned error: ${errorMsg}`);
      }
      if (!content) continue;

      fullResponse = content;

      // Try to parse as JSON and update the agent output
      try {
        const parsed = parse(fullResponse);
        agentOutputs[agentIndex].data = parsed;
        agentOutputs[agentIndex].status = 'streaming';
        renderAgentOutputs();
      } catch (parseError) {
        // If not valid JSON yet, show raw text
        agentOutputs[agentIndex].data = { raw: fullResponse };
        agentOutputs[agentIndex].status = 'streaming';
        renderAgentOutputs();
      }
    }
  } catch (e) {
    console.error("LLM processing error:", e);
    const errorMessage = e.message || String(e);

    // Mark agent as failed
    agentOutputs[agentIndex].status = 'failed';
    agentOutputs[agentIndex].error = errorMessage;
    renderAgentOutputs();

    throw new Error(`LLM call failed: ${errorMessage}. Please check: 1) LLM API is configured (click 'Configure LLM' button), 2) API key is valid, 3) Model name is correct`);
  }

  // Mark as completed
  agentOutputs[agentIndex].status = 'completed';
  renderAgentOutputs();

  // Parse final response
  try {
    const result = JSON.parse(fullResponse);
    return result;
  } catch (e) {
    return {
      summary: fullResponse,
      findings: "",
      recommendations: "",
      concerns: "",
    };
  }
}

// Toggle all agent accordions and their details
function toggleAllAgents(open) {
  const accordion = document.getElementById('agent-accordion');
  if (!accordion) return;

  // Toggle all accordion collapses
  const allCollapses = accordion.querySelectorAll('.accordion-collapse');
  allCollapses.forEach(collapse => {
    const bsCollapse = new bootstrap.Collapse(collapse, { toggle: false });
    if (open) {
      bsCollapse.show();
    } else {
      bsCollapse.hide();
    }
  });

  // Also toggle all details elements within agents
  if (open) {
    const allDetails = accordion.querySelectorAll('details');
    allDetails.forEach(detail => {
      detail.open = true;
    });
  }
}

// Render all agent outputs in accordion format
function renderAgentOutputs() {
  const outputDiv = $("#agent-output");
  const accordion = $("#agent-accordion");

  if (!accordion) {
    render(html`<div class="accordion" id="agent-accordion"></div>`, outputDiv);
  }

  render(
    html`
      ${agentOutputs.map((output, index) => {
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
      })}
    `,
    accordion || outputDiv
  );
}

// Render final evaluation verdict
function renderFinalVerdict(evaluation) {
  const isApproved = evaluation.verdict === "APPROVE";
  const verdictColor = isApproved ? "success" : "danger";
  const verdictIcon = isApproved ? "bi-check-circle-fill" : "bi-x-circle-fill";

  // Determine confidence level
  let confidenceLevel = "Low";
  let confidenceColor = "danger";
  if (evaluation.confidenceScore >= 80) {
    confidenceLevel = "High";
    confidenceColor = "success";
  } else if (evaluation.confidenceScore >= 60) {
    confidenceLevel = "Medium";
    confidenceColor = "warning";
  }

  // Determine risk badge color
  const riskColors = {
    "LOW": "success",
    "MEDIUM": "warning",
    "HIGH": "danger"
  };
  const riskColor = riskColors[evaluation.riskLevel] || "secondary";

  return html`
    <div class="final-verdict">
      <!-- Main Verdict Card -->
      <div class="card border-${verdictColor} mb-4">
        <div class="card-body text-center py-4">
          <i class="bi ${verdictIcon} display-1 text-${verdictColor} mb-3"></i>
          <h2 class="display-4 fw-bold text-${verdictColor} mb-2">${evaluation.verdict}</h2>
          <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
            <span class="badge bg-${confidenceColor} fs-5 px-4 py-2">
              ${evaluation.confidenceScore}% Confidence
            </span>
            <span class="badge bg-${riskColor} fs-5 px-4 py-2">
              ${evaluation.riskLevel} Risk
            </span>
          </div>
          <div class="progress mb-2" style="height: 25px;">
            <div class="progress-bar bg-${confidenceColor}" role="progressbar"
                 style="width: ${evaluation.confidenceScore}%"
                 aria-valuenow="${evaluation.confidenceScore}" aria-valuemin="0" aria-valuemax="100">
              ${evaluation.confidenceScore}%
            </div>
          </div>
          <p class="text-muted mb-0"><small>Confidence Level: ${confidenceLevel}</small></p>
        </div>
      </div>

      <!-- Reasoning -->
      ${evaluation.reasoning ? html`
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <i class="bi bi-lightbulb-fill me-2"></i><strong>Reasoning</strong>
          </div>
          <div class="card-body">
            <p class="mb-0">${evaluation.reasoning}</p>
          </div>
        </div>
      ` : ''}

      <!-- Key Factors -->
      ${evaluation.keyFactors && evaluation.keyFactors.length > 0 ? html`
        <div class="card mb-4">
          <div class="card-header bg-info text-white">
            <i class="bi bi-list-check me-2"></i><strong>Key Factors</strong>
          </div>
          <div class="card-body">
            <ul class="mb-0">
              ${evaluation.keyFactors.map(factor => html`<li>${factor}</li>`)}
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Critical Issues -->
      ${evaluation.criticalIssues && evaluation.criticalIssues.length > 0 ? html`
        <div class="card border-danger mb-4">
          <div class="card-header bg-danger text-white">
            <i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Critical Issues</strong>
          </div>
          <div class="card-body">
            <ul class="mb-0 text-danger">
              ${evaluation.criticalIssues.map(issue => html`<li><strong>${issue}</strong></li>`)}
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Final Recommendations -->
      ${evaluation.recommendations && evaluation.recommendations.length > 0 ? html`
        <div class="card border-success">
          <div class="card-header bg-success text-white">
            <i class="bi bi-arrow-right-circle-fill me-2"></i><strong>Final Recommendations</strong>
          </div>
          <div class="card-body">
            <ul class="mb-0">
              ${evaluation.recommendations.map(rec => html`<li>${rec}</li>`)}
            </ul>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Render agent data as structured tables
function renderAgentData(data) {
  if (data.raw) {
    // Raw text response
    return html`<pre class="border p-3 rounded">${data.raw}</pre>`;
  }

  // Check if this is a final evaluation verdict
  if (data.verdict && data.confidenceScore !== undefined) {
    return renderFinalVerdict(data);
  }

  return html`
    <div class="agent-data-tables">
      ${data.summary ? html`
        <div class="mb-4">
          <h6 class="text-primary"><i class="bi bi-file-text me-2"></i>Summary</h6>
          <div class="card">
            <div class="card-body">
              ${unsafeHTML(marked.parse(data.summary))}
            </div>
          </div>
        </div>
      ` : ''}

      ${data.findings ? html`
        <div class="mb-4">
          <h6 class="text-primary"><i class="bi bi-search me-2"></i>Key Findings</h6>
          <div class="card">
            <div class="card-body">
              ${renderAsTable(data.findings, 'findings')}
            </div>
          </div>
        </div>
      ` : ''}

      ${data.recommendations ? html`
        <div class="mb-4">
          <h6 class="text-success"><i class="bi bi-lightbulb me-2"></i>Recommendations</h6>
          <div class="card border-success">
            <div class="card-body">
              ${renderAsTable(data.recommendations, 'recommendations')}
            </div>
          </div>
        </div>
      ` : ''}

      ${data.concerns ? html`
        <div class="mb-4">
          <h6 class="text-warning"><i class="bi bi-exclamation-triangle me-2"></i>Concerns</h6>
          <div class="card border-warning">
            <div class="card-body bg-warning bg-opacity-10">
              ${renderAsTable(data.concerns, 'concerns')}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Helper to render data as table or markdown
function renderAsTable(content, type) {
  if (!content) return '';

  // If content is a string, try to parse as markdown first
  if (typeof content === 'string') {
    // Check if it looks like a list or table
    if (content.includes('|') && content.includes('\n')) {
      // Looks like a markdown table, render as is
      return unsafeHTML(marked.parse(content));
    } else if (content.includes('\n-') || content.includes('\n*') || content.includes('\n1.')) {
      // Looks like a list, render as is
      return unsafeHTML(marked.parse(content));
    } else {
      // Plain text, render as paragraph
      return unsafeHTML(marked.parse(content));
    }
  }

  // If content is an object/array, try to render as table
  if (typeof content === 'object') {
    if (Array.isArray(content)) {
      if (content.length === 0) return html`<p class="text-muted">No data</p>`;

      // If array of objects, render as table
      if (typeof content[0] === 'object') {
        const keys = Object.keys(content[0]);
        return html`
          <div class="table-responsive">
            <table class="table table-sm table-hover">
              <thead class="table-light">
                <tr>
                  ${keys.map(key => html`<th>${key}</th>`)}
                </tr>
              </thead>
              <tbody>
                ${content.map(row => html`
                  <tr>
                    ${keys.map(key => html`<td>${renderValue(row[key])}</td>`)}
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `;
      } else {
        // Array of strings/primitives
        return html`
          <ul class="list-group list-group-flush">
            ${content.map(item => html`<li class="list-group-item">${item}</li>`)}
          </ul>
        `;
      }
    } else {
      // Single object, render as key-value table
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
  }

  return html`<p>${content}</p>`;
}

// Helper to render nested values properly
function renderValue(value) {
  if (value === null || value === undefined) {
    return html`<span class="text-muted">—</span>`;
  }

  if (typeof value === 'boolean') {
    return html`<span class="badge ${value ? 'bg-success' : 'bg-secondary'}">${value ? 'Yes' : 'No'}</span>`;
  }

  if (typeof value === 'number') {
    return html`<code>${value}</code>`;
  }

  if (typeof value === 'string') {
    // Display sentences directly without collapsing them
    // Only collapse very long text (> 500 chars) like paragraphs or documents
    if (value.length > 500) {
      return html`<details><summary>View (${value.length} chars)</summary><pre class="mt-2 p-2 border rounded">${value}</pre></details>`;
    }
    return html`<span>${value}</span>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return html`<span class="text-muted">[ ]</span>`;
    }
    // If array is small, show inline
    if (value.length <= 3 && value.every(v => typeof v !== 'object')) {
      return html`<code>[${value.join(', ')}]</code>`;
    }
    // Otherwise render as nested list
    return html`
      <details>
        <summary>${value.length} items</summary>
        <ul class="list-group list-group-flush mt-2">
          ${value.map(item => html`
            <li class="list-group-item">${renderValue(item)}</li>
          `)}
        </ul>
      </details>
    `;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return html`<span class="text-muted">{ }</span>`;
    }
    // Render as nested table
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

function renderTimeline(items) {
  const timeline = $("#progress-timeline");
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

function updateTimeline(title, description, index = null, completed = false, error = false, icon = null) {
  const timeline = $("#progress-timeline");
  const existingItems = Array.from(timeline.querySelectorAll(".timeline-item"));

  const items = existingItems.map((el, idx) => {
    const iconEl = el.querySelector("i");
    const h6El = el.querySelector("h6");
    const smallEl = el.querySelector("small");
    return {
      title: h6El ? h6El.textContent : el.querySelector("strong")?.textContent || '',
      description: smallEl ? smallEl.textContent : el.querySelector(".text-muted")?.textContent || '',
      icon: iconEl ? iconEl.className : null,
      completed: el.classList.contains("completed"),
      active: false,
    };
  });

  // Update or add item
  if (index !== null && index < items.length) {
    items[index] = { title, description, icon: icon || items[index].icon, completed, active: !completed && !error, error };
  } else {
    items.push({ title, description, icon, completed, active: !completed && !error, error });
  }

  renderTimeline(items);
}


function displayResults(results, plan = null, finalEvaluation = null) {
  $("#results-section").classList.remove("d-none");
  const resultsDiv = $("#results-output");

  render(
    html`
      ${finalEvaluation ? html`
        <div class="mb-5">
          <h3 class="text-center mb-4">
            <i class="bi bi-clipboard-check me-2"></i>Final Decision
          </h3>
          ${renderFinalVerdict(finalEvaluation)}
        </div>
      ` : ''}

      ${plan ? html`
        <div class="alert alert-info border-info mb-4">
          <div class="d-flex align-items-start">
            <i class="bi bi-diagram-3 display-5 me-3"></i>
            <div class="flex-grow-1">
              <h4 class="alert-heading mb-2">
                <i class="bi bi-diagram-3 me-2"></i>Orchestration Summary
              </h4>
              <p class="mb-2"><strong>Scenario:</strong> ${plan.scenario}</p>
              <p class="mb-2"><strong>Agents Executed:</strong> ${plan.agentPlan?.join(' → ') || 'N/A'}</p>
              <p class="mb-0"><strong>Outcome:</strong> ${plan.expectedOutcome}</p>
            </div>
          </div>
        </div>
      ` : ''}

      <h4 class="mt-5 mb-3">
        <i class="bi bi-person-workspace me-2"></i>Detailed Agent Reports
      </h4>
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

  // Scroll to results
  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

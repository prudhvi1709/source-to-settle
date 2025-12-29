// File Handling Module
import { html, render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { FILE_HANDLERS, getExtension, getFileIcon, formatFileSize } from "./config.js";

const loading = html`<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>`;

// State
let uploadedFiles = [];

// Get uploaded files
export function getUploadedFiles() {
  return uploadedFiles;
}

// Handle file selection/drop
export function handleFiles(files) {
  uploadedFiles = Array.from(files);
  renderFileList();
  return uploadedFiles.length > 0;
}

// Render file list
function renderFileList() {
  const fileList = document.querySelector("#file-list");
  const processBtn = document.querySelector("#process-btn");

  if (!fileList) return;

  if (uploadedFiles.length === 0) {
    fileList.innerHTML = "";
    if (processBtn) processBtn.disabled = true;
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

  if (processBtn) processBtn.disabled = false;
}

// Remove file from list
function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
}

// Preview file
export async function previewFile(file) {
  const preview = document.querySelector("#file-preview");
  if (!preview) return;

  render(html`<div class="text-center">${loading}</div>`, preview);

  const ext = getExtension(file.name);
  const handler = FILE_HANDLERS[ext];

  try {
    if (!handler) {
      render(html`<div class="alert alert-warning">Preview not available for this file type</div>`, preview);
      return;
    }

    const result = await handler.preview(file);

    // Render based on preview type
    if (result.type === 'pdf') {
      render(html`
        <div>
          <p class="text-muted mb-2">PDF Preview (Page 1 of ${result.numPages})</p>
          ${unsafeHTML(result.canvas.outerHTML)}
        </div>
      `, preview);
    } else if (result.type === 'excel') {
      render(html`
        <div>
          <p class="text-muted mb-2">Excel Preview (${result.sheetName})</p>
          <div class="table-responsive">${unsafeHTML(result.html)}</div>
        </div>
      `, preview);
    } else if (result.type === 'image') {
      render(html`<img src="${result.url}" class="img-fluid" alt="${file.name}">`, preview);
    } else if (result.type === 'word') {
      render(html`
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>Word document preview: ${result.name}
          <br><small>Text extraction will be performed during processing.</small>
        </div>
      `, preview);
    }
  } catch (e) {
    console.error("Preview error:", e);
    render(html`<div class="alert alert-danger">Error previewing file: ${e.message}</div>`, preview);
  }
}

// Extract text from file
export async function extractText(file) {
  const ext = getExtension(file.name);
  const handler = FILE_HANDLERS[ext];

  if (!handler) {
    return `[Unsupported file type: ${file.name}]`;
  }

  // Special handling for images (OCR check)
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    const ocrEnabled = document.querySelector("#ocr-enabled")?.checked || false;
    return await handler.extract(file, ocrEnabled);
  }

  return await handler.extract(file);
}

// Setup file input handlers
export function setupFileHandlers() {
  const fileInput = document.querySelector("#file-input");
  const uploadZone = document.querySelector("#file-upload-zone");

  if (!fileInput || !uploadZone) return;

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
    const hasFiles = handleFiles(e.dataTransfer.files);
    if (hasFiles && uploadedFiles.length > 0) {
      previewFile(uploadedFiles[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    const hasFiles = handleFiles(e.target.files);
    if (hasFiles && uploadedFiles.length > 0) {
      previewFile(uploadedFiles[0]);
    }
  });
}

// Load sample files
export async function loadSampleFiles(filePaths) {
  const fileList = document.querySelector("#file-list");
  const processBtn = document.querySelector("#process-btn");

  try {
    render(html`<div class="alert alert-info"><i class="bi bi-download me-2"></i>Loading sample files...</div>`, fileList);

    const filePromises = filePaths.map(async (path) => {
      const response = await fetch(path);
      const blob = await response.blob();
      const filename = path.split('/').pop();
      return new File([blob], filename, { type: blob.type });
    });

    uploadedFiles = await Promise.all(filePromises);
    renderFileList();
    if (processBtn) processBtn.disabled = false;

    if (uploadedFiles.length > 0) {
      await previewFile(uploadedFiles[0]);
    }

    return uploadedFiles.length;
  } catch (e) {
    console.error("Error loading sample files:", e);
    throw e;
  }
}

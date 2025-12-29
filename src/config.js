// Configuration Module
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";
import mammoth from "mammoth";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

// PDF.js standard fonts path
export const PDFJS_STANDARD_FONT_DATA_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/";

// Load configuration
let config;
try {
  config = await fetch("config.json").then((res) => res.json());
} catch (e) {
  console.error("Failed to load config.json:", e);
  config = { agents: [], demos: [] };
}

export { config };

// File type handlers configuration
export const FILE_HANDLERS = {
  pdf: {
    icon: "bi-file-pdf-fill text-danger",
    async preview(file) {
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
      return { type: 'pdf', numPages: pdf.numPages, canvas };
    },
    async extract(file) {
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
        return text;
      } catch (error) {
        return `[PDF extraction failed for ${file.name}: ${error.message}]`;
      }
    }
  },
  xlsx: {
    icon: "bi-file-excel-fill text-success",
    async preview(file) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const html_table = XLSX.utils.sheet_to_html(firstSheet, { header: 1 });
      return { type: 'excel', sheetName: workbook.SheetNames[0], html: html_table };
    },
    async extract(file) {
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
  },
  xls: { get icon() { return FILE_HANDLERS.xlsx.icon; }, get preview() { return FILE_HANDLERS.xlsx.preview; }, get extract() { return FILE_HANDLERS.xlsx.extract; } },
  csv: { get icon() { return FILE_HANDLERS.xlsx.icon; }, get preview() { return FILE_HANDLERS.xlsx.preview; }, get extract() { return FILE_HANDLERS.xlsx.extract; } },
  jpg: {
    icon: "bi-file-image-fill text-warning",
    async preview(file) {
      const url = URL.createObjectURL(file);
      return { type: 'image', url };
    },
    async extract(file, ocrEnabled) {
      if (ocrEnabled) {
        const { data: { text } } = await Tesseract.recognize(file, "eng", {
          logger: (m) => console.log(m),
        });
        return text;
      }
      return `[Image file: ${file.name}. OCR disabled.]`;
    }
  },
  jpeg: { get icon() { return FILE_HANDLERS.jpg.icon; }, get preview() { return FILE_HANDLERS.jpg.preview; }, get extract() { return FILE_HANDLERS.jpg.extract; } },
  png: { get icon() { return FILE_HANDLERS.jpg.icon; }, get preview() { return FILE_HANDLERS.jpg.preview; }, get extract() { return FILE_HANDLERS.jpg.extract; } },
  doc: {
    icon: "bi-file-word-fill text-primary",
    async preview(file) {
      return { type: 'word', name: file.name };
    },
    async extract(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || `[No text extracted from ${file.name}]`;
      } catch (error) {
        return `[Word Document: ${file.name}]\n\nNote: This document could not be automatically extracted.`;
      }
    }
  },
  docx: { get icon() { return FILE_HANDLERS.doc.icon; }, get preview() { return FILE_HANDLERS.doc.preview; }, get extract() { return FILE_HANDLERS.doc.extract; } }
};

// Helper to get file extension
export function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// Helper to get file icon
export function getFileIcon(filename) {
  const ext = getExtension(filename);
  return FILE_HANDLERS[ext]?.icon || "bi-file-earmark-fill";
}

// Helper to format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

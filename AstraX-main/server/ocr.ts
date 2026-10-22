import path from 'node:path';
import { createRequire } from 'node:module';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker } from 'tesseract.js';

export interface OcrResult {
  extractedText: string;
  confidence: number;
  keywords: string[];
  pageCount: number;
  processed: boolean;
}

const require = createRequire(path.join(process.cwd(), 'package.json'));
const englishLanguagePath = path.join(
  path.dirname(require.resolve('@tesseract.js-data/eng')),
  '4.0.0_best_int'
);

let ocrWorkerPromise: ReturnType<typeof createWorker> | undefined;
let workerIdleTimer: ReturnType<typeof setTimeout> | undefined;
let activeOcrRequests = 0;

function getOcrWorker(): ReturnType<typeof createWorker> {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker('eng', 1, {
      langPath: englishLanguagePath,
      cachePath: englishLanguagePath,
    });
    ocrWorkerPromise.catch(() => {
      ocrWorkerPromise = undefined;
    });
  }
  return ocrWorkerPromise;
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const frequency: Record<string, number> = {};

  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  return Object.keys(frequency)
    .sort((a, b) => frequency[b] - frequency[a])
    .slice(0, 10);
}

async function recognizeImage(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  if (workerIdleTimer) {
    clearTimeout(workerIdleTimer);
    workerIdleTimer = undefined;
  }

  const worker = await getOcrWorker();
  activeOcrRequests++;
  try {
    const { data } = await worker.recognize(buffer);
    return { text: data.text.trim(), confidence: data.confidence };
  } finally {
    activeOcrRequests--;
    if (activeOcrRequests === 0) {
      const currentWorkerPromise = ocrWorkerPromise;
      workerIdleTimer = setTimeout(() => {
        if (activeOcrRequests === 0 && currentWorkerPromise === ocrWorkerPromise) {
          ocrWorkerPromise = undefined;
          void currentWorkerPromise?.then((idleWorker) => idleWorker.terminate()).catch((error) => {
            console.error('Failed to stop idle OCR worker:', error);
          });
        }
      }, 30_000);
      workerIdleTimer.unref();
    }
  }
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; confidence: number; pageCount: number }> {
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: string[] = [];
  const confidences: number[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const embeddedText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      if (embeddedText.length < 80) {
        const initialViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 3000 / Math.max(initialViewport.width, initialViewport.height));
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({
          canvas: null,
          canvasContext: canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
          viewport,
          background: '#ffffff',
        }).promise;
        const result = await recognizeImage(canvas.toBuffer('image/png'));
        confidences.push(result.confidence);
        const embeddedTextNormalized = embeddedText.toLowerCase();
        const recognizedTextNormalized = result.text.toLowerCase();
        const pageText = embeddedTextNormalized.includes(recognizedTextNormalized)
          ? embeddedText
          : recognizedTextNormalized.includes(embeddedTextNormalized)
            ? result.text
            : [embeddedText, result.text].filter(Boolean).join('\n');
        pages.push(pageText);
      } else {
        pages.push(embeddedText);
      }

      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  return {
    text: pages.filter(Boolean).join('\n\n'),
    confidence: confidences.length
      ? confidences.reduce((total, confidence) => total + confidence, 0) / confidences.length / 100
      : 1,
    pageCount,
  };
}

/**
 * Extract searchable text from PDFs, scanned images, and plain-text documents.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<OcrResult> {
  const ext = path.extname(filename).toLowerCase();
  let extractedText = '';
  let confidence = 0;
  let pageCount = 1;
  let processed = false;

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    const result = await extractPdfText(buffer);
    extractedText = result.text;
    confidence = result.confidence;
    pageCount = result.pageCount;
    processed = true;
  } else if (['.jpg', '.jpeg', '.png'].includes(ext) || mimeType.startsWith('image/')) {
    const result = await recognizeImage(buffer);
    extractedText = result.text;
    confidence = result.confidence / 100;
    processed = true;
  } else if (ext === '.txt' || mimeType === 'text/plain') {
    extractedText = buffer.toString('utf-8').replace(/\0/g, '').trim();
    confidence = extractedText ? 1 : 0;
    processed = true;
  }

  return {
    extractedText,
    confidence,
    keywords: extractKeywords(extractedText),
    pageCount,
    processed,
  };
}

import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

function toPdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7E\n\r\t]/g, (character) => {
      const replacements: Record<string, string> = {
        '•': '*',
        '—': '-',
        '–': '-',
        '§': 'Section ',
        '“': '"',
        '”': '"',
        '’': "'",
        '‘': "'",
      };
      return replacements[character] ?? '?';
    });
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const sourceLine of toPdfText(text).split(/\r?\n/)) {
    let line = '';
    for (const word of sourceLine.split(/\s+/)) {
      if (!word) continue;
      const candidate = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

function writeTextPages(
  pdf: PDFDocument,
  content: string,
  font: PDFFont,
  options: { heading?: string; topMargin?: number; headerLines?: string[] } = {},
): PDFPage[] {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const fontSize = 11;
  const lineHeight = 16;
  const lines = wrapText(content, font, fontSize, pageWidth - margin * 2);
  const pages: PDFPage[] = [];
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - (options.topMargin ?? margin);
  pages.push(page);

  if (options.heading) {
    page.drawText(toPdfText(options.heading), {
      x: margin,
      y,
      size: 16,
      font,
      color: rgb(0.08, 0.16, 0.3),
    });
    y -= 34;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.75, 0.8, 0.88),
    });
    y -= 28;
  }

  for (const headerLine of options.headerLines ?? []) {
    for (const line of wrapText(headerLine, font, 8, pageWidth - margin * 2)) {
      if (y < margin) {
        page = pdf.addPage([pageWidth, pageHeight]);
        pages.push(page);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: 8,
        font,
        color: rgb(0.25, 0.3, 0.4),
      });
      y -= 11;
    }
  }
  if (options.headerLines?.length) y -= 12;

  for (const line of lines) {
    if (y < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      pages.push(page);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font });
    y -= lineHeight;
  }

  return pages;
}

async function loadExistingPdf(source: Buffer): Promise<PDFDocument | null> {
  if (source.subarray(0, 5).toString('ascii') !== '%PDF-') return null;

  try {
    const pdf = await PDFDocument.load(source);
    return pdf.getPageCount() > 0 ? pdf : null;
  } catch {
    return null;
  }
}

function getSourceText(source: Buffer, fallbackText: string): string {
  const decoded = source
    .toString('utf8')
    .replace(/\0/g, '')
    .replace(/^\uFEFF/, '')
    .replace(/^%PDF-[^\r\n]*(?:\r?\n|$)/, '')
    .trim();

  if (!decoded) return fallbackText;
  const printableCharacters = decoded.match(/[\x09\x0A\x0D\x20-\x7E]/g)?.length ?? 0;
  if (printableCharacters / decoded.length < 0.9) return fallbackText;
  return decoded;
}

export async function createWatermarkedPdf(
  source: Buffer | null,
  fallbackText: string,
  watermarkText: string,
  metadataLines: string[],
  sha256Hash: string,
  heading = 'WATERMARKED EVIDENTIARY COPY',
): Promise<Buffer> {
  const sourcePdf = source ? await loadExistingPdf(source) : null;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let contentPages: PDFPage[];
  if (sourcePdf) {
    contentPages = await pdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    contentPages.forEach((page) => pdf.addPage(page));
  } else {
    contentPages = writeTextPages(pdf, source ? getSourceText(source, fallbackText) : fallbackText, font, {
      heading,
      headerLines: metadataLines,
    });
  }

  for (const page of contentPages) {
    const { width, height } = page.getSize();
    page.drawText(toPdfText(watermarkText), {
      x: Math.max(36, width * 0.16),
      y: height * 0.45,
      size: 24,
      font,
      color: rgb(0.78, 0.81, 0.87),
      opacity: 0.18,
      rotate: degrees(-35),
    });

    const footer = `VERIFIED SHA-256: ${sha256Hash}`;
    page.drawText(footer, {
      x: 36,
      y: 18,
      size: 7,
      font,
      color: rgb(0.25, 0.3, 0.4),
    });
  }

  pdf.setTitle(heading);
  return Buffer.from(await pdf.save());
}

/**
 * Text extraction helpers for PDF, DOCX, and OCR fallback.
 * Dependencies: pdf-parse, mammoth, tesseract.js
 */
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const res = await pdfParse(buffer);
  return res.text || '';
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || '';
}

export async function tryOCR(buffer: Buffer): Promise<string> {
  // NOTE: OCR can be slow. Ensure worker has appropriate CPU/memory.
  // TODO: Configure language packs if needed.
  const { data } = await Tesseract.recognize(buffer, 'eng');
  return data.text || '';
}

export async function extractTextFromFile(fileBuffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) {
    const text = await extractTextFromPdf(fileBuffer);
    if (text.trim().length > 0) return text;
    return tryOCR(fileBuffer);
  }
  if (lower.endsWith('.docx')) {
    return extractTextFromDocx(fileBuffer);
  }
  // Fallback: treat as plain text
  return fileBuffer.toString('utf-8');
}



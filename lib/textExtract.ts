/**
 * Text extraction helpers for PDF, DOCX, and OCR fallback.
 * Dependencies: pdf-parse, mammoth, tesseract.js
 */
import pdfParse from 'pdf-parse';
//import mammoth from 'mammoth';
//import Tesseract from 'tesseract.js';


// --- Create a single, reusable OCR worker for performance ---
//const ocrWorker = Tesseract.createWorker('eng', 1, {
//  logger: m => console.log(m) // Optional: for debugging OCR progress
//});
// Ensure the worker is terminated gracefully on shutdown
//process.on('exit', () => {
//  ocrWorker.then(worker => worker.terminate());
//  console.log('Tesseract worker terminated.');
//});


export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return  data.text || '';
}

/*export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || '';
}

export async function tryOCR(buffer: Buffer): Promise<string> {
  const worker = await ocrWorker;
  const { data } = await worker.recognize(buffer);
  return data.text || '';
}*/


// --- Main Orchestrator Function ---

export async function extractTextFromFile(fileBuffer: Buffer, filename: string): Promise<string> {
  try {
    const lower = filename.toLowerCase();
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff'];

    // Route image files directly to OCR
    if (imageExtensions.some(ext => lower.endsWith(ext))) {
      console.log(`Image file detected. Sending to OCR: ${filename}`);
      //return await tryOCR(fileBuffer);
    }

    // Handle PDF, with OCR as a fallback for scanned/image-based PDFs
    if (lower.endsWith('.pdf')) {
      console.log(`PDF file detected. Extracting text: ${filename}`);
      const text = await extractTextFromPdf(fileBuffer);
      //If direct extraction yields little text, it's likely a scan. Try OCR.
      if (text.trim().length > 5) {
        return text;
      }
      console.log(`PDF text is empty. Attempting OCR fallback: ${filename}`);
      //return await tryOCR(fileBuffer);
    }

    // Handle DOCX
    if (lower.endsWith('.docx')) {
      console.log(`DOCX file detected. Extracting text: ${filename}`);
      //return await extractTextFromDocx(fileBuffer);
    }
    
    // For other files, like .txt, try a simple string conversion.
    // Avoid this for binary formats.
    console.log(`Unknown text-based file detected. Trying simple conversion: ${filename}`);
    return fileBuffer.toString('utf-8');

  } catch (err) {
    console.error(`Failed to extract text from ${filename}:`, err);
    // As a final fallback on any error, try OCR. It might be an image with a wrong extension.
    try {
        console.log(`Extraction failed. Attempting final OCR fallback for ${filename}`);
        //return await tryOCR(fileBuffer);
        return '';
    } catch (ocrErr) {
        console.error(`Final OCR fallback also failed for ${filename}:`, ocrErr);
        return '';
    }
  }
}
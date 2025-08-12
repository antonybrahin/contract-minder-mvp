import { promises } from 'dns';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

async function testPdfParse(): Promise<string> {
  try {
    console.log('Testing pdf-parse...');
    const pdfPath = path.resolve(process.cwd(), 'dummy.pdf');
    const pdfBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(pdfBuffer);
    console.log('✅ pdf-parse works! Text length:', data.text.length);
    return data.text || '';
  } catch (error) {
    console.error('❌ pdf-parse failed:', error);
    return '';
  }
}

testPdfParse();
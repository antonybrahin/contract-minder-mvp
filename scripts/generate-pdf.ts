/**
 * Simple server-side PDF generation using Puppeteer.
 * SECURITY: Run server-side only. Requires Chromium; Puppeteer will download on install.
 * TODO: Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */
import puppeteer from 'puppeteer';
import { supabaseServer } from '@/lib/supabaseServer';
import path from 'node:path';
import dotenv from 'dotenv';

// Load env when script is run standalone
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export async function createReportPdf(contract: { id: string; title: string; risk_summary: unknown }) {
  const risks = (contract.risk_summary as any[]) ?? [];
  const html = `<!doctype html>
  <html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 8px; }
  .risk { margin-bottom: 12px; }
  .tag { display:inline-block; font-size:12px; padding:2px 6px; border-radius:4px; color:#fff }
  .HIGH{ background:#dc2626 } .MEDIUM{ background:#f59e0b } .LOW{ background:#16a34a }
  </style></head><body>
  <h1>Contract Risk Report: ${escapeHtml(contract.title)}</h1>
  <div>
    ${risks
      .map(
        (r) => `<div class="risk">
          <div><strong>${escapeHtml(r.clause_title || '')}</strong> <span class="tag ${r.risk_level}">${r.risk_level}</span></div>
          <div>${escapeHtml(r.summary || '')}</div>
        </div>`
      )
      .join('')}
  </div>
  </body></html>`;

  const browser = await puppeteer.launch({ headless: 'new' as any });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  const path = `reports/${contract.id}_${Date.now()}.pdf`;
  const { error } = await supabaseServer.storage.from('contracts').upload(path, pdfBuffer, { contentType: 'application/pdf' });
  if (error) throw error;
  const { data: signed } = await supabaseServer.storage.from('contracts').createSignedUrl(path, 60 * 10);
  return signed?.signedUrl as string;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// CLI support
if (require.main === module) {
  // This CLI is for manual testing; expects CONTRACT_ID env.
  const contractId = process.env.CONTRACT_ID; // TODO: provide contract id
  if (!contractId) {
    console.error('Set CONTRACT_ID to generate a report for an existing contract');
    process.exit(1);
  }
  (async () => {
    const { data, error } = await supabaseServer.from('contracts').select('*').eq('id', contractId).single();
    if (error || !data) throw error;
    const url = await createReportPdf(data as any);
    console.log(url);
  })();
}



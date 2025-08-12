import { NextRequest, NextResponse } from 'next/server';
import { downloadFile, updateRow, supabaseServer } from '@/lib/supabaseServer';
import { extractTextFromFile } from '@/lib/textExtract';
import { analyzeContractText, chunkText } from '@/lib/ai';
import fs from 'fs/promises'
export const config = {
  runtime: 'nodejs', // important: disables edge runtime
};
// SECURITY: This route is intended for internal use (e.g., worker or admin). Consider protecting with a secret header.
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET; // TODO: set and verify in middleware or here.

export async function POST(req: NextRequest) {
   console.log('POST /api/process handler reached');
  try {
    // Optional secret check
    if (INTERNAL_SECRET) {
      const provided = req.headers.get('x-internal-secret');
      if (provided !== INTERNAL_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { contractId } = body as { contractId: string };
    if (!contractId) {
      return NextResponse.json({ error: 'contractId required' }, { status: 400 });
    }

    const { data: contract, error } = await supabaseServer.from('contracts').select('*').eq('id', contractId).single();

    if (error || !contract) {
      return NextResponse.json({ error: 'Contract not found', details: { error, contractId, contract } }, { status: 404 });
    }

    const filePath = contract.file_path as string;
    const buffer = await downloadFile(filePath);
    const text = await extractTextFromFile(buffer, filePath);
    const chunks = chunkText(text);
    const riskItems = await analyzeContractText(contractId, chunks);

    await updateRow('contracts', contractId, {
      status: 'reviewed',
      risk_summary: riskItems
    } as unknown as Record<string, unknown>);

    return NextResponse.json({ ok: true, count: riskItems.length });
    //return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('POST /api/process error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
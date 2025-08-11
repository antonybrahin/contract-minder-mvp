import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createReportPdf } from '@/scripts/generate-pdf';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const contractId = form.get('contractId')?.toString();
    if (!contractId) return NextResponse.json({ error: 'contractId required' }, { status: 400 });

    const { data: contract, error } = await supabaseServer.from('contracts').select('*').eq('id', contractId).single();
    if (error || !contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const url = await createReportPdf(contract);
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}



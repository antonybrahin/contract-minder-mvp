import { NextRequest, NextResponse } from 'next/server';
import { insertRow } from '@/lib/supabaseServer';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// TODO: Configure Redis connection for BullMQ worker/queue
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, { lazyConnect: true });
const queue = new Queue('contracts-processing', { connection });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, title, industry } = body as { filePath: string; title: string; industry?: string };
    if (!filePath || !title) {
      return NextResponse.json({ error: 'filePath and title are required' }, { status: 400 });
    }

    // SECURITY: use server-side supabase with service role to insert
    const contract = await insertRow('contracts', {
      title,
      industry: industry ?? null,
      file_path: filePath,
      status: 'queued',
      risk_summary: null,
      user_id: null // TODO: set from session/user once auth is wired
    });

    await insertRow('contract_versions', {
      contract_id: (contract as unknown as { id: string }).id,
      version_number: 1,
      file_path: filePath
    });

    await queue.add(
      'process',
      { contractId: (contract as unknown as { id: string }).id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );

    return NextResponse.json({ id: (contract as unknown as { id: string }).id });
  } catch (error: unknown) {
    console.error('POST /api/contracts error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



import { Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import path from 'node:path';
import dotenv from 'dotenv';

// Load env from .env.local for non-Next runtime (worker)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// TODO: Configure envs
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000/api/process';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });

async function handleJob(job: Job<{ contractId: string }>) {
  const { updateRow } = await import('../lib/supabaseServer');
  const { contractId } = job.data;
  try {
    await updateRow('contracts', contractId, { status: 'processing' } as unknown as Record<string, unknown>);
    // In a real system, we would look up filePath from DB. For simplicity, allow passing filePath in job or fetch from DB if needed.
    // TODO: Fetch filePath from DB when schema is fully defined.
    await axios.post(INTERNAL_API_URL, { contractId }, { headers: INTERNAL_API_SECRET ? { 'x-internal-secret': INTERNAL_API_SECRET } : {} });
    await updateRow('contracts', contractId, { status: 'reviewed' } as unknown as Record<string, unknown>);
  } catch (err: unknown) {
    await updateRow('contracts', contractId, { status: 'error' } as unknown as Record<string, unknown>);
    throw err;
  }
}

const worker = new Worker('contracts-processing', handleJob, { connection, concurrency: 3 });
const events = new QueueEvents('contracts-processing', { connection });

events.on('completed', ({ jobId }) => {
  console.log(`Job ${jobId} completed`);
});

events.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed: ${failedReason}`);
});

console.log('Process worker started. Waiting for jobs...');



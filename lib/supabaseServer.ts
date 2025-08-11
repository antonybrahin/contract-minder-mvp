/**
 * Server-only Supabase client utilities.
 * SECURITY: Reads `SUPABASE_SERVICE_ROLE_KEY` and must never be used in the browser.
 * TODO: Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in your environment.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string; // TODO: set in .env.local
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string; // TODO: set in .env.local (server-only)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Do not throw at import-time in Next.js; instead warn to avoid SSR crash in dev.
  console.warn('Supabase server env not fully configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabaseServer = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY ?? '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type StoragePath = string;

/**
 * downloadFile downloads a file from Supabase Storage into a Buffer.
 * Uses service role key to ensure server-side access. Do not expose this in client code.
 */
export async function downloadFile(bucketPath: StoragePath): Promise<Buffer> {
  const [bucket, ...pathParts] = bucketPath.split('/');
  const path = pathParts.join('/');
  const { data, error } = await supabaseServer.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message ?? 'unknown error'}`);
  }
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * getSignedUrl creates a short-lived signed URL for a storage object.
 * SECURITY: Return signed URLs to clients instead of raw paths.
 */
export async function getSignedUrl(bucketPath: StoragePath, expiresInSeconds = 60 * 10): Promise<string> {
  const [bucket, ...pathParts] = bucketPath.split('/');
  const path = pathParts.join('/');
  const { data, error } = await supabaseServer.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown error'}`);
  }
  return data.signedUrl;
}

/**
 * insertRow helper to insert into any table with service role. Use cautiously.
 */
export async function insertRow<T extends object>(table: string, row: T) {
  const { data, error } = await supabaseServer.from(table).insert(row).select('*').single();
  if (error) throw error;
  return data as unknown as T & { id: string };
}

/**
 * updateRow helper to update a table by id.
 */
export async function updateRow<T extends object>(table: string, id: string, patch: Partial<T>) {
  const { data, error } = await supabaseServer.from(table).update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as unknown as T & { id: string };
}

/**
 * queryRows generic select by filters.
 */
export async function queryRows<T = unknown>(table: string, filters?: Record<string, unknown>) {
  let query = supabaseServer.from(table).select('*');
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value as never);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
}



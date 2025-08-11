/**
 * Minimal integration-like test for /api/contracts route.
 * Mocks Supabase insert and BullMQ queue interactions.
 */
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

jest.mock('bullmq', () => ({ Queue: jest.fn().mockImplementation(() => ({ add: jest.fn() })) }));
jest.mock('@/lib/supabaseServer', () => ({ insertRow: jest.fn(async (_t: string, row: any) => ({ id: 'test-id', ...row })) }));

import { POST } from '@/app/api/contracts/route';

describe('/api/contracts POST', () => {
  it('returns contract id when provided valid payload', async () => {
    const req = { json: async () => ({ filePath: 'contracts/test.pdf', title: 'Test', industry: 'general' }) } as any;
    const res: any = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.id).toBe('test-id');
  });
});



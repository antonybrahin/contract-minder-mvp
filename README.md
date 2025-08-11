# Contract Minder MVP

Next.js 14 + TypeScript + Tailwind + Supabase + BullMQ + OpenAI (GPT-5) starter for contract risk analysis.

## Prerequisites
- Node 18+
- pnpm (recommended) or npm
- Supabase project (Postgres + Storage)
- Redis (for BullMQ)

## Setup
1) Create a Supabase project
   - Note the `Project URL` and `API Keys` (anon and service role)
   - Create a storage bucket named `contracts` (public/private as you prefer; app uses signed URLs)

2) Configure environment variables (create `.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE
OPENAI_API_KEY=YOUR_OPENAI_KEY
REDIS_URL=redis://localhost:6379
INTERNAL_API_SECRET=some-secret
INTERNAL_API_URL=http://localhost:3000/api/process
```

3) Run migrations (create tables)
   - Open Supabase SQL editor and run `migrations/001_init.sql` contents.

4) Install dependencies
```
pnpm install
```

5) Start dev server
```
pnpm dev
```

6) Start worker (separate terminal)
```
pnpm run worker
```

7) Optional: Generate a PDF report for a contract
```
CONTRACT_ID=<uuid> pnpm run gen:pdf
```

## Notes
- Security: Server routes use `SUPABASE_SERVICE_ROLE_KEY` and must never be exposed client-side. Client uses anon key only.
- Downloads: Always use signed URLs (`lib/supabaseServer.getSignedUrl`).
- AI: Ensure `OPENAI_API_KEY` is set. Model name `gpt-5` may differ in your provider.
- Queue: `/api/contracts` enqueues a job; the worker calls `/api/process` then updates status.

## Tests
```
pnpm test
```

## Minimal sanity tests
- Upload a file on `/` via the uploader. Check Supabase storage bucket for the uploaded object.
- Verify an entry appears on `/dashboard` with status `queued` -> `processing` -> `reviewed`.
- Open a contract detail page and ensure the signed URL iframe renders.



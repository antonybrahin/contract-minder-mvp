-- TODO: Replace this with the exact SQL provided by the user when available.
-- Basic schema to support MVP functionality.

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text not null,
  industry text null,
  file_path text not null,
  status text not null default 'queued',
  risk_summary jsonb null,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version_number int not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_contracts_user on public.contracts(user_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_versions_contract on public.contract_versions(contract_id);



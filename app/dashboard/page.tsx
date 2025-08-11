import { supabaseServer } from '@/lib/supabaseServer';
import ContractList from '@/components/ContractList';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // TODO: fetch by user session when auth wired. For now, fetch recent contracts.
  const { data } = await supabaseServer.from('contracts').select('*').order('created_at', { ascending: false }).limit(20);
  const contracts = data ?? [];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ContractList contracts={contracts as unknown as any[]} />
    </div>
  );
}



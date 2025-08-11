import Link from 'next/link';

type Contract = {
  id: string;
  title: string;
  status: 'queued' | 'processing' | 'reviewed' | 'error';
  risk_summary: Array<{ risk_level: 'LOW' | 'MEDIUM' | 'HIGH' }>; // simplified
  created_at?: string;
};

function SeverityDot({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const color = level === 'HIGH' ? 'bg-severity-high' : level === 'MEDIUM' ? 'bg-severity-medium' : 'bg-severity-low';
  return <span className={`inline-block w-3 h-3 rounded-full ${color}`} />;
}

export default function ContractList({ contracts }: { contracts: Contract[] }) {
  return (
    <div className="border rounded">
      <div className="grid grid-cols-4 gap-2 p-3 border-b text-sm font-medium text-gray-600">
        <div>Title</div>
        <div>Status</div>
        <div>Top Severity</div>
        <div>Actions</div>
      </div>
      <div>
        {contracts.map((c) => {
          const top = c.risk_summary?.find((_) => true)?.risk_level ?? 'LOW';
          return (
            <div key={c.id} className="grid grid-cols-4 gap-2 p-3 border-b items-center">
              <div className="truncate">{c.title}</div>
              <div className="capitalize">{c.status}</div>
              <div className="flex items-center gap-2">
                <SeverityDot level={top as 'LOW' | 'MEDIUM' | 'HIGH'} />
                <span className="text-sm">{top}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <Link href={`/contracts/${c.id}`} className="text-blue-600 hover:underline">
                  View
                </Link>
                {/* TODO: Add more actions */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



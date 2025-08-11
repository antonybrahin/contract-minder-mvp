import React from 'react';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSignedUrl } from '@/lib/supabaseServer';

type PageProps = { params: { id: string } };

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = params;
  const { data: contract } = await supabaseServer.from('contracts').select('*').eq('id', id).single();
  if (!contract) return <div className="p-6">Not found</div>;

  const filePath = contract.file_path as string;
  let signedUrl: string | null = null;
  try {
    signedUrl = await getSignedUrl(filePath, 60 * 5);
  } catch {
    signedUrl = null;
  }

  const risks: Array<{ clause_title: string; risk_level: 'LOW'|'MEDIUM'|'HIGH'; summary: string; start_index: number; end_index: number }>
    = (contract.risk_summary ?? []) as any;

  return (
    <div className="grid grid-cols-12 gap-4 p-6 h-[calc(100vh-80px)]">
      <div className="col-span-7 border rounded overflow-hidden">
        {/* Minimal PDF viewer using iframe for signed URL. For advanced, integrate pdf.js later. */}
        {signedUrl ? (
          <iframe src={signedUrl} className="w-full h-full" />
        ) : (
          <div className="p-4 text-sm text-gray-600">Unable to generate signed URL for document.</div>
        )}
      </div>
      <div className="col-span-5 border rounded p-4 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Risk Items</h2>
          <form action="/api/generate-report" method="post">
            <input type="hidden" name="contractId" value={id} />
            <button className="px-3 py-1 border rounded text-sm">Download Report</button>
          </form>
        </div>
        <div className="space-y-3">
          {risks.length === 0 && <div className="text-sm text-gray-600">No risks found yet or processing.</div>}
          {risks.map((r, idx) => (
            <details key={idx} className="border rounded p-2">
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-medium">{r.clause_title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${r.risk_level === 'HIGH' ? 'bg-severity-high text-white' : r.risk_level === 'MEDIUM' ? 'bg-severity-medium text-white' : 'bg-severity-low text-white'}`}>{r.risk_level}</span>
              </summary>
              <div className="mt-2 text-sm whitespace-pre-wrap">
                <div className="text-gray-700 mb-2">{r.summary}</div>
                <div className="text-gray-500">Range: {r.start_index}–{r.end_index}</div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}



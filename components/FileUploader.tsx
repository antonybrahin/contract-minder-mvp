"use client";
import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

// TODO: Provide your Supabase anon key and URL via env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Props = {
  onUploaded?: (payload: { filePath: string; title: string; industry?: string }) => void;
};

export default function FileUploader({ onUploaded }: Props) {
  const [industry, setIndustry] = useState<string>('general');
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(5);

    const path = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('contracts').upload(path, file, {
      upsert: false
    });
    if (error) {
      console.error(error);
      setUploading(false);
      return;
    }
    setProgress(60);

    const filePath = `contracts/${data.path}`;
    const title = file.name;
    // Optimistically add to dashboard by invoking API
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, title, industry })
    });
    if (!res.ok) {
      console.error('Failed to create contract');
    }
    setProgress(100);
    setUploading(false);
    onUploaded?.({ filePath, title, industry });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Industry pack</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="general">General</option>
          <option value="saas">SaaS</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
        </select>
      </div>

      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload} />

      {uploading && (
        <div className="w-full bg-gray-200 rounded h-2">
          <div className="bg-blue-600 h-2 rounded" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}



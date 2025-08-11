import FileUploader from '@/components/FileUploader';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-gray-700">Upload a contract to begin analysis.</p>
      <FileUploader />
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">Go to Dashboard</Link>
    </div>
  );
}



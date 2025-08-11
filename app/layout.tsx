import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Contract Minder MVP',
  description: 'Review and analyze contracts with AI',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-7xl mx-auto">
          <header className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Contract Minder</h1>
              <nav className="text-sm text-gray-600">MVP</nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}



import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children, activePage, setActivePage }: { children: ReactNode, activePage: string, setActivePage: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6 shadow-sm">
          <h1 className="text-lg font-semibold capitalize mr-auto text-slate-800 tracking-tight">{activePage.replace('-', ' ')}</h1>
        </header>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

import { headers } from 'next/headers'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-orange-100">
      {/* 
        This is a wrapper layout for the entire admin section.
        We could hook up a Sidebar or a Navbar here later.
      */}
      <main className="font-sans text-slate-800">
        {children}
      </main>
    </div>
  )
}
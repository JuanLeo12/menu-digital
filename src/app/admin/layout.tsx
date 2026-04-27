// Removed unused imports

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black selection:bg-orange-500/30">
      <main className="font-sans text-gray-200">
        {children}
      </main>
    </div>
  )
}

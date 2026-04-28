"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, User } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Credenciales incorrectas")
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-950 via-red-950 to-black overflow-hidden relative">
      {/* Fondo de fuego decorativo */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-linear-to-br from-red-600/40 via-orange-500/20 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-linear-to-tl from-yellow-500/40 via-red-600/20 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="bg-zinc-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] w-full max-w-md border border-orange-500/20 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-linear-to-br from-red-600 via-orange-500 to-yellow-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] border-4 border-yellow-500">
            <span className="text-4xl">🍗</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-center bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-6">
          Pollería Admin
        </h1>
        
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-orange-100 mb-2">Correo Electrónico</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-orange-900/50 text-white rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-zinc-600 font-medium"
                placeholder="admin@elpollobravo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-orange-100 mb-2">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-orange-900/50 text-white rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-zinc-600 font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-linear-to-r from-red-600 via-orange-500 to-yellow-500 text-white rounded-xl py-3.5 font-bold shadow-lg hover:shadow-orange-500/25 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-8 active:scale-[0.98]"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}




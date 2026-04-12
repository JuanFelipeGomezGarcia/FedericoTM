'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, LogOut, Shield, Eye, EyeOff, LayoutDashboard, Home } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('admin-token')
    if (token) setIsLoggedIn(true)
    setChecking(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('admin-token', data.token)
        setIsLoggedIn(true)
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-token')
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-cyan-500/30 mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Federico TM</h1>
            <p className="text-muted-foreground text-sm mt-1">Panel de Administración</p>
          </div>

          {/* Card */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-foreground">Acceso Administrador</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="admin"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors inline-flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground">Federico TM</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 ml-4">
              <Link href="/" className={pathname === '/' ? 'nav-link-active' : 'nav-link'}>
                <Home className="w-4 h-4" />
                Inicio
              </Link>
              <Link href="/admin" className={pathname === '/admin' ? 'nav-link-active' : 'nav-link'}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-muted-foreground">Administrador</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}

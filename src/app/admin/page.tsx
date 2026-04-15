'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Trophy, Plus, Calendar, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react'

interface Tournament {
  id: number
  name: string
  date: string
  status: string
}

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tournaments')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTournaments(data)
      } else {
        setError('Error al cargar torneos')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, date: newDate }),
      })
      if (res.ok) {
        setNewName('')
        setNewDate('')
        fetchTournaments()
      } else {
        alert('Error al crear el torneo')
      }
    } catch (err) {
      alert('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este torneo?')) return

    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTournaments()
      } else {
        alert('Error al eliminar')
      }
    } catch (err) {
      alert('Error de conexión')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">Gestión de Torneos</h1>
            <p className="text-muted-foreground">Administra los campeonatos y resultados en tiempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchTournaments()}
              className="p-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
              title="Actualizar"
            >
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin text-cyan-500' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Tournament Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Nuevo Torneo</h2>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nombre del Torneo</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-field"
                    placeholder="Ej: Open Bucaramanga 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="btn-primary w-full mt-2 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? 'Creando...' : 'Crear Torneo'}
                </button>
              </form>
            </div>
          </div>

          {/* tournaments List */}
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {loading && tournaments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 glass-card">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                <p className="text-muted-foreground animate-pulse">Cargando torneos...</p>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 glass-card border-dashed">
                <Trophy className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-center">No hay torneos registrados.<br/>Comienza creando uno nuevo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tournaments.map((t) => (
                  <div key={t.id} className="glass-card p-5 group hover:border-cyan-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Trophy className={`w-6 h-6 ${t.status === 'En curso' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground truncate">{t.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${
                              t.status === 'En curso' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.location.href = `/tournament/${t.id}`}
                          className="p-2 rounded-lg hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 transition-colors"
                          title="Gestionar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import {
  Trophy, Plus, Trash2, Calendar, ChevronRight, Users,
  ArrowRight, X, Check, AlertCircle, Layers
} from 'lucide-react'

interface Tournament {
  id: number
  name: string
  date: string
  status: string
}

interface CategoryDraft {
  name: string
  players: string
  players_per_group: string
  qualified_per_group: string
}

type Step = 'list' | 'new-tournament' | 'add-categories'

export default function AdminPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('list')
  const [newTournament, setNewTournament] = useState({ name: '', date: '' })
  const [createdTournamentId, setCreatedTournamentId] = useState<number | null>(null)
  const [createdTournamentName, setCreatedTournamentName] = useState('')
  const [categories, setCategories] = useState<CategoryDraft[]>([])
  const [currentCategory, setCurrentCategory] = useState<CategoryDraft>({
    name: '', players: '', players_per_group: '4', qualified_per_group: '2'
  })
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)
  const [creatingTournament, setCreatingTournament] = useState(false)
  const [finalizingTournament, setFinalizingTournament] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { fetchTournaments() }, [])

  const fetchTournaments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tournaments')
      const data = await res.json()
      setTournaments(data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingTournament(true)
    setFormError('')
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTournament),
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedTournamentId(data.id)
        setCreatedTournamentName(data.name)
        setStep('add-categories')
      } else {
        setFormError('Error al crear el torneo')
      }
    } finally {
      setCreatingTournament(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createdTournamentId) return
    setSavingCategory(true)
    setFormError('')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: createdTournamentId,
          name: currentCategory.name,
          players: currentCategory.players,
          players_per_group: parseInt(currentCategory.players_per_group),
          qualified_per_group: parseInt(currentCategory.qualified_per_group),
        }),
      })
      if (res.ok) {
        setCategories(prev => [...prev, currentCategory])
        setCurrentCategory({ name: '', players: '', players_per_group: '4', qualified_per_group: '2' })
      } else {
        const err = await res.json()
        setFormError(err.error || 'Error al crear la categoría')
      }
    } finally {
      setSavingCategory(false)
    }
  }

  const handleFinalizeTournament = async () => {
    if (!createdTournamentId || categories.length === 0) return
    setFinalizingTournament(true)
    // Tournament is already created, just navigate
    await fetchTournaments()
    setStep('list')
    setCategories([])
    setNewTournament({ name: '', date: '' })
    setCreatedTournamentId(null)
    setFinalizingTournament(false)
    router.push(`/tournament/${createdTournamentId}`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este torneo y todos sus datos?')) return
    setDeletingId(id)
    try {
      const token = localStorage.getItem('admin-token')
      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setTournaments(prev => prev.filter(t => t.id !== id))
      } else {
        alert('Error al eliminar el torneo')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const playerCount = currentCategory.players.split('\n').filter(p => p.trim()).length

  return (
    <AdminLayout>
      {step === 'list' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Gestiona todos los torneos</p>
            </div>
            <button onClick={() => { setStep('new-tournament'); setFormError('') }} className="btn-primary">
              <Plus className="w-4 h-4" />
              Nuevo Torneo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total', value: tournaments.length, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
              { label: 'En curso', value: tournaments.filter(t => t.status === 'En curso').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Finalizados', value: tournaments.filter(t => t.status === 'Finalizado').length, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
            ].map(s => (
              <div key={s.label} className={`glass-card p-4 border ${s.bg}`}>
                <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tournament list */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <h2 className="font-semibold text-foreground">Torneos</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : tournaments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Trophy className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No hay torneos. ¡Crea el primero!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {tournaments.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors group animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{t.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {t.status === 'En curso' ? (
                        <span className="status-active">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          En curso
                        </span>
                      ) : (
                        <span className="status-finished">Finalizado</span>
                      )}
                      <Link href={`/tournament/${t.id}`} className="btn-secondary py-1.5 px-3 text-xs">
                        <ChevronRight className="w-3.5 h-3.5" />
                        Ver
                      </Link>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="btn-danger py-1.5 px-3 text-xs disabled:opacity-50"
                      >
                        {deletingId === t.id ? (
                          <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'new-tournament' && (
        <div className="max-w-lg mx-auto animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setStep('list')} className="btn-secondary py-1.5 px-3">
              <X className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nuevo Torneo</h1>
              <p className="text-muted-foreground text-sm">Paso 1 de 2 — Datos del torneo</p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-900 text-xs font-bold flex items-center justify-center">1</div>
              <span className="text-sm font-medium text-foreground">Datos</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary border border-border text-muted-foreground text-xs font-bold flex items-center justify-center">2</div>
              <span className="text-sm text-muted-foreground">Categorías</span>
            </div>
          </div>

          <div className="glass-card p-6">
            <form onSubmit={handleCreateTournament} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nombre del torneo</label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={e => setNewTournament({ ...newTournament, name: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Torneo Navidad 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={newTournament.date}
                  onChange={e => setNewTournament({ ...newTournament, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <button type="submit" disabled={creatingTournament} className="btn-primary w-full disabled:opacity-50">
                {creatingTournament ? (
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Continuar — Agregar Categorías
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 'add-categories' && (
        <div className="max-w-2xl mx-auto animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{createdTournamentName}</h1>
              <p className="text-muted-foreground text-sm">Paso 2 de 2 — Agregar categorías</p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm text-muted-foreground">Datos</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-900 text-xs font-bold flex items-center justify-center">2</div>
              <span className="text-sm font-medium text-foreground">Categorías</span>
            </div>
          </div>

          {/* Added categories */}
          {categories.length > 0 && (
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-foreground">Categorías agregadas ({categories.length})</span>
              </div>
              <div className="space-y-2">
                {categories.map((cat, i) => {
                  const count = cat.players.split('\n').filter(p => p.trim()).length
                  return (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{count} jugadores</span>
                        <span>{cat.players_per_group}/grupo</span>
                        <span>{cat.qualified_per_group} clasifican</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add category form */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Plus className="w-4 h-4 text-cyan-400" />
              <h2 className="font-semibold text-foreground">Nueva Categoría</h2>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nombre de la categoría</label>
                <input
                  type="text"
                  value={currentCategory.name}
                  onChange={e => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Masculino A, Femenino, Sub-18..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Jugadores por grupo</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={currentCategory.players_per_group}
                    onChange={e => setCurrentCategory({ ...currentCategory, players_per_group: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Clasificados por grupo</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={currentCategory.qualified_per_group}
                    onChange={e => setCurrentCategory({ ...currentCategory, qualified_per_group: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-muted-foreground">Participantes</label>
                  {playerCount > 0 && (
                    <span className="text-xs text-cyan-400 font-medium">{playerCount} jugadores</span>
                  )}
                </div>
                <textarea
                  value={currentCategory.players}
                  onChange={e => setCurrentCategory({ ...currentCategory, players: e.target.value })}
                  className="input-field resize-none font-mono text-xs"
                  rows={8}
                  placeholder={'Juan García\nMaría López\nCarlos Martínez\n(uno por línea, en orden de nivel)'}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">Un participante por línea, ordenados por nivel (el primero es el mejor)</p>
              </div>
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <button type="submit" disabled={savingCategory} className="btn-secondary w-full disabled:opacity-50">
                {savingCategory ? (
                  <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Agregar Categoría
              </button>
            </form>
          </div>

          {/* Finalize */}
          <div className="glass-card p-5 border border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">¿Listo para publicar el torneo?</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {categories.length === 0
                    ? 'Agrega al menos una categoría antes de crear el torneo.'
                    : `El torneo se publicará con ${categories.length} categoría${categories.length > 1 ? 's' : ''} y aparecerá en el home.`}
                </p>
                <button
                  onClick={handleFinalizeTournament}
                  disabled={categories.length === 0 || finalizingTournament}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {finalizingTournament ? (
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Crear Torneo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

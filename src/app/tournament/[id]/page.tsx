'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Calendar, ChevronRight, ArrowLeft, Layers, Users, Award, Clock } from 'lucide-react'

interface Tournament {
  id: number
  name: string
  date: string
  status: string
}

interface Category {
  id: number
  tournament_id: number
  name: string
  players_per_group: number
  qualified_per_group: number
  is_finished: boolean
}

export default function TournamentPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('admin-token'))
  }, [])

  useEffect(() => {
    if (!tournamentId) return
    Promise.all([
      fetch(`/api/tournaments/${tournamentId}`).then(r => r.json()),
      fetch(`/api/categories?tournamentId=${tournamentId}`).then(r => r.json()),
    ]).then(([t, cats]) => {
      setTournament(t)
      setCategories(Array.isArray(cats) ? cats : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tournamentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Torneo no encontrado</p>
          <Link href="/" className="btn-primary mt-4 inline-flex">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const isActive = tournament.status === 'En curso'
  const finishedCount = categories.filter(c => c.is_finished).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/assets/LogoSinFondo.png" 
              alt="Federico TM Logo" 
              width={140} 
              height={40} 
              className="object-contain" 
              priority
            />
          </div>
          <Link href={isAdmin ? '/admin' : '/'} className="btn-secondary py-1.5 px-3 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            {isAdmin ? 'Panel Admin' : 'Inicio'}
          </Link>
        </div>
      </header>

      {/* Tournament hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <Link href={isAdmin ? '/admin' : '/'} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            {isAdmin ? 'Panel Admin' : 'Todos los torneos'}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">{tournament.name}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  {new Date(tournament.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {isActive ? (
                  <span className="status-active">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En curso
                  </span>
                ) : (
                  <span className="status-finished">
                    <Clock className="w-3 h-3" />
                    Finalizado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-8">
            {[
              { icon: Layers, label: 'Categorías', value: categories.length, color: 'text-cyan-400' },
              { icon: Award, label: 'Finalizadas', value: finishedCount, color: 'text-emerald-400' },
              { icon: Users, label: 'En progreso', value: categories.length - finishedCount, color: 'text-amber-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3 glass-card px-4 py-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <div>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-xl font-bold text-foreground mb-6">Categorías</h2>

        {categories.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 gap-4">
            <Layers className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No hay categorías en este torneo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/tournament/${tournamentId}/category/${cat.id}`}
                className="group glass-card p-5 hover:border-cyan-500/30 hover:glow-cyan transition-all duration-300 animate-fade-in block"
                style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center group-hover:from-cyan-500/30 transition-all">
                    <Layers className="w-5 h-5 text-cyan-400" />
                  </div>
                  {cat.is_finished ? (
                    <span className="status-finished">
                      <Award className="w-3 h-3" />
                      Finalizada
                    </span>
                  ) : (
                    <span className="status-active">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Activa
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-foreground text-base mb-3 group-hover:text-cyan-400 transition-colors">
                  {cat.name}
                </h3>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Jugadores por grupo</span>
                    <span className="font-semibold text-foreground">{cat.players_per_group}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Clasificados por grupo</span>
                    <span className="font-semibold text-foreground">{cat.qualified_per_group}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Ver categoría</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Calendar, ChevronRight, Shield, Zap, Users, Clock } from 'lucide-react'

interface Tournament {
  id: number
  name: string
  date: string
  status: string
}

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTournaments(data)
        } else {
          setTournaments([]) // Fallback to empty array if API returns error
          console.error('Failed to load tournaments:', data)
        }
        setLoading(false)
      })
      .catch((e) => {
        console.error('Error fetching tournaments:', e)
        setLoading(false)
      })
  }, [])

  const active = tournaments.filter(t => t.status === 'En curso')
  const finished = tournaments.filter(t => t.status === 'Finalizado')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground text-lg leading-none block">Federico TM</span>
              <span className="text-xs text-muted-foreground">Tenis de Mesa</span>
            </div>
          </div>
          <Link href="/admin" className="btn-primary">
            <Shield className="w-4 h-4" />
            Panel Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Resultados en tiempo real
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4">
              Torneos de{' '}
              <span className="gradient-text">Tenis de Mesa</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Sigue los torneos en vivo, consulta resultados de round robin y llaves de eliminación directa.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-10">
            {[
              { icon: Zap, label: 'En curso', value: active.length, color: 'text-emerald-400' },
              { icon: Trophy, label: 'Finalizados', value: finished.length, color: 'text-cyan-400' },
              { icon: Users, label: 'Total torneos', value: tournaments.length, color: 'text-blue-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3 glass-card px-5 py-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <span className="text-muted-foreground text-sm">Cargando torneos...</span>
            </div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">No hay torneos disponibles</p>
            <p className="text-muted-foreground/60 text-sm">El administrador aún no ha creado ningún torneo.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active tournaments */}
            {active.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <h2 className="text-xl font-bold text-foreground">En Curso</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    {active.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map((t, i) => (
                    <TournamentCard key={t.id} tournament={t} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Finished tournaments */}
            {finished.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xl font-bold text-foreground">Finalizados</h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 text-xs font-semibold border border-slate-500/20">
                    {finished.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finished.map((t, i) => (
                    <TournamentCard key={t.id} tournament={t} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function TournamentCard({ tournament, index }: { tournament: Tournament; index: number }) {
  const isActive = tournament.status === 'En curso'
  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className={`group glass-card p-5 hover:border-cyan-500/30 hover:glow-cyan transition-all duration-300 animate-fade-in block`}
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-all">
          <Trophy className="w-5 h-5 text-cyan-400" />
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
      <h3 className="font-bold text-foreground text-base mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
        {tournament.name}
      </h3>
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(tournament.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">Ver detalles</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  )
}

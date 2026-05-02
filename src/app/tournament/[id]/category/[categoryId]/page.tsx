'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import LightBackground from '@/components/LightBackground'
import Logo from '@/components/Logo'
import { generateBergerSchedule } from '@/lib/berger'
import { cn } from '@/lib/utils'

interface Category {
  id: number
  name: string
  players_per_group: number
  qualified_per_group: number
  is_finished?: boolean
}

interface Player {
  id: number
  name: string
  position: number
}

interface Group {
  id: number
  name: string
  players: Player[]
}

interface Match {
  id: number
  group_id: number
  player1_id: number
  player2_id: number
  player1_name: string
  player2_name: string
  result: string | null
  winner_id: number | null
}

interface Standing {
  id: number
  name: string
  played: number
  wins: number
  losses: number
  setsWon: number
  setsLost: number
  setDiff: number
  manualTiebreak: number | null
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  const categoryId = params.categoryId as string

  const [category, setCategory] = useState<Category | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<{ [key: number]: Standing[] }>({})
  const [editingCell, setEditingCell] = useState<{ matchId: number; rowPlayerId: number; value: string } | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [cellError, setCellError] = useState<{ matchId: number; msg: string } | null>(null)
  
  // Tables logic (BD-backed)
  const [tablesCount, setTablesCount] = useState<number>(0)
  const [tableAssignments, setTableAssignments] = useState<Record<number, any>>({}) // tableNumber -> { ... }

  // Tiebreak panel
  const [tiebreakGroup, setTiebreakGroup] = useState<number | null>(null)
  const [tiebreakOrder, setTiebreakOrder] = useState<Standing[]>([])
  const [savingTiebreak, setSavingTiebreak] = useState(false)

  // Player management
  const [editingPlayer, setEditingPlayer] = useState<{ id: number; name: string } | null>(null)
  const [newPlayerGroup, setNewPlayerGroup] = useState<number | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [playerActionLoading, setPlayerActionLoading] = useState(false)

  const [hasElimination, setHasElimination] = useState(false)

  const fetchAll = useCallback(async () => {
    const [catRes, grpRes, matchRes, elimRes] = await Promise.all([
      fetch(`/api/categories/${categoryId}`),
      fetch(`/api/groups?categoryId=${categoryId}`),
      fetch(`/api/round-robin-matches?categoryId=${categoryId}`),
      fetch(`/api/elimination-matches?categoryId=${categoryId}`)
    ])
    if (catRes.ok) setCategory(await catRes.json())
    if (grpRes.ok) {
      const grpData = await grpRes.json()
      // Normalizar IDs de players dentro de cada grupo a número
      setGroups(grpData.map((g: any) => ({
        ...g,
        players: (g.players ?? []).map((p: any) => ({
          ...p,
          id: Number(p.id),
          position: Number(p.position)
        }))
      })))
    }
    if (matchRes.ok) {
      const matchData = await matchRes.json()
      // Normalizar IDs a número
      setMatches(matchData.map((m: any) => ({
        ...m,
        id: Number(m.id),
        group_id: Number(m.group_id),
        player1_id: Number(m.player1_id),
        player2_id: Number(m.player2_id),
        winner_id: m.winner_id ? Number(m.winner_id) : null
      })))
    }
    if (elimRes.ok) {
      const elimData = await elimRes.json()
      setHasElimination(Array.isArray(elimData) && elimData.length > 0)
    }
  }, [categoryId])

  const fetchStandings = useCallback(async () => {
    const res = await fetch(`/api/standings?categoryId=${categoryId}`)
    if (!res.ok) return
    const data = await res.json()
    const map: { [key: number]: Standing[] } = {}
    data.forEach((gs: any) => { map[gs.groupId] = gs.standings })
    setStandings(map)
  }, [categoryId])

  useEffect(() => {
    if (categoryId) {
      fetchAll()
      fetchStandings()
    }
  }, [categoryId, fetchAll, fetchStandings])

  const allMatchesDone = matches.length > 0 && matches.every(m => m.result)

  const handleEliminationButton = async () => {
    if (hasElimination) {
      // Ya existen llaves, ir directo sin regenerar
      router.push(`/tournament/${tournamentId}/category/${categoryId}/bracket`)
      return
    }
    if (!allMatchesDone) return
    const res = await fetch('/api/generate-elimination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: parseInt(categoryId) })
    })
    if (res.ok) {
      router.push(`/tournament/${tournamentId}/category/${categoryId}/bracket`)
    }
  }

  // ── Result cell editing ──────────────────────────────────────────────────

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('admin-token'))
  }, [])

  // Fetch tables from DB (polling cada 5s para tiempo real)
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/tables?tournamentId=${tournamentId}`)
      if (res.ok) {
        const data = await res.json()
        setTablesCount(data.tablesCount ?? 0)
        setTableAssignments(data.assignments ?? {})
      }
    } catch (e) {
      console.error('Error fetching tables', e)
    }
  }, [tournamentId])

  const toggleTableManual = async (tableNumber: number) => {
    const token = localStorage.getItem('admin-token')
    if (!token) return
    const isOccupied = !!tableAssignments[tableNumber]
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tournamentId, tableNumber, occupied: !isOccupied, label: 'Ocupada' })
    })
    fetchTables()
  }

  useEffect(() => {
    fetchTables()
    const interval = setInterval(fetchTables, 5000)
    return () => clearInterval(interval)
  }, [fetchTables])

  const assignTable = async (tableNumber: number, match: Match, groupName: string) => {
    const token = localStorage.getItem('admin-token')
    if (!token) return
    if (tableNumber <= 0) {
      // Liberar la mesa donde estaba este partido
      await fetch(`/api/tables?tournamentId=${tournamentId}&matchId=${match.id}&matchType=round-robin`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
    } else {
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tournamentId,
          tableNumber,
          categoryId,
          categoryName: category?.name,
          groupId: match.group_id,
          groupName,
          matchId: match.id,
          matchType: 'round-robin',
          p1Name: match.player1_name,
          p2Name: match.player2_name
        })
      })
    }
    fetchTables()
  }

  const releaseTable = async (matchId: number) => {
    const token = localStorage.getItem('admin-token')
    if (!token) return
    await fetch(`/api/tables?tournamentId=${tournamentId}&matchId=${matchId}&matchType=round-robin`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchTables()
  }

  const startEdit = (match: Match, rowPlayerId: number) => {
    if (category?.is_finished || !isAdmin) return
    // Si sos player2, mostrar el resultado invertido en el input
    let value = match.result ?? ''
    if (value && match.player2_id === rowPlayerId) {
      const parts = value.split('-')
      value = `${parts[1]}-${parts[0]}`
    }
    setEditingCell({ matchId: match.id, rowPlayerId, value })
    setCellError(null)
  }

  const commitEdit = async (matchId: number) => {
    if (!editingCell || editingCell.matchId !== matchId) return
    let value = editingCell.value.trim()
    // Si editó desde la fila de player2, invertir antes de guardar
    const match = matches.find(m => m.id === matchId)
    if (value && match && match.player2_id === editingCell.rowPlayerId) {
      const parts = value.split('-')
      if (parts.length === 2) value = `${parts[1]}-${parts[0]}`
    }
    setSavingId(matchId)
    const token = localStorage.getItem('admin-token')
    const res = await fetch('/api/round-robin-matches', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ id: matchId, result: value })
    })
    setSavingId(null)
    if (!res.ok) {
      const err = await res.json()
      setCellError({ matchId, msg: err.error || 'Error' })
    } else {
      setCellError(null)
      setEditingCell(null)
      setMatches(prev => prev.map(m => {
        if (Number(m.id) !== Number(matchId)) return m
        return { ...m, result: value || null }
      }))
      if (value) releaseTable(matchId) // Auto-release table when result is entered
      fetchStandings()
    }
  }

  // ── Player management ────────────────────────────────────────────────────

  const renamePlayer = async (playerId: number, name: string) => {
    if (!name.trim()) return
    setPlayerActionLoading(true)
    const token = localStorage.getItem('admin-token')
    await fetch('/api/group-players', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ playerId, name: name.trim() })
    })
    setEditingPlayer(null)
    setPlayerActionLoading(false)
    fetchAll()
    fetchStandings()
  }

  const deletePlayer = async (playerId: number, groupId: number) => {
    if (!confirm('¿Eliminar este jugador del grupo? Se borrarán sus partidos.')) return
    setPlayerActionLoading(true)
    const token = localStorage.getItem('admin-token')
    await fetch(`/api/group-players?playerId=${playerId}&groupId=${groupId}`, {
      method: 'DELETE',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
    setPlayerActionLoading(false)
    fetchAll()
    fetchStandings()
  }

  const addPlayer = async (groupId: number) => {
    if (!newPlayerName.trim()) return
    setPlayerActionLoading(true)
    const token = localStorage.getItem('admin-token')
    await fetch('/api/group-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ groupId, categoryId: parseInt(categoryId), name: newPlayerName.trim() })
    })
    setNewPlayerName('')
    setNewPlayerGroup(null)
    setPlayerActionLoading(false)
    fetchAll()
    fetchStandings()
  }

  // ── Tiebreak panel ───────────────────────────────────────────────────────

  const openTiebreak = (groupId: number) => {
    const st = standings[groupId] ?? []
    setTiebreakOrder([...st])
    setTiebreakGroup(groupId)
  }

  const moveTiebreak = (idx: number, dir: -1 | 1) => {
    const next = [...tiebreakOrder]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setTiebreakOrder(next)
  }

  const saveTiebreak = async () => {
    if (tiebreakGroup === null) return
    setSavingTiebreak(true)
    await fetch('/api/manual-tiebreak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: tiebreakGroup,
        tiebreaks: tiebreakOrder.map((p, i) => ({ playerId: p.id, position: i + 1 }))
      })
    })
    setSavingTiebreak(false)
    setTiebreakGroup(null)
    fetchStandings()
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const groupMatches = (groupId: number) =>
    matches.filter(m => m.group_id === groupId)

  const getResult = (groupId: number, p1Id: number, p2Id: number): Match | undefined =>
    matches.find(m =>
      m.group_id === groupId &&
      ((Number(m.player1_id) === Number(p1Id) && Number(m.player2_id) === Number(p2Id)) ||
        (Number(m.player1_id) === Number(p2Id) && Number(m.player2_id) === Number(p1Id)))
    )

  const displayResult = (match: Match, rowPlayerId: number): string => {
    if (!match.result) return ''
    const parts = match.result.split('-')
    if (match.player1_id === rowPlayerId) return match.result
    return `${parts[1]}-${parts[0]}`
  }

  if (!category) return <div className="text-center py-12 text-foreground">Cargando...</div>

  return (
    <div className="min-h-screen bg-background">
      <LightBackground />
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={isAdmin ? "/admin" : "/"}>
              <Logo width={140} height={40} />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border/40" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      className="text-muted-foreground hover:text-cyan-400 text-[10px] font-bold uppercase tracking-tight transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-2.5 h-2.5" />
                      Panel Admin
                    </Link>
                    <span className="text-muted-foreground/30 text-[10px]">|</span>
                  </>
                )}
                <Link
                  href={`/tournament/${tournamentId}`}
                  className="text-muted-foreground hover:text-cyan-400 text-[10px] font-bold uppercase tracking-tight transition-colors flex items-center gap-1"
                >
                  {!isAdmin && <ArrowLeft className="w-2.5 h-2.5" />}
                  Torneo
                </Link>
              </div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{category.name}</h1>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            {hasElimination && (
              <Link
                href={`/tournament/${tournamentId}/category/${categoryId}/bracket`}
                className="btn-secondary text-xs sm:text-sm py-2 px-4 shadow-lg shadow-cyan-500/5"
              >
                🏆 Ver Llaves
              </Link>
            )}
            {isAdmin && !hasElimination && (
              <button
                onClick={handleEliminationButton}
                disabled={!allMatchesDone}
                title={!allMatchesDone ? 'Completa todos los partidos primero' : 'Generar llaves de eliminación'}
                className={allMatchesDone ? 'btn-primary text-sm py-2 px-4' : 'btn-secondary opacity-40 cursor-not-allowed text-sm py-2 px-4'}
              >
                🏆 Generar Llaves
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-10">
        {/* ── Panel de Mesas (Solo si hay mesas configuradas) ── */}
        {tablesCount > 0 && (
          <div className="max-w-7xl mx-auto mb-10 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Control de Mesas</h3>
              {isAdmin && <span className="text-[10px] text-muted-foreground italic">(toca para cambiar estado)</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {Array.from({ length: tablesCount }, (_, i) => i + 1).map(num => {
                const assignment = tableAssignments[num]
                const isOccupied = !!assignment
                const isManual = assignment?.matchType === 'manual'
                return (
                  <button
                    key={num}
                    onClick={() => isAdmin && toggleTableManual(num)}
                    className={cn(
                      'border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all duration-300 w-full',
                      isAdmin ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default',
                      isOccupied ? 'bg-rose-500/5 border-rose-500/30 hover:bg-rose-500/15' : 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10'
                    )}
                  >
                    <span className={cn(
                      'text-[9px] font-black px-2 py-0.5 rounded-full mb-1',
                      isOccupied ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>MESA {num}</span>
                    {isOccupied ? (
                      <div className="text-[10px] text-center w-full animate-in fade-in zoom-in duration-300">
                        {!isManual && (
                          <div className="text-[9px] text-rose-400/70 font-bold uppercase truncate w-full mb-0.5 px-1 leading-none">
                            {assignment.categoryName} — {assignment.groupName}
                          </div>
                        )}
                        <div className="font-bold text-foreground truncate">{assignment.p1Name}</div>
                        {!isManual && (
                          <>
                            <div className="text-[8px] text-muted-foreground/40 leading-none my-0.5">VS</div>
                            <div className="font-bold text-foreground truncate">{assignment.p2Name}</div>
                          </>
                        )}
                        {isAdmin && <span className="mt-1 text-[8px] text-rose-400/50">Toca para liberar</span>}
                      </div>
                    ) : (
                      <>
                        <span className="text-[9px] text-emerald-400/60 font-bold">Libre</span>
                        {isAdmin && <span className="text-[8px] text-emerald-400/40">Toca para ocupar</span>}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {groups.map(group => {
          const players = (group.players ?? [])
            .filter(p => p.id)
            .sort((a, b) => a.position - b.position)
          const gMatches = groupMatches(group.id)
          const gStandings = standings[group.id] ?? []
          const totalMatches = gMatches.length
          const doneMatches = gMatches.filter(m => m.result).length

          return (
            <Card key={group.id} className="border-border/60 bg-card/20 overflow-hidden shadow-xl mb-12">
              <CardHeader className="bg-secondary/10 border-b border-border/40 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-400 flex items-center justify-center text-black font-black shadow-lg shadow-cyan-500/20">
                      {group.name.split(' ')[1] || group.name[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground leading-none mb-1">{group.name}</h2>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {doneMatches}/{totalMatches} partidos completados
                      </p>
                    </div>
                  </div>
                  {isAdmin && !category.is_finished && (
                    <button
                      onClick={() => { setNewPlayerGroup(group.id); setNewPlayerName('') }}
                      className="btn-secondary text-[10px] px-3 py-1 uppercase tracking-wider font-bold"
                    >
                      + Jugador
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-8">
                {/* ── Panel agregar jugador ── */}
                {isAdmin && newPlayerGroup === group.id && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border animate-in slide-in-from-top-2 duration-300">
                    <input
                      autoFocus
                      className="input-field flex-1 py-1.5 text-sm"
                      placeholder="Nombre del jugador"
                      value={newPlayerName}
                      onChange={e => setNewPlayerName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addPlayer(group.id)
                        if (e.key === 'Escape') setNewPlayerGroup(null)
                      }}
                    />
                    <button
                      onClick={() => addPlayer(group.id)}
                      disabled={playerActionLoading || !newPlayerName.trim()}
                      className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                      {playerActionLoading ? '...' : 'Agregar'}
                    </button>
                    <button onClick={() => setNewPlayerGroup(null)} className="btn-secondary text-xs px-3 py-1.5">
                      Cancelar
                    </button>
                  </div>
                )}

                {/* ── Lista de jugadores editable (solo admin) ── */}
                {isAdmin && !category.is_finished && players.length > 0 && (
                  <Card className="border-border/40 bg-background/80 shadow-xl shadow-black/20 ring-1 ring-white/5">
                    <CardHeader className="py-3 border-b border-border/10">
                      <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Jugadores del grupo</CardTitle>
                    </CardHeader>
                    <CardContent className="py-4">
                      <ul className="space-y-1">
                        {players.map(p => (
                          <li key={p.id} className="flex items-center gap-2">
                            {editingPlayer?.id === p.id ? (
                              <>
                                <input
                                  autoFocus
                                  className="input-field flex-1 py-1 text-sm"
                                  value={editingPlayer.name}
                                  onChange={e => setEditingPlayer({ id: p.id, name: e.target.value })}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') renamePlayer(p.id, editingPlayer.name)
                                    if (e.key === 'Escape') setEditingPlayer(null)
                                  }}
                                />
                                <button
                                  onMouseDown={e => { e.preventDefault(); renamePlayer(p.id, editingPlayer.name) }}
                                  disabled={playerActionLoading}
                                  className="text-xs px-2 py-1 rounded bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 disabled:opacity-50"
                                >✓</button>
                                <button
                                  onMouseDown={e => { e.preventDefault(); setEditingPlayer(null) }}
                                  className="text-xs px-2 py-1 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground"
                                >✕</button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm text-foreground">{p.name}</span>
                                <button
                                  onClick={() => setEditingPlayer({ id: p.id, name: p.name })}
                                  className="text-xs text-muted-foreground hover:text-cyan-400 px-2 py-1 rounded hover:bg-secondary transition-colors"
                                >✏️</button>
                                <button
                                  onClick={() => deletePlayer(p.id, group.id)}
                                  disabled={playerActionLoading}
                                  className="text-xs text-muted-foreground hover:text-red-400 px-2 py-1 rounded hover:bg-secondary transition-colors disabled:opacity-50"
                                >🗑️</button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* ── Tablas Principales (Alturas Igualadas) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                  <div className="flex flex-col group/card">
                    {players.length > 0 && (
                      <Card className="h-full flex flex-col border-border/50 bg-background/90 shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 ring-1 ring-white/5">
                        <CardHeader className="py-4 px-5 border-b border-border/20 bg-secondary/5">
                          <CardTitle className="text-sm font-bold text-muted-foreground">Tabla de Resultados</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-x-auto p-5">
                          <table className="text-sm border-collapse w-full">
                            <thead>
                              <tr>
                                <th className="border border-border bg-secondary text-foreground px-3 py-2 text-left min-w-[140px]">
                                  Jugador
                                </th>
                                {players.map(p => (
                                  <th
                                    key={p.id}
                                    className="border border-border bg-secondary text-foreground px-2 py-2 text-center min-w-[70px] text-xs"
                                  >
                                    {p.name.split(' ')[0]}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {players.map(rowPlayer => (
                                <tr key={rowPlayer.id}>
                                  <td className="border border-border px-3 py-2 font-medium text-foreground bg-secondary/50">
                                    {rowPlayer.name}
                                  </td>
                                  {players.map(colPlayer => {
                                    if (rowPlayer.id === colPlayer.id) {
                                      return (
                                        <td
                                          key={colPlayer.id}
                                          className="border border-border bg-secondary/80"
                                        />
                                      )
                                    }
                                    const match = getResult(group.id, rowPlayer.id, colPlayer.id)
                                    if (!match) {
                                      return (
                                        <td key={colPlayer.id} className="border border-border text-center text-muted-foreground text-xs py-2">
                                          —
                                        </td>
                                      )
                                    }
                                    const isEditing = editingCell?.matchId === match.id && editingCell?.rowPlayerId === rowPlayer.id
                                    const hasError = cellError?.matchId === match.id
                                    const resultDisplay = displayResult(match, rowPlayer.id)

                                    return (
                                      <td
                                        key={colPlayer.id}
                                        className="border border-border text-center p-1"
                                      >
                                        {isEditing ? (
                                          <div className="flex flex-col items-center gap-1">
                                            <input
                                              autoFocus
                                              className="match-input w-16"
                                              value={editingCell.value}
                                              placeholder="3-1"
                                              onChange={e => setEditingCell({ matchId: match.id, rowPlayerId: rowPlayer.id, value: e.target.value })}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') commitEdit(match.id)
                                                if (e.key === 'Escape') { setEditingCell(null); setCellError(null) }
                                              }}
                                            />
                                            <div className="flex gap-1">
                                              <button
                                                onMouseDown={e => { e.preventDefault(); commitEdit(match.id) }}
                                                className="text-xs px-2 py-0.5 rounded bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400"
                                              >✓</button>
                                              <button
                                                onMouseDown={e => { e.preventDefault(); setEditingCell(null); setCellError(null) }}
                                                className="text-xs px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground"
                                              >✕</button>
                                            </div>
                                            {hasError && (
                                              <span className="text-red-400 text-xs">{cellError.msg}</span>
                                            )}
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => startEdit(match, rowPlayer.id)}
                                            disabled={!!category.is_finished || !isAdmin}
                                            className={`w-full py-2 px-2 rounded text-xs font-mono transition-all border ${resultDisplay
                                                ? 'text-foreground border-border hover:border-cyan-500/50 hover:bg-cyan-500/10'
                                                : isAdmin
                                                  ? 'text-muted-foreground border-dashed border-border/50 hover:border-cyan-500/50 hover:text-cyan-400'
                                                  : 'text-muted-foreground/40 border-transparent'
                                              } ${savingId === match.id ? 'opacity-50' : ''} ${isAdmin && !category.is_finished ? 'cursor-pointer' : 'cursor-default'}`}
                                          >
                                            {savingId === match.id ? '...' : resultDisplay || (isAdmin ? '+' : '—')}
                                          </button>
                                        )}
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {!category.is_finished && isAdmin && (
                            <p className="text-xs text-muted-foreground mt-2 text-center italic">
                              Haz clic en una celda para ingresar el resultado (formato: 3-1).
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="flex flex-col group/card">
                    {gStandings.length > 0 && (
                      <Card className="h-full flex flex-col border-border/50 bg-background/90 shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 ring-1 ring-white/5">
                        <CardHeader className="py-4 px-5 border-b border-border/20 bg-secondary/5 flex flex-row items-center justify-between space-y-0 text-foreground">
                          <CardTitle className="text-sm font-bold text-muted-foreground">Posiciones</CardTitle>
                          {!category.is_finished && isAdmin && (
                            <button
                              className="text-[10px] bg-secondary border border-border hover:text-cyan-400 px-3 py-1 rounded transition-all"
                              onClick={() => openTiebreak(group.id)}
                            >
                              Manual
                            </button>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 overflow-x-auto p-5">
                          <table className="text-sm w-full border-collapse">
                            <thead>
                              <tr className="bg-secondary">
                                <th className="border border-border px-3 py-2 text-center text-foreground w-10">#</th>
                                <th className="border border-border px-3 py-2 text-left text-foreground">Jugador</th>
                                <th className="border border-border px-2 py-2 text-center text-muted-foreground">PJ</th>
                                <th className="border border-border px-2 py-2 text-center text-muted-foreground">G</th>
                                <th className="border border-border px-2 py-2 text-center text-muted-foreground">P</th>
                                <th className="border border-border px-2 py-2 text-center text-muted-foreground">SF</th>
                                <th className="border border-border px-2 py-2 text-center text-muted-foreground">SC</th>
                                <th className="border border-border px-2 py-2 text-center text-muted-foreground">Dif</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gStandings.map((s, idx) => (
                                <tr
                                  key={s.id}
                                  className={`${idx < category.qualified_per_group ? 'bg-emerald-500/10' : ''} hover:bg-white/5 transition-colors`}
                                >
                                  <td className="border border-border px-3 py-2 text-center font-bold text-foreground">
                                    {idx + 1}
                                  </td>
                                  <td className="border border-border px-3 py-2 font-medium text-foreground">
                                    {s.name}
                                    {s.manualTiebreak !== null && (
                                      <span className="ml-1 text-xs text-warning">(M)</span>
                                    )}
                                  </td>
                                  <td className="border border-border px-2 py-2 text-center text-foreground">{s.played}</td>
                                  <td className="border border-border px-2 py-2 text-center text-emerald-400 font-semibold">{s.wins}</td>
                                  <td className="border border-border px-2 py-2 text-center text-red-400">{s.losses}</td>
                                  <td className="border border-border px-2 py-2 text-center text-foreground">{s.setsWon}</td>
                                  <td className="border border-border px-2 py-2 text-center text-foreground">{s.setsLost}</td>
                                  <td className="border border-border px-2 py-2 text-center font-mono text-foreground font-bold">
                                    {s.setDiff > 0 ? `+${s.setDiff}` : s.setDiff}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground italic">
                            Fondo verde = clasificados ({category.qualified_per_group} por grupo)
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* ── Secuencia de Partidos (Pie de la Tarjeta Madre) ── */}
                {players.length > 0 && (
                  <div className="pt-8 border-t border-border/40">
                    <div className="flex items-center justify-between mb-5 px-2">
                      <h4 className="text-[11px] uppercase tracking-[0.3em] text-cyan-400 font-black flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
                        Secuencia de Juego
                      </h4>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-border" /> Pendiente</span>
                        <span className="flex items-center gap-1.5 text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Jugado</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {generateBergerSchedule(players.length).map((round) => (
                        <div key={round.round} className="bg-secondary/10 rounded-lg p-3 border border-border/20">
                          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/5">
                            <span className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">S{round.round}</span>
                          </div>
                          <div className="space-y-1.5">
                            {round.matches.map((m, idx) => {
                              const p1 = players[m.p1Idx];
                              const p2 = players[m.p2Idx];
                              const matchObj = getResult(group.id, p1.id, p2.id);
                              const isDone = !!matchObj?.result;

                              return (
                                <div key={idx} className={`flex items-center justify-between gap-2 py-2 px-3 rounded-md transition-colors ${isDone ? 'bg-emerald-500/10' : 'bg-white/5 shadow-sm'}`}>
                                  <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                    <span className="text-[10px] font-black text-cyan-500/60 shrink-0 tabular-nums bg-cyan-500/10 px-1.5 py-0.5 rounded leading-none">
                                      {m.p1Idx + 1}-{m.p2Idx + 1}
                                    </span>
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                      <span className={`text-xs font-bold leading-tight ${isDone ? 'text-emerald-500' : 'text-foreground/90'}`}>
                                        {p1.name}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground/40 font-black italic leading-none my-0.5">vs</span>
                                      <span className={`text-xs font-bold leading-tight ${isDone ? 'text-emerald-500' : 'text-foreground/90'}`}>
                                        {p2.name}
                                      </span>
                                    </div>
                                  </div>
                                  {isDone ? (
                                    <div className="flex items-center justify-center shrink-0">
                                      <span className="text-xs text-emerald-500 font-black">✓</span>
                                    </div>
                                  ) : tablesCount > 0 && (
                                    <div className="flex items-center gap-2">
                                      {isAdmin ? (
                                        <select
                                          className="bg-background border border-border/50 rounded px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground focus:border-cyan-500/50 outline-none cursor-pointer"
                                          value={Object.keys(tableAssignments).find(num => tableAssignments[num].matchId === matchObj?.id) || ""}
                                          onChange={(e) => {
                                            if (matchObj) assignTable(parseInt(e.target.value) || 0, matchObj, group.name)
                                          }}
                                        >
                                          <option value="">Mesa —</option>
                                          {Array.from({ length: tablesCount }, (_, i) => i + 1).map(num => (
                                            <option 
                                              key={num} 
                                              value={num} 
                                              disabled={!!tableAssignments[num] && tableAssignments[num].matchId !== matchObj?.id}
                                            >
                                              Mesa {num} {tableAssignments[num] ? '(Ocup)' : ''}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (() => {
                                        const tableNum = Object.keys(tableAssignments).find(num => tableAssignments[num].matchId === matchObj?.id)
                                        return tableNum ? (
                                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                                            Mesa {tableNum}
                                          </span>
                                        ) : null
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {groups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay grupos generados. Genera el Round Robin para comenzar.
          </div>
        )}
      </main>

      {/* ── Panel de desempate manual ── */}
      {tiebreakGroup !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Desempate Manual — {groups.find(g => g.id === tiebreakGroup)?.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Usa las flechas para ordenar los jugadores empatados.
            </p>
            <ul className="space-y-2 mb-6">
              {tiebreakOrder.map((s, idx) => (
                <li key={s.id} className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2">
                  <span className="font-bold text-muted-foreground w-6">{idx + 1}.</span>
                  <span className="flex-1 font-medium text-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.wins}G {s.setDiff > 0 ? `+${s.setDiff}` : s.setDiff}Dif</span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveTiebreak(idx, -1)}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                    >▲</button>
                    <button
                      onClick={() => moveTiebreak(idx, 1)}
                      disabled={idx === tiebreakOrder.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                    >▼</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setTiebreakGroup(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={saveTiebreak} disabled={savingTiebreak}>
                {savingTiebreak ? 'Guardando...' : 'Guardar Orden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

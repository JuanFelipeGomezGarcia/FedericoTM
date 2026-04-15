'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

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
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image 
                src="/assets/LogoSinFondo.png" 
                alt="Federico TM Logo" 
                width={140} 
                height={40} 
                className="object-contain" 
                priority
              />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border/40" />
            <div className="flex flex-col">
              <Link
                href={isAdmin ? `/admin` : `/tournament/${tournamentId}`}
                className="text-muted-foreground hover:text-cyan-400 text-xs transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                {isAdmin ? 'Panel Admin' : 'Torneo'}
              </Link>
              <h1 className="text-lg font-bold text-foreground leading-tight">{category.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
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
        {groups.map(group => {
          const players = (group.players ?? [])
            .filter(p => p.id)
            .sort((a, b) => a.position - b.position)
          const gMatches = groupMatches(group.id)
          const gStandings = standings[group.id] ?? []
          const totalMatches = gMatches.length
          const doneMatches = gMatches.filter(m => m.result).length

          return (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-xl font-bold text-foreground">
                  {group.name}
                  <span className="ml-3 text-sm font-normal text-muted-foreground">
                    {doneMatches}/{totalMatches} partidos completados
                  </span>
                </h2>
                {isAdmin && !category.is_finished && (
                  <button
                    onClick={() => { setNewPlayerGroup(group.id); setNewPlayerName('') }}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    + Jugador
                  </button>
                )}
              </div>

              {/* ── Panel agregar jugador ── */}
              {isAdmin && newPlayerGroup === group.id && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Jugadores del grupo</CardTitle>
                  </CardHeader>
                  <CardContent>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  {/* ── Tabla cruzada ── */}
                  {players.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tabla de Resultados</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
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
                                      className={`w-full py-2 px-2 rounded text-xs font-mono transition-all border ${
                                        resultDisplay
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Haz clic en una celda para ingresar el resultado (formato: 3-1). El resultado es desde la perspectiva del jugador de la fila.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
                </div>

                <div className="space-y-4">
                  {/* ── Tabla de posiciones ── */}
                  {gStandings.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Posiciones</CardTitle>
                      {!category.is_finished && isAdmin && (
                        <button
                          className="btn-secondary text-xs px-3 py-1.5"
                          onClick={() => openTiebreak(group.id)}
                        >
                          Desempate Manual
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
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
                            className={idx < category.qualified_per_group ? 'bg-emerald-500/10' : ''}
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
                            <td className="border border-border px-2 py-2 text-center font-mono text-foreground">
                              {s.setDiff > 0 ? `+${s.setDiff}` : s.setDiff}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fondo verde = clasificados ({category.qualified_per_group} por grupo)
                    </p>
                  </CardContent>
                </Card>
              )}
                </div>
              </div>
            </div>
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

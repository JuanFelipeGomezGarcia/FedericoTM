'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Medal, Star, Award, Crown, ArrowDown, ArrowLeft, GripVertical, UserPlus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

interface Match {
  id: number
  round: number
  match_number: number
  player1_id: number | null
  player2_id: number | null
  player1_name: string | null
  player2_name: string | null
  winner_id: number | null
  bye: boolean
}

interface RankedPlayer {
  id: number
  name: string
  rank: number
  source: 'elimination' | 'round-robin'
  stats?: {
    groupPos: number
    wins: number
    setDiff: number
    setsWon: number
    groupWinnerRank?: number
  }
}

// Dimensiones
const CARD_W = 220
const CARD_H = 64
const PLAYER_H = 32
const COL_GAP = 56
const PADDING = 24
const LABEL_H = 28
const BASE_GAP = 20

export default function BracketPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const categoryId = params.categoryId as string

  const [matches, setMatches] = useState<Match[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState<number | null>(null)
  const [confirmingSlot, setConfirmingSlot] = useState<string | null>(null)
  const [standings, setStandings] = useState<any[]>([])
  const [showRanking, setShowRanking] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')

  // Tables logic
  const [tablesCount, setTablesCount] = useState<number>(0)
  const [tableAssignments, setTableAssignments] = useState<Record<number, any>>({}) // tableNumber -> { categoryId, groupId, matchId, p1Name, p2Name }

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => { 
    setIsAdmin(!!localStorage.getItem('admin-token')) 
    
    // Load tables config
    const count = parseInt(localStorage.getItem(`tournament_${tournamentId}_tables_count`) || '0')
    setTablesCount(count)
    
    // Load current assignments
    const saved = localStorage.getItem(`tournament_${tournamentId}_table_assignments`)
    if (saved) {
      try {
        setTableAssignments(JSON.parse(saved))
      } catch (e) {
        console.error("Error loading table assignments", e)
      }
    }
  }, [tournamentId])

  // Sync tables across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `tournament_${tournamentId}_table_assignments`) {
        if (e.newValue) setTableAssignments(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [tournamentId])

  const saveTableAssignments = (newAssignments: Record<number, any>) => {
    setTableAssignments(newAssignments)
    localStorage.setItem(`tournament_${tournamentId}_table_assignments`, JSON.stringify(newAssignments))
  }

  const assignTable = (tableNumber: number, match: Match) => {
    const newAssignments = { ...tableAssignments }
    
    // If this match was already on another table, remove it from there
    Object.keys(newAssignments).forEach(num => {
      if (newAssignments[parseInt(num)].matchId === match.id && newAssignments[parseInt(num)].categoryId === categoryId) {
        delete newAssignments[parseInt(num)]
      }
    })

    if (tableNumber > 0) {
      newAssignments[tableNumber] = {
        categoryId,
        matchId: match.id,
        p1Name: match.player1_name || '?',
        p2Name: match.player2_name || '?',
        round: match.round,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }
    
    saveTableAssignments(newAssignments)
  }

  const releaseTable = (matchId: number) => {
    const newAssignments = { ...tableAssignments }
    let changed = false
    Object.keys(newAssignments).forEach(num => {
      if (newAssignments[parseInt(num)].matchId === matchId && newAssignments[parseInt(num)].categoryId === categoryId) {
        delete newAssignments[parseInt(num)]
        changed = true
      }
    })
    if (changed) saveTableAssignments(newAssignments)
  }

  const fetchStandings = useCallback(async () => {
    try {
      const res = await fetch(`/api/standings?categoryId=${categoryId}`)
      if (res.ok) setStandings(await res.json())
    } catch (e) { console.error(e) }
  }, [categoryId])

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/elimination-matches?categoryId=${categoryId}`)
      if (res.ok) setMatches(await res.json())
    } catch (e) { console.error(e) }
  }, [categoryId])

  useEffect(() => { 
    fetchMatches() 
  }, [fetchMatches])

  const setWinner = async (matchId: number, winnerId: number) => {
    setConfirmingSlot(null)
    setSaving(matchId)
    const token = localStorage.getItem('admin-token')
    try {
      const res = await fetch('/api/elimination-matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: matchId, winner_id: winnerId })
      })
      setSaving(null)
      if (res.ok) {
        setMatches(await res.json())
        releaseTable(matchId) // Auto-release table when winner is set
      }
    } catch (e) { 
      setSaving(null)
      console.error(e) 
    }
  }

  // Bracket dimensions and calculations
  const rounds = useMemo(() => Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b), [matches])
  const totalRounds = rounds.length
  const finalMatch = useMemo(() => matches.find(m => m.round === totalRounds && m.match_number === 1), [matches, totalRounds])
  const isFinished = !!finalMatch?.winner_id

  // Dragging logic
  const someWinnerExists = useMemo(() => matches.some(m => !m.bye && !!m.winner_id), [matches])
  const canDrag = isAdmin && !someWinnerExists

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSwapping(true)
    const [matchAId, slotA] = (active.id as string).split('-')
    const [matchBId, slotB] = (over.id as string).split('-')

    try {
      const res = await fetch('/api/elimination-matches/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchAId, slotA, matchBId, slotB })
      })
      if (res.ok) {
        const data = await res.json()
        setMatches(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSwapping(false)
    }
  }

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return

    setSwapping(true)
    setShowAddModal(false)
    try {
      const res = await fetch('/api/elimination-matches/add-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, playerName: newPlayerName })
      })
      if (res.ok) {
        setMatches(await res.json())
        setNewPlayerName('')
      } else {
        const err = await res.json()
        alert(err.error || 'Error al agregar jugador')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSwapping(false)
    }
  }

  useEffect(() => {
    if (isFinished) {
      fetchStandings()
      setShowRanking(true)
    }
  }, [isFinished, fetchStandings])

  const finalRanking = useMemo((): RankedPlayer[] => {
    if (!isFinished || matches.length === 0) return []

    const ranking: Record<number, RankedPlayer> = {}

    if (finalMatch?.winner_id) {
      const winnerId = finalMatch.winner_id
      const winnerName = winnerId === finalMatch.player1_id ? finalMatch.player1_name : finalMatch.player2_name
      const loserId = winnerId === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id
      const loserName = winnerId === finalMatch.player1_id ? finalMatch.player2_name : finalMatch.player1_name

      ranking[1] = { id: winnerId, name: winnerName || '?', rank: 1, source: 'elimination' }
      if (loserId) {
        ranking[2] = { id: loserId, name: loserName || '?', rank: 2, source: 'elimination' }
      }

      for (let r = totalRounds - 1; r >= 1; r--) {
        const roundMatches = matches.filter(m => m.round === r)
        roundMatches.forEach(m => {
          if (!m.winner_id || m.bye) return
          const winnerRank = Object.values(ranking).find(rp => rp.id === m.winner_id)?.rank
          if (winnerRank) {
            const loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id
            const loserName = m.winner_id === m.player1_id ? m.player2_name : m.player1_name
            if (loserId && !Object.values(ranking).some(rp => rp.id === loserId)) {
              const loserRank = winnerRank + Math.pow(2, totalRounds - r)
              ranking[loserRank] = { id: loserId, name: loserName || '?', rank: loserRank, source: 'elimination' }
            }
          }
        })
      }
    }

    const eliminationRanked = Object.values(ranking).sort((a, b) => a.rank - b.rank)
    const eliminationIds = new Set(eliminationRanked.map(p => p.id))
    const playerToRankMap = new Map<number, number>()
    eliminationRanked.forEach(p => playerToRankMap.set(p.id, p.rank))

    const groupWinnerRankMap = new Map<number, number>()
    standings.forEach(group => {
      const winner = group.standings[0]
      if (winner) {
        const rank = playerToRankMap.get(winner.id) || 999
        groupWinnerRankMap.set(group.groupId, rank)
      }
    })

    const rrPlayers: RankedPlayer[] = []
    standings.forEach(group => {
      group.standings.forEach((s: any, idx: number) => {
        if (!eliminationIds.has(s.id)) {
          rrPlayers.push({
            id: s.id,
            name: s.name,
            rank: 999,
            source: 'round-robin',
            stats: {
              groupPos: idx + 1,
              wins: s.wins,
              setDiff: s.setDiff,
              setsWon: s.setsWon,
              groupWinnerRank: groupWinnerRankMap.get(group.groupId) || 999
            }
          })
        }
      })
    })

    rrPlayers.sort((a, b) => {
      const sA = a.stats!
      const sB = b.stats!
      if (sA.groupPos !== sB.groupPos) return sA.groupPos - sB.groupPos
      if (sA.groupWinnerRank !== sB.groupWinnerRank) return (sA.groupWinnerRank || 999) - (sB.groupWinnerRank || 999)
      if (sB.wins !== sA.wins) return sB.wins - sA.wins
      return sB.setDiff - sA.setDiff
    })

    let nextRank = eliminationRanked.length > 0 ? Math.max(...eliminationRanked.map(r => r.rank)) + 1 : 1
    const finalRankingResult = [...eliminationRanked]
    rrPlayers.forEach(p => {
      finalRankingResult.push({ ...p, rank: nextRank++ })
    })

    return finalRankingResult
  }, [isFinished, matches, finalMatch, totalRounds, standings])

  const matchY = useMemo(() => {
    const result: Record<number, Record<number, number>> = {}
    if (matches.length === 0) return result
    const r1 = matches.filter(m => m.round === 1).sort((a, b) => a.match_number - b.match_number)
    result[1] = {}
    r1.forEach((m, i) => {
      result[1][m.match_number] = PADDING + LABEL_H + i * (CARD_H + BASE_GAP)
    })
    for (let r = 2; r <= totalRounds; r++) {
      result[r] = {}
      const rMatches = matches.filter(m => m.round === r).sort((a, b) => a.match_number - b.match_number)
      rMatches.forEach(m => {
        const c1 = result[r - 1]?.[m.match_number * 2 - 1]
        const c2 = result[r - 1]?.[m.match_number * 2]
        if (c1 !== undefined && c2 !== undefined) {
          result[r][m.match_number] = (c1 + c2) / 2
        } else if (c1 !== undefined) {
          result[r][m.match_number] = c1
        }
      })
    }
    return result
  }, [matches, totalRounds])

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No hay llaves generadas aún.</p>
          <Link href={`/tournament/${tournamentId}/category/${categoryId}`} className="btn-secondary inline-flex">
            ← Volver a la categoría
          </Link>
        </div>
      </div>
    )
  }

  const canvasW = PADDING + totalRounds * (CARD_W + COL_GAP) - COL_GAP + PADDING;
  const allYs = Object.values(matchY).flatMap(r => Object.values(r));
  const canvasH = allYs.length > 0 ? Math.max(...allYs) + CARD_H + PADDING : 600;
  const colX = (round: number) => PADDING + (round - 1) * (CARD_W + COL_GAP);
  const roundLabel = (round: number) => {
    const fromEnd = totalRounds - round;
    if (fromEnd === 0) return 'Final';
    if (fromEnd === 1) return 'Semifinal';
    if (fromEnd === 2) return 'Cuartos';
    return `Ronda ${round}`;
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background">
        <header className="page-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <Image src="/assets/LogoSinFondo.png" alt="Logo" width={130} height={35} className="object-contain" priority />
              </Link>
              <div className="h-4 w-px bg-border/40" />
              <div className="flex items-center gap-3">
                <Link href={`/tournament/${tournamentId}/category/${categoryId}`} className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Volver
                </Link>
                <h1 className="text-base font-bold text-foreground">Llaves de Eliminación</h1>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="hidden md:inline text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Modo Admin
                  </span>
                  {canDrag && (
                    <span className="text-[9px] text-cyan-400/60 uppercase tracking-tighter mt-1 italic">
                      Arrastra para reordenar
                    </span>
                  )}
                </div>
                {canDrag && (
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all shadow-lg shadow-cyan-500/5 group"
                    title="Agregar Jugador Manual"
                  >
                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Agregar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Modal para Agregar Jugador */}
        {showAddModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md glass-card p-8 border-cyan-500/30 animate-scale-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Agregar Participante</h3>
                  <p className="text-xs text-muted-foreground">El cuadro se expandirá automáticamente si es necesario.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Nombre Completo</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                    className="w-full bg-secondary/50 border border-border focus:border-cyan-500/50 outline-none rounded-xl px-4 py-3 text-foreground transition-all"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { setShowAddModal(false); setNewPlayerName(''); }}
                    className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={addPlayer}
                    disabled={!newPlayerName.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className={cn("py-8 px-4 overflow-auto transition-opacity", swapping && "opacity-50 pointer-events-none")}>
          {/* ── Panel de Mesas (Solo si hay mesas configuradas) ── */}
          {tablesCount > 0 && (
            <div className="max-w-7xl mx-auto mb-10 animate-fade-in px-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Control de Mesas</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {Array.from({ length: tablesCount }, (_, i) => i + 1).map(num => {
                  const assignment = tableAssignments[num]
                  const isOccupied = !!assignment
                  
                  return (
                    <div key={num} className={cn(
                      "border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all",
                      isOccupied ? 'bg-rose-500/5 border-rose-500/30' : 'bg-emerald-500/5 border-emerald-500/10'
                    )}>
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full mb-1",
                        isOccupied ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      )}>MESA {num}</span>
                      {isOccupied ? (
                        <div className="text-[10px] text-center w-full animate-in fade-in zoom-in duration-300">
                          <div className="font-bold text-foreground truncate">{assignment.p1Name}</div>
                          <div className="text-[8px] text-muted-foreground/40 leading-none my-0.5">VS</div>
                          <div className="font-bold text-foreground truncate">{assignment.p2Name}</div>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/30">Libre</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isFinished && showRanking && finalRanking.length > 0 && (
            <div className="max-w-5xl mx-auto mb-16 animate-fade-in text-center">
              <div className="flex flex-col items-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold mb-4">
                  <Trophy className="w-4 h-4" /> RANKING FINAL
                </div>
                <h2 className="text-3xl sm:text-4xl font-black gradient-text uppercase tracking-tight">Cuadro de Honor</h2>
              </div>
              
              <div className="relative px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
                  <div className="order-2 md:order-1 flex flex-col items-center group stagger-1 animate-slide-in">
                    <div className="relative w-full glass-card p-6 flex flex-col items-center border-slate-400/30 bg-slate-400/5 hover:bg-slate-400/10 transition-all duration-300">
                      <div className="absolute -top-4 bg-slate-400 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">2</div>
                      <Medal className="w-10 h-10 text-slate-400 mb-3" />
                      <span className="text-lg font-bold text-foreground text-center line-clamp-1">{finalRanking[1]?.name}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Subcampeón</span>
                    </div>
                    <div className="w-full h-12 bg-gradient-to-t from-slate-400/20 to-transparent mt-2 rounded-b-xl" />
                  </div>

                  <div className="order-1 md:order-2 flex flex-col items-center group animate-slide-in">
                    <div className="relative w-full glass-card p-8 flex flex-col items-center border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all duration-300 shadow-xl shadow-yellow-500/10" style={{ transform: 'translateY(-15%)' }}>
                      <div className="absolute -top-6 bg-yellow-500 text-yellow-950 w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-xl border-4 border-background text-xl">1</div>
                      <Crown className="w-14 h-14 text-yellow-500 mb-4 animate-bounce" />
                      <span className="text-2xl font-black text-foreground text-center line-clamp-1">{finalRanking[0]?.name}</span>
                      <span className="text-sm text-yellow-500 font-bold uppercase tracking-widest mt-1">Campeón</span>
                    </div>
                    <div className="w-full h-20 bg-gradient-to-t from-yellow-500/30 to-transparent mt-2 rounded-b-xl" />
                  </div>

                  <div className="order-3 md:order-3 flex flex-col items-center group stagger-2 animate-slide-in">
                    <div className="relative w-full glass-card p-6 flex flex-col items-center border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300">
                      <div className="absolute -top-4 bg-amber-500 text-amber-950 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">3</div>
                      <Award className="w-10 h-10 text-amber-500 mb-3" />
                      <div className="flex items-center justify-center gap-1.5 w-full flex-wrap">
                        <span className="text-sm font-bold text-foreground">{finalRanking[2]?.name}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-sm font-bold text-foreground">{finalRanking[3]?.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Terceros Puestos</span>
                    </div>
                    <div className="w-full h-8 bg-gradient-to-t from-amber-500/20 to-transparent mt-2 rounded-b-xl" />
                  </div>
                </div>
              </div>

              <div className="glass-card overflow-hidden border-border/50 max-w-4xl mx-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider w-20">#</th>
                      <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider">Participante</th>
                      <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Etapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {finalRanking.map((player) => (
                      <tr key={player.id} className={cn(
                        "hover:bg-white/5 transition-colors group",
                        player.rank <= 1 ? "bg-yellow-500/5" : player.rank === 2 ? "bg-slate-500/5" : (player.rank === 3 || player.rank === 4) ? "bg-amber-500/5" : ""
                      )}>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg font-bold transition-colors",
                            player.rank === 1 ? "bg-yellow-500 text-yellow-950" : 
                            player.rank === 2 ? "bg-slate-400 text-slate-900" :
                            (player.rank === 3 || player.rank === 4) ? "bg-amber-600 text-amber-50" :
                            "bg-secondary text-foreground group-hover:bg-cyan-500/20 group-hover:text-cyan-400"
                          )}>
                            {player.rank === 4 ? 3 : player.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "font-medium",
                              player.rank === 1 ? "text-yellow-500 font-bold text-base" : "text-foreground"
                            )}>{player.name}</span>
                            {player.rank === 1 && <Crown className="w-4 h-4 text-yellow-500" />}
                            {player.rank === 2 && <Medal className="w-3.5 h-3.5 text-slate-400" />}
                            {(player.rank === 3 || player.rank === 4) && <Award className="w-3.5 h-3.5 text-amber-500" />}
                            {player.rank > 4 && player.source === 'elimination' && <Star className="w-3 h-3 text-cyan-400/50" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider",
                            player.source === 'elimination' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          )}>
                            {player.source === 'elimination' ? 'Eliminación' : 'Fase de Grupos'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-center">
                <button onClick={() => setShowRanking(false)} className="text-xs text-muted-foreground hover:text-cyan-400 transition-colors uppercase tracking-widest font-bold flex items-center gap-2">
                  Ver cuadro de llaves <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {(!isFinished || !showRanking) && (
            <div className="relative">
              {isFinished && (
                <div className="flex justify-center mb-8 animate-fade-in">
                  <button onClick={() => setShowRanking(true)} className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl scale-110 shadow-cyan-500/20">
                    <Trophy className="w-5 h-5" /> Ver Ranking Final
                  </button>
                </div>
              )}
              
              {/* Wrapper horizontal scroll para móvil */}
              <div className="overflow-x-auto overflow-y-visible pb-10">
                <div style={{ position: 'relative', width: canvasW, height: canvasH, minWidth: canvasW }}>
                  {rounds.map(round => (
                    <div key={`lbl-${round}`} style={{ position: 'absolute', top: PADDING, left: colX(round), width: CARD_W }} className="text-center text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      {roundLabel(round)}
                    </div>
                  ))}

                  <svg style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH, overflow: 'visible' }} className="pointer-events-none">
                    {rounds.slice(0, -1).map(round => {
                      const nextRound = round + 1;
                      const nextMatches = matches.filter(m => m.round === nextRound);
                      return nextMatches.map(parent => {
                        const c1Num = parent.match_number * 2 - 1;
                        const c2Num = parent.match_number * 2;
                        const y1 = matchY[round]?.[c1Num];
                        const y2 = matchY[round]?.[c2Num];
                        const yP = matchY[nextRound]?.[parent.match_number];
                        if (y1 === undefined || y2 === undefined || yP === undefined) return null;

                        const xRight = colX(round) + CARD_W;
                        const xLeft  = colX(nextRound);
                        const xMid   = xRight + COL_GAP / 2;
                        const cy1 = y1 + CARD_H / 2;
                        const cy2 = y2 + CARD_H / 2;
                        const cyP = yP + CARD_H / 2;

                        return (
                          <g key={`conn-${round}-${parent.match_number}`}>
                            <line x1={xRight} y1={cy1} x2={xMid} y2={cy1} stroke="hsl(var(--border))" strokeWidth="1.5" />
                            <line x1={xRight} y1={cy2} x2={xMid} y2={cy2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                            <line x1={xMid} y1={cy1} x2={xMid} y2={cy2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                            <line x1={xMid} y1={cyP} x2={xLeft} y2={cyP} stroke="hsl(var(--border))" strokeWidth="1.5" />
                          </g>
                        );
                      });
                    })}
                  </svg>

                  {matches.map(match => {
                    const x = colX(match.round);
                    const y = matchY[match.round]?.[match.match_number] ?? 0;
                    const nextMatch = matches.find(m => m.round === match.round + 1 && m.match_number === Math.ceil(match.match_number / 2));
                    const canSetWinner = isAdmin && !isFinished && !match.bye && !!match.player1_id && !!match.player2_id && (!nextMatch || !nextMatch.winner_id);

                    return (
                      <div key={match.id} style={{ position: 'absolute', left: x, top: y, width: CARD_W, height: CARD_H }} className="rounded-lg border border-border bg-card shadow-sm flex flex-col justify-center relative">
                        <PlayerRow
                          matchId={match.id}
                          slot="p1"
                          name={match.bye && !match.player1_id ? 'BYE' : match.player1_name}
                          playerId={match.player1_id}
                          winnerId={match.winner_id}
                          canClick={!!canSetWinner}
                          canDrag={canDrag && match.round === 1}
                          saving={saving === match.id}
                          onClick={() => match.player1_id && setWinner(match.id, match.player1_id)}
                          position={match.round === 1 ? match.match_number * 2 - 1 : undefined}
                          isConfirming={confirmingSlot === `${match.id}-${match.player1_id}`}
                          onStartConfirm={() => match.player1_id && setConfirmingSlot(`${match.id}-${match.player1_id}`)}
                          onCancelConfirm={() => setConfirmingSlot(null)}
                        />
                        <div className="border-t border-border/50 mx-2" />
                        <PlayerRow
                          matchId={match.id}
                          slot="p2"
                          name={match.bye && !match.player2_id ? 'BYE' : match.player2_name}
                          playerId={match.player2_id}
                          winnerId={match.winner_id}
                          canClick={!!canSetWinner && match.bye !== true && match.bye !== 'true'}
                          canDrag={canDrag && match.round === 1}
                          saving={saving === match.id}
                          onClick={() => match.player2_id && setWinner(match.id, match.player2_id)}
                          position={match.round === 1 ? match.match_number * 2 : undefined}
                          isConfirming={confirmingSlot === `${match.id}-${match.player2_id}`}
                          onStartConfirm={() => match.player2_id && setConfirmingSlot(`${match.id}-${match.player2_id}`)}
                          onCancelConfirm={() => setConfirmingSlot(null)}
                        />
                        
                        {/* Mesa Selector */}
                        {isAdmin && tablesCount > 0 && !match.winner_id && !match.bye && (
                          <div className="absolute -bottom-2.5 right-1 z-[100]">
                            <select
                              className="bg-card border border-border/80 text-[7px] font-black text-muted-foreground uppercase tracking-widest px-1.5 py-0.5 rounded shadow-lg hover:border-cyan-500/50 hover:text-cyan-400 transition-all outline-none cursor-pointer appearance-none text-center min-w-[60px]"
                              value={Object.keys(tableAssignments).find(num => tableAssignments[num].matchId === match.id && tableAssignments[num].categoryId === categoryId) || ""}
                              onChange={(e) => assignTable(parseInt(e.target.value) || 0, match)}
                            >
                              <option value="">MESAS —</option>
                              {Array.from({ length: tablesCount }, (_, i) => i + 1).map(num => (
                                <option 
                                  key={num} 
                                  value={num} 
                                  disabled={!!tableAssignments[num] && tableAssignments[num].matchId !== match.id}
                                >
                                  Mesa {num} {tableAssignments[num] ? '(Ocupada)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </DndContext>
  );
}

function PlayerRow({
  matchId, slot, name, playerId, winnerId, canClick, canDrag, saving, onClick, position, isConfirming, onStartConfirm, onCancelConfirm
}: {
  matchId: number
  slot: 'p1' | 'p2'
  name: string | null
  playerId: number | null
  winnerId: number | null
  canClick: boolean
  canDrag?: boolean
  saving: boolean
  onClick: () => void
  position?: number
  isConfirming: boolean
  onStartConfirm: () => void
  onCancelConfirm: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${matchId}-${slot}`,
    disabled: !canDrag || !playerId
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${matchId}-${slot}`,
    disabled: !canDrag
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 1,
  } : undefined

  return (
    <div 
      ref={(node) => { setNodeRef(node); setDropRef(node); }}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "h-[32px] px-3 flex items-center justify-between text-[11px] font-bold transition-all relative group/row",
        winnerId === playerId && playerId !== null ? "bg-cyan-500/10 text-cyan-400" : "text-foreground/80",
        isOver && canDrag && "bg-cyan-500/20 ring-1 ring-inset ring-cyan-500/50",
        isDragging && "opacity-50 ring-2 ring-cyan-500 scale-105",
        canDrag && playerId && "cursor-grab active:cursor-grabbing hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        {position && (
          <span className="text-[8px] text-muted-foreground/40 font-black w-4">{position}</span>
        )}
        <span className="truncate">{name || ''}</span>
      </div>

      {canClick && !saving && (
        <div className="flex items-center gap-1 absolute right-1">
          {isConfirming ? (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-1 duration-200">
              <button 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter"
              >
                ✓
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onCancelConfirm(); }}
                className="bg-secondary text-muted-foreground px-1.5 py-0.5 rounded text-[8px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onStartConfirm(); }}
              className="bg-secondary/80 hover:bg-cyan-500/20 text-muted-foreground hover:text-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-colors"
            >
              Gana
            </button>
          )}
        </div>
      )}
      
      {saving && <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />}
      {winnerId === playerId && playerId !== null && <Trophy className="w-3 h-3 text-cyan-400 shrink-0" />}
    </div>
  )
}

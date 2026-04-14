'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

// Dimensiones
const CARD_W = 220
const CARD_H = 64       // altura total de la card (2 jugadores)
const PLAYER_H = 32     // altura de cada fila de jugador
const COL_GAP = 56      // espacio horizontal entre columnas
const PADDING = 24      // padding top/left del canvas

export default function BracketPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const categoryId = params.categoryId as string

  const [matches, setMatches] = useState<Match[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState<number | null>(null)
  const [confirmingSlot, setConfirmingSlot] = useState<string | null>(null)

  useEffect(() => { setIsAdmin(!!localStorage.getItem('admin-token')) }, [])

  const fetchMatches = useCallback(async () => {
    const res = await fetch(`/api/elimination-matches?categoryId=${categoryId}`)
    if (res.ok) setMatches(await res.json())
  }, [categoryId])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  const setWinner = async (matchId: number, winnerId: number) => {
    setConfirmingSlot(null)
    setSaving(matchId)
    const token = localStorage.getItem('admin-token')
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
      const updated = await res.json()
      setMatches(updated) // actualizar estado directamente con la respuesta
    }
  }

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

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)
  const totalRounds = rounds.length
  
  const finalMatch = matches.find(m => m.round === totalRounds && m.match_number === 1)
  const isFinished = !!finalMatch?.winner_id

  const roundLabel = (round: number) => {
    const fromEnd = totalRounds - round
    if (fromEnd === 0) return 'Final'
    if (fromEnd === 1) return 'Semifinal'
    if (fromEnd === 2) return 'Cuartos'
    return `Ronda ${round}`
  }

  // ── Calcular posición Y de cada partido ──────────────────────────────────
  // En ronda 1 los partidos se apilan con un gap entre ellos.
  // El gap entre partidos se duplica en cada ronda siguiente.
  // Cada partido de ronda N se centra entre sus dos hijos de ronda N-1.

  const LABEL_H = 28  // altura reservada para la etiqueta de ronda

  // Gap entre cards en ronda 1
  const BASE_GAP = 20

  // Posición Y del centro de cada card por ronda
  // matchY[round][matchNumber] = top Y de la card
  const matchY: Record<number, Record<number, number>> = {}

  // Ronda 1
  const r1Matches = matches.filter(m => m.round === 1).sort((a, b) => a.match_number - b.match_number)
  matchY[1] = {}
  r1Matches.forEach((m, i) => {
    matchY[1][m.match_number] = PADDING + LABEL_H + i * (CARD_H + BASE_GAP)
  })

  // Rondas siguientes
  for (let r = 2; r <= totalRounds; r++) {
    matchY[r] = {}
    const rMatches = matches.filter(m => m.round === r).sort((a, b) => a.match_number - b.match_number)
    rMatches.forEach(m => {
      const c1 = matchY[r - 1]?.[m.match_number * 2 - 1]
      const c2 = matchY[r - 1]?.[m.match_number * 2]
      if (c1 !== undefined && c2 !== undefined) {
        // centrar entre los dos hijos
        matchY[r][m.match_number] = (c1 + c2) / 2 + (CARD_H / 2) - CARD_H / 2
      } else if (c1 !== undefined) {
        matchY[r][m.match_number] = c1
      }
    })
  }

  // Dimensiones totales del canvas
  const canvasW = PADDING + totalRounds * (CARD_W + COL_GAP) - COL_GAP + PADDING
  const allYs = Object.values(matchY).flatMap(r => Object.values(r))
  const canvasH = Math.max(...allYs) + CARD_H + PADDING

  // X de cada columna
  const colX = (round: number) => PADDING + (round - 1) * (CARD_W + COL_GAP)

  return (
    <div className="min-h-screen bg-background">
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href={`/tournament/${tournamentId}/category/${categoryId}`} className="text-cyan-400 hover:text-cyan-300 text-sm">
            ← Volver
          </Link>
          <h1 className="text-xl font-bold text-foreground">Llaves de Eliminación</h1>
          {isAdmin && (
            <span className="text-xs text-muted-foreground">· Haz clic en un jugador para marcarlo ganador</span>
          )}
        </div>
      </header>

      <main className="py-8 px-4 overflow-auto">
        <div style={{ position: 'relative', width: canvasW, height: canvasH }}>

          {/* ── Etiquetas de ronda ── */}
          {rounds.map(round => (
            <div
              key={`lbl-${round}`}
              style={{ position: 'absolute', top: PADDING, left: colX(round), width: CARD_W }}
              className="text-center text-xs font-semibold text-cyan-400 uppercase tracking-wider"
            >
              {roundLabel(round)}
            </div>
          ))}

          {/* ── SVG líneas conectoras ── */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH, overflow: 'visible' }}
            className="pointer-events-none"
          >
            {rounds.slice(0, -1).map(round => {
              const nextRound = round + 1
              const nextMatches = matches.filter(m => m.round === nextRound)

              return nextMatches.map(parent => {
                const c1Num = parent.match_number * 2 - 1
                const c2Num = parent.match_number * 2
                const y1 = matchY[round]?.[c1Num]
                const y2 = matchY[round]?.[c2Num]
                const yP = matchY[nextRound]?.[parent.match_number]

                if (y1 === undefined || y2 === undefined || yP === undefined) return null

                // Puntos de conexión:
                // - Sale del borde derecho de cada card hijo, a la altura del centro de la card
                // - Línea vertical que une los dos hijos
                // - Línea horizontal que va al borde izquierdo del partido padre

                const xRight = colX(round) + CARD_W          // borde derecho de los hijos
                const xLeft  = colX(nextRound)                // borde izquierdo del padre
                const xMid   = xRight + COL_GAP / 2           // punto medio horizontal

                const cy1 = y1 + CARD_H / 2   // centro vertical hijo 1
                const cy2 = y2 + CARD_H / 2   // centro vertical hijo 2
                const cyP = yP + CARD_H / 2   // centro vertical padre

                return (
                  <g key={`conn-${round}-${parent.match_number}`}>
                    {/* Línea horizontal desde hijo 1 hasta xMid */}
                    <line x1={xRight} y1={cy1} x2={xMid} y2={cy1} stroke="hsl(var(--border))" strokeWidth="1.5" />
                    {/* Línea horizontal desde hijo 2 hasta xMid */}
                    <line x1={xRight} y1={cy2} x2={xMid} y2={cy2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                    {/* Línea vertical que une los dos en xMid */}
                    <line x1={xMid} y1={cy1} x2={xMid} y2={cy2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                    {/* Línea horizontal desde xMid hasta el padre */}
                    <line x1={xMid} y1={cyP} x2={xLeft} y2={cyP} stroke="hsl(var(--border))" strokeWidth="1.5" />
                  </g>
                )
              })
            })}
          </svg>

          {/* ── Cards de partidos ── */}
          {matches.map(match => {
            const x = colX(match.round)
            const y = matchY[match.round]?.[match.match_number] ?? 0
            
            const nextMatch = matches.find(m => m.round === match.round + 1 && m.match_number === Math.ceil(match.match_number / 2))
            const canSetWinner = isAdmin && !isFinished && !match.bye && !!match.player1_id && !!match.player2_id && (!nextMatch || !nextMatch.winner_id)

            return (
              <div
                key={match.id}
                style={{ position: 'absolute', left: x, top: y, width: CARD_W, height: CARD_H }}
                className="rounded-lg border border-border bg-card overflow-hidden shadow-sm"
              >
                <PlayerRow
                  name={match.player1_name}
                  playerId={match.player1_id}
                  winnerId={match.winner_id}
                  canClick={!!canSetWinner}
                  saving={saving === match.id}
                  onClick={() => match.player1_id && setWinner(match.id, match.player1_id)}
                  position={match.round === 1 ? match.match_number * 2 - 1 : undefined}
                  isConfirming={confirmingSlot === `${match.id}-${match.player1_id}`}
                  onStartConfirm={() => match.player1_id && setConfirmingSlot(`${match.id}-${match.player1_id}`)}
                  onCancelConfirm={() => setConfirmingSlot(null)}
                />
                <div className="border-t border-border/50 mx-2" />
                <PlayerRow
                  name={match.bye ? 'BYE' : match.player2_name}
                  playerId={match.player2_id}
                  winnerId={match.winner_id}
                  canClick={!!canSetWinner && match.bye !== true && match.bye !== 'true'}
                  saving={saving === match.id}
                  onClick={() => match.player2_id && setWinner(match.id, match.player2_id)}
                  position={match.round === 1 ? match.match_number * 2 : undefined}
                  isConfirming={confirmingSlot === `${match.id}-${match.player2_id}`}
                  onStartConfirm={() => match.player2_id && setConfirmingSlot(`${match.id}-${match.player2_id}`)}
                  onCancelConfirm={() => setConfirmingSlot(null)}
                />
              </div>
            )
          })}

        </div>
      </main>
    </div>
  )
}

function PlayerRow({
  name, playerId, winnerId, canClick, saving, onClick, position, isConfirming, onStartConfirm, onCancelConfirm
}: {
  name: string | null
  playerId: number | null
  winnerId: number | null
  canClick: boolean
  saving: boolean
  onClick: () => void
  position?: number
  isConfirming?: boolean
  onStartConfirm?: () => void
  onCancelConfirm?: () => void
}) {
  const isWinner = !!playerId && winnerId === playerId
  const isLoser  = !!winnerId && !!playerId && winnerId !== playerId

  useEffect(() => {
    if (isConfirming && onCancelConfirm) {
      onCancelConfirm()
    }
  }, [winnerId, playerId])

  const handleClick = () => {
    if (!canClick || saving) return
    if (!isConfirming && onStartConfirm) {
      onStartConfirm()
    }
  }

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCancelConfirm) onCancelConfirm()
    onClick()
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCancelConfirm) onCancelConfirm()
  }

  return (
    <div
      onClick={handleClick}
      style={{ height: PLAYER_H }}
      className={`w-full flex items-center gap-2 px-3 text-xs transition-all
        ${canClick ? 'hover:bg-cyan-500/10 cursor-pointer' : 'cursor-default'}
        ${isWinner ? 'bg-cyan-500/10' : ''}
        ${saving ? 'opacity-50' : ''}
      `}
    >
      {/* Position */}
      {position !== undefined && (
        <span className="text-[10px] text-muted-foreground/60 w-4 font-mono text-left select-none">
          {position}
        </span>
      )}

      {/* Indicador */}
      <span className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
        isWinner ? 'bg-cyan-500 border-cyan-500' : 'border-border'
      }`}>
        {isWinner && (
          <svg className="w-2 h-2 text-slate-900" fill="none" viewBox="0 0 8 8">
            <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>

      {/* Nombre */}
      <span className={`flex-1 text-left truncate font-medium ${
        isWinner ? 'text-cyan-400' :
        isLoser  ? 'text-muted-foreground/40 line-through' :
        !playerId ? 'text-muted-foreground/40 italic font-normal' :
        'text-foreground'
      }`}>
        {name ?? 'Por definir'}
      </span>

      {/* Confirmación */}
      {isConfirming && (
        <div className="flex gap-1 ml-auto">
          <button
            onClick={handleConfirm}
            className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400"
          >✓</button>
          <button
            onClick={handleCancel}
            className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground"
          >✕</button>
        </div>
      )}
    </div>
  )
}

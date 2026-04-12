import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const groupId = searchParams.get('groupId')

    if (!categoryId) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })

    if (groupId) {
      const standings = await getGroupStandings(parseInt(groupId))
      return NextResponse.json(standings)
    }

    const groupsResult = await pool.query('SELECT id FROM groups WHERE category_id = $1 ORDER BY name', [categoryId])
    const groupStandings = []
    for (const group of groupsResult.rows) {
      groupStandings.push({ groupId: group.id, standings: await getGroupStandings(group.id) })
    }
    return NextResponse.json(groupStandings)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error calculating standings' }, { status: 500 })
  }
}

export async function getGroupStandings(groupId: number) {
  const playersResult = await pool.query(`
    SELECT p.id, p.name FROM players p
    JOIN group_players gp ON p.id = gp.player_id
    WHERE gp.group_id = $1 ORDER BY gp.position
  `, [groupId])
  const players = playersResult.rows

  const matchesResult = await pool.query(`
    SELECT * FROM round_robin_matches WHERE group_id = $1 AND result IS NOT NULL
  `, [groupId])
  const matches = matchesResult.rows

  const statsMap: Record<number, any> = {}
  for (const p of players) {
    statsMap[p.id] = { id: p.id, name: p.name, played: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0 }
  }

  for (const m of matches) {
    const parts = m.result?.split('-').map((n: string) => parseInt(n))
    if (!parts || parts.length !== 2) continue
    const [s1, s2] = parts
    if (statsMap[m.player1_id]) {
      statsMap[m.player1_id].played++
      statsMap[m.player1_id].setsWon += s1
      statsMap[m.player1_id].setsLost += s2
      if (m.winner_id === m.player1_id) statsMap[m.player1_id].wins++
      else statsMap[m.player1_id].losses++
    }
    if (statsMap[m.player2_id]) {
      statsMap[m.player2_id].played++
      statsMap[m.player2_id].setsWon += s2
      statsMap[m.player2_id].setsLost += s1
      if (m.winner_id === m.player2_id) statsMap[m.player2_id].wins++
      else statsMap[m.player2_id].losses++
    }
  }

  const stats = Object.values(statsMap).map((s: any) => ({
    ...s,
    setDiff: s.setsWon - s.setsLost,
    setRatio: s.setsLost > 0 ? s.setsWon / s.setsLost : s.setsWon > 0 ? 999 : 0,
    manualTiebreak: null as number | null,
  }))

  // Check manual tiebreak overrides
  const tiebreakResult = await pool.query(
    'SELECT player_id, position FROM manual_tiebreaks WHERE group_id = $1', [groupId]
  ).catch(() => ({ rows: [] }))
  for (const tb of tiebreakResult.rows) {
    const s = stats.find(x => x.id === tb.player_id)
    if (s) s.manualTiebreak = tb.position
  }

  stats.sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins

    // Check if tied on wins
    const tiedPlayers = stats.filter(s => s.wins === a.wins)
    if (tiedPlayers.length === 2) {
      // Head to head
      const h2h = matches.find(m =>
        (m.player1_id === a.id && m.player2_id === b.id) ||
        (m.player1_id === b.id && m.player2_id === a.id)
      )
      if (h2h?.winner_id === a.id) return -1
      if (h2h?.winner_id === b.id) return 1
    } else if (tiedPlayers.length >= 3) {
      // Among tied: set ratio
      const tiedIds = tiedPlayers.map(p => p.id)
      const tiedMatches = matches.filter(m =>
        tiedIds.includes(m.player1_id) && tiedIds.includes(m.player2_id)
      )
      const ratioA = calcRatioAmong(a.id, tiedMatches)
      const ratioB = calcRatioAmong(b.id, tiedMatches)
      if (Math.abs(ratioA - ratioB) > 0.0001) return ratioB - ratioA
      // Manual tiebreak
      if (a.manualTiebreak !== null && b.manualTiebreak !== null) return a.manualTiebreak - b.manualTiebreak
    }

    if (a.setDiff !== b.setDiff) return b.setDiff - a.setDiff
    return b.setsWon - a.setsWon
  })

  return stats
}

function calcRatioAmong(playerId: number, matches: any[]) {
  let won = 0, lost = 0
  for (const m of matches) {
    const parts = m.result?.split('-').map((n: string) => parseInt(n))
    if (!parts || parts.length !== 2) continue
    if (m.player1_id === playerId) { won += parts[0]; lost += parts[1] }
    else if (m.player2_id === playerId) { won += parts[1]; lost += parts[0] }
  }
  return lost > 0 ? won / lost : won > 0 ? 999 : 0
}

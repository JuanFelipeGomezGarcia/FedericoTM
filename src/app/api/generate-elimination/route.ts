import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getGroupStandings } from '../standings/route'

export async function POST(request: NextRequest) {
  try {
    const { categoryId } = await request.json()

    const categoryResult = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId])
    const category = categoryResult.rows[0]
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    // Delete existing elimination matches
    await pool.query('DELETE FROM elimination_matches WHERE category_id = $1', [categoryId])

    const groupsResult = await pool.query('SELECT id FROM groups WHERE category_id = $1 ORDER BY name', [categoryId])
    const groups = groupsResult.rows

    // Get qualified players per group in order
    const qualifiedPerGroup: any[][] = []
    for (const group of groups) {
      const standings = await getGroupStandings(group.id)
      qualifiedPerGroup.push(standings.slice(0, category.qualified_per_group))
    }

    // Build seeded list: 1st of G1, 1st of G2, ..., 2nd of G1, 2nd of G2, ...
    const seededPlayers: any[] = []
    const maxQualified = Math.max(...qualifiedPerGroup.map(g => g.length))
    for (let rank = 0; rank < maxQualified; rank++) {
      for (const groupQ of qualifiedPerGroup) {
        if (groupQ[rank]) seededPlayers.push(groupQ[rank])
      }
    }

    const totalSeeds = seededPlayers.length
    if (totalSeeds < 2) return NextResponse.json({ error: 'Not enough qualified players' }, { status: 400 })

    // Bracket size: next power of 2
    const bracketSize = nextPow2(totalSeeds)

    // Posiciones estándar de bracket: seed1 arriba, seed2 abajo, enfrentados en la final
    // Para bracketSize=8: matches son (1v8),(5v4),(3v6),(7v2) → seed1 arriba, seed2 abajo
    const seedSlots = buildBracketSlots(bracketSize)
    // seedSlots[i] = número de seed que va en la posición i (0-indexed)
    // Los byes van a los mejores seeds: si hay 6 jugadores y bracket de 8,
    // seeds 1 y 2 reciben bye (posiciones donde el rival sería seed 7 u 8 que no existen)

    // Construir array de jugadores por slot: null = BYE
    const slots: (any | null)[] = seedSlots.map(seed =>
      seed <= totalSeeds ? seededPlayers[seed - 1] : null
    )

    // Round 1: bracketSize/2 matches
    const round1Matches = bracketSize / 2
    for (let i = 0; i < round1Matches; i++) {
      const p1 = slots[i * 2]
      const p2 = slots[i * 2 + 1]
      const isBye = p1 === null || p2 === null
      await pool.query(
        'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye, next_match_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [categoryId, 1, i + 1, p1?.id || null, p2?.id || null, isBye, Math.floor(i / 2) + 1]
      )
    }

    // Generate subsequent rounds as empty placeholders
    const numRounds = Math.log2(bracketSize)
    for (let r = 2; r <= numRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r)
      for (let m = 1; m <= matchesInRound; m++) {
        await pool.query(
          'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye, next_match_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [categoryId, r, m, null, null, false, r < numRounds ? Math.ceil(m / 2) : null]
        )
      }
    }

    // Auto-advance BYE winners in round 1
    const byeMatches = await pool.query(
      'SELECT * FROM elimination_matches WHERE category_id = $1 AND round = 1 AND bye = true',
      [categoryId]
    )
    for (const bm of byeMatches.rows) {
      const winnerId = bm.player1_id || bm.player2_id
      if (winnerId) {
        await pool.query('UPDATE elimination_matches SET winner_id = $1 WHERE id = $2', [winnerId, bm.id])
        await advanceWinner(categoryId, 1, bm.match_number, winnerId)
      }
    }

    return NextResponse.json({ message: 'Elimination bracket generated', bracketSize, totalSeeds })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error generating elimination bracket' }, { status: 500 })
  }
}

async function advanceWinner(categoryId: number, round: number, matchNumber: number, winnerId: number) {
  const currentMatch = await pool.query(
    'SELECT next_match_number FROM elimination_matches WHERE category_id = $1 AND round = $2 AND match_number = $3',
    [categoryId, round, matchNumber]
  )
  console.log('[advanceWinner] currentMatch rows:', currentMatch.rows)
  if (currentMatch.rows.length === 0) return
  const nextMatchNum = currentMatch.rows[0].next_match_number
  console.log('[advanceWinner] next_match_number:', nextMatchNum)
  if (!nextMatchNum) return

  const nextRound = round + 1
  const isPlayer1Slot = matchNumber % 2 === 1
  console.log('[advanceWinner] advancing to round:', nextRound, 'match:', nextMatchNum, 'slot:', isPlayer1Slot ? 'player1' : 'player2')

  const nextMatch = await pool.query(
    'SELECT * FROM elimination_matches WHERE category_id = $1 AND round = $2 AND match_number = $3',
    [categoryId, nextRound, nextMatchNum]
  )
  console.log('[advanceWinner] nextMatch rows:', nextMatch.rows.length)
  if (nextMatch.rows.length === 0) return

  const field = isPlayer1Slot ? 'player1_id' : 'player2_id'
  const res = await pool.query(
    `UPDATE elimination_matches SET ${field} = $1 WHERE category_id = $2 AND round = $3 AND match_number = $4 RETURNING id`,
    [winnerId, categoryId, nextRound, nextMatchNum]
  )
  console.log('[advanceWinner] updated next match id:', res.rows[0]?.id)
}

function nextPow2(n: number) {
  let p = 1
  while (p < n) p *= 2
  return p
}

// Algoritmo estándar de bracket:
// seed1 arriba (slot 0), seed2 abajo (slot size-1), nunca se pueden encontrar antes de la final
// Los byes van contra los mejores seeds (seeds 1, 2, 3... en orden)
function buildBracketSlots(size: number): number[] {
  let slots = [1]
  while (slots.length < size) {
    const next: number[] = []
    const len = slots.length * 2 + 1
    for (const s of slots) {
      next.push(s)
      next.push(len - s)
    }
    slots = next
  }
  return slots
}

export { advanceWinner }

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Helper to find next power of 2
function nextPow2(n: number) {
  let p = 1
  while (p < n) p *= 2
  return p
}

// Helper to build standard ITTF slots
function buildStandardSlots(size: number): number[] {
  let slots = [1, 2]
  let rounds = Math.log2(size)
  for (let r = 1; r < rounds; r++) {
    let nextSlots: number[] = []
    let sum = Math.pow(2, r + 1) + 1
    for (let i = 0; i < slots.length; i++) {
        let val = slots[i]
        if (i % 2 === 0) {
            nextSlots.push(val, sum - val)
        } else {
            nextSlots.push(sum - val, val)
        }
    }
    slots = nextSlots
  }
  return size === 1 ? [1] : slots
}

const advanceWinner = async (categoryId: number, round: number, matchNumber: number, winnerId: number) => {
  const currentMatch = await pool.query(
    'SELECT next_match_number FROM elimination_matches WHERE category_id = $1 AND round = $2 AND match_number = $3',
    [categoryId, round, matchNumber]
  )
  if (currentMatch.rows.length === 0) return
  const nextMatchNum = currentMatch.rows[0].next_match_number
  if (!nextMatchNum) return

  const nextRound = round + 1
  const isPlayer1Slot = matchNumber % 2 === 1

  const nextMatch = await pool.query(
    'SELECT * FROM elimination_matches WHERE category_id = $1 AND round = $2 AND match_number = $3',
    [categoryId, nextRound, nextMatchNum]
  )
  if (nextMatch.rows.length === 0) return

  const field = isPlayer1Slot ? 'player1_id' : 'player2_id'
  await pool.query(
    `UPDATE elimination_matches SET ${field} = $1 WHERE category_id = $2 AND round = $3 AND match_number = $4`,
    [winnerId, categoryId, nextRound, nextMatchNum]
  )
}

export async function POST(request: NextRequest) {
  try {
    const { categoryId, playerName } = await request.json()

    // 1. Check if winners exist (excluding BYEs)
    const winnersRes = await pool.query(
      'SELECT id FROM elimination_matches WHERE category_id = $1 AND winner_id IS NOT NULL AND bye = false',
      [categoryId]
    )
    if (winnersRes.rows.length > 0) {
      return NextResponse.json({ error: 'Cannot add players once results are recorded' }, { status: 400 })
    }

    // 2. Create the new player record (or find existing)
    const playerRes = await pool.query(
      'INSERT INTO players (name) VALUES ($1) RETURNING id',
      [playerName]
    )
    const newPlayerId = playerRes.rows[0].id

    // 3. Check for available BYE slot in Round 1
    const r1MatchesRes = await pool.query(
      'SELECT id, player1_id, player2_id, match_number FROM elimination_matches WHERE category_id = $1 AND round = 1 ORDER BY match_number',
      [categoryId]
    )
    const r1Matches = r1MatchesRes.rows
    const bracketSize = r1Matches.length * 2
    const slots = buildStandardSlots(bracketSize)

    // Find all matches with exactly one NULL player
    const candidateMatches = r1Matches
      .filter(m => !m.player1_id || !m.player2_id)
      .map(m => {
        // Find the seed of the EXISTING player in this match
        const s1 = slots[(m.match_number - 1) * 2]
        const s2 = slots[(m.match_number - 1) * 2 + 1]
        const existingSeed = m.player1_id ? s1 : s2
        return { ...m, existingSeed }
      })
      // Sort by seed descending: the highest seed number (lowest rank) loses their BYE first
      .sort((a, b) => b.existingSeed - a.existingSeed)

    const targetMatch = candidateMatches[0]

    if (targetMatch) {
      // SCENARIO A: SURGICAL INSERTION (No Expansion)
      console.log('[ADD PLAYER] Surgical insertion into match', targetMatch.match_number, 'pairing with seed', targetMatch.existingSeed)
      const field = !targetMatch.player1_id ? 'player1_id' : 'player2_id'
      
      // Update the match
      await pool.query(
        `UPDATE elimination_matches SET ${field} = $1, bye = false, winner_id = NULL WHERE id = $2`,
        [newPlayerId, targetMatch.id]
      )

      // Since it's no longer a BYE, we MUST clear the winner in the next round
      const nextMatchResult = await pool.query(
        'SELECT next_match_number FROM elimination_matches WHERE id = $1',
        [targetMatch.id]
      )
      const nmn = nextMatchResult.rows[0]?.next_match_number
      if (nmn) {
        const isP1 = targetMatch.match_number % 2 === 1
        const nfield = isP1 ? 'player1_id' : 'player2_id'
        await pool.query(
          `UPDATE elimination_matches SET ${nfield} = NULL WHERE category_id = $1 AND round = 2 AND match_number = $2`,
          [categoryId, nmn]
        )
      }
    } else {
      // SCENARIO B: EXPANSION (Power of 2 jump)
      console.log('[ADD PLAYER] Bracket full, expanding...')
      
      // 1. Get all current players and their positions
      const currentPlayersRes = await pool.query(`
        SELECT em.round, em.match_number, em.player1_id, em.player2_id
        FROM elimination_matches em
        WHERE em.category_id = $1 AND em.round = 1
        ORDER BY em.match_number
      `, [categoryId])
      
      const currentR1 = currentPlayersRes.rows
      const bracketSize = currentR1.length * 2
      const newBracketSize = bracketSize * 2
      const oldSlots = buildStandardSlots(bracketSize)
      const newSlots = buildStandardSlots(newBracketSize)

      // Map existing players to their Seeds
      const seedToPlayer = new Map<number, number>()
      currentR1.forEach((m, idx) => {
        const s1 = oldSlots[idx * 2]
        const s2 = oldSlots[idx * 2 + 1]
        if (m.player1_id) seedToPlayer.set(s1, m.player1_id)
        if (m.player2_id) seedToPlayer.set(s2, m.player2_id)
      })

      // Add new player as the next available seed (Seed N+1)
      const nextSeed = Array.from({length: newBracketSize}, (_, i) => i + 1).find(s => !seedToPlayer.has(s)) || (bracketSize + 1)
      seedToPlayer.set(nextSeed, newPlayerId)

      // Rebuild!
      await pool.query('DELETE FROM elimination_matches WHERE category_id = $1', [categoryId])
      
      const hasNextRound = Math.log2(newBracketSize) > 1
      for (let i = 0; i < newBracketSize / 2; i++) {
        const seed1 = newSlots[i * 2]
        const seed2 = newSlots[i * 2 + 1]
        const p1 = seedToPlayer.get(seed1) || null
        const p2 = seedToPlayer.get(seed2) || null
        const isMatchBye = !p1 || !p2
        const nextMatchNumber = hasNextRound ? Math.floor(i / 2) + 1 : null
        await pool.query(
          'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye, next_match_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [categoryId, 1, i + 1, p1, p2, isMatchBye, nextMatchNumber]
        )
      }

      const numRounds = Math.log2(newBracketSize)
      for (let r = 2; r <= numRounds; r++) {
        const matchesInRound = newBracketSize / Math.pow(2, r)
        for (let m = 1; m <= matchesInRound; m++) {
          await pool.query(
            'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye, next_match_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [categoryId, r, m, null, null, false, r < numRounds ? Math.ceil(m / 2) : null]
          )
        }
      }

      // Advance BYEs
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
    }

    // 6. Return updated matches with joins
    const result = await pool.query(`
      SELECT em.*,
             p1.name as player1_name,
             p2.name as player2_name,
             w.name as winner_name
      FROM elimination_matches em
      LEFT JOIN players p1 ON em.player1_id = p1.id
      LEFT JOIN players p2 ON em.player2_id = p2.id
      LEFT JOIN players w ON em.winner_id = w.id
      WHERE em.category_id = $1
      ORDER BY em.round, em.match_number
    `, [categoryId])

    return NextResponse.json(result.rows.map((r: any) => ({ ...r, bye: r.bye === true || r.bye === 't' || r.bye === 'true' })))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error adding player to bracket' }, { status: 500 })
  }
}

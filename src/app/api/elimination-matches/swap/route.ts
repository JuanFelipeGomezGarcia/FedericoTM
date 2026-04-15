import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { advanceWinner } from '../../generate-elimination/route'

export async function POST(request: NextRequest) {
  try {
    const { matchAId, slotA, matchBId, slotB } = await request.json()

    // 1. Get both matches
    const resA = await pool.query('SELECT * FROM elimination_matches WHERE id = $1', [matchAId])
    const resB = await pool.query('SELECT * FROM elimination_matches WHERE id = $1', [matchBId])

    const matchA = resA.rows[0]
    const matchB = resB.rows[0]

    if (!matchA || !matchB) {
      return NextResponse.json({ error: 'Matches not found' }, { status: 404 })
    }

    // Security check: No winners should be registered in the category (except automatic BYE winners)
    const categoryId = matchA.category_id
    const winnersRes = await pool.query(
      'SELECT id FROM elimination_matches WHERE category_id = $1 AND winner_id IS NOT NULL AND bye = false',
      [categoryId]
    )
    if (winnersRes.rows.length > 0) {
      return NextResponse.json({ error: 'Cannot swap players after tournament has started results' }, { status: 400 })
    }

    // 2. Extract values
    const playerAId = slotA === 'p1' ? matchA.player1_id : matchA.player2_id
    const playerBId = slotB === 'p1' ? matchB.player1_id : matchB.player2_id

    // 3. Swap in memory for Match A
    const newMatchA = { ...matchA }
    if (slotA === 'p1') newMatchA.player1_id = playerBId
    else newMatchA.player2_id = playerBId

    // Swap in memory for Match B
    const newMatchB = { ...matchB }
    if (slotB === 'p1') newMatchB.player1_id = playerAId
    else newMatchB.player2_id = playerAId

    // 4. Update BYE status
    newMatchA.bye = !newMatchA.player1_id || !newMatchA.player2_id
    newMatchB.bye = !newMatchB.player1_id || !newMatchB.player2_id

    // Update Winner for Match A if BYE
    if (newMatchA.bye) {
      newMatchA.winner_id = newMatchA.player1_id || newMatchA.player2_id
    } else {
      newMatchA.winner_id = null
    }

    // Update Winner for Match B if BYE
    if (newMatchB.bye) {
      newMatchB.winner_id = newMatchB.player1_id || newMatchB.player2_id
    } else {
      newMatchB.winner_id = null
    }

    // 5. Save to DB
    await pool.query(
      'UPDATE elimination_matches SET player1_id = $1, player2_id = $2, bye = $3, winner_id = $4 WHERE id = $5',
      [newMatchA.player1_id, newMatchA.player2_id, newMatchA.bye, newMatchA.winner_id, matchAId]
    )
    await pool.query(
      'UPDATE elimination_matches SET player1_id = $1, player2_id = $2, bye = $3, winner_id = $4 WHERE id = $5',
      [newMatchB.player1_id, newMatchB.player2_id, newMatchB.bye, newMatchB.winner_id, matchBId]
    )

    // 6. Advance winners if they were BYEs
    if (newMatchA.winner_id) {
      await advanceWinner(categoryId, newMatchA.round, newMatchA.match_number, newMatchA.winner_id)
    } else {
      // Clear winner in next round if it was a BYE before
      await clearWinnerInNextRound(categoryId, newMatchA.round, newMatchA.match_number)
    }

    if (newMatchB.winner_id) {
      await advanceWinner(categoryId, newMatchB.round, newMatchB.match_number, newMatchB.winner_id)
    } else {
      await clearWinnerInNextRound(categoryId, newMatchB.round, newMatchB.match_number)
    }

    const updatedMatches = await pool.query(`
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

    return NextResponse.json(updatedMatches.rows.map((r: any) => ({ ...r, bye: r.bye === true || r.bye === 't' || r.bye === 'true' })))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error swapping players' }, { status: 500 })
  }
}

async function clearWinnerInNextRound(categoryId: number, round: number, matchNumber: number) {
  const currentMatch = await pool.query(
    'SELECT next_match_number FROM elimination_matches WHERE category_id = $1 AND round = $2 AND match_number = $3',
    [categoryId, round, matchNumber]
  )
  if (currentMatch.rows.length === 0) return
  const nextMatchNum = currentMatch.rows[0].next_match_number
  if (!nextMatchNum) return

  const nextRound = round + 1
  const isPlayer1Slot = matchNumber % 2 === 1
  const field = isPlayer1Slot ? 'player1_id' : 'player2_id'

  await pool.query(
    `UPDATE elimination_matches SET ${field} = NULL WHERE category_id = $1 AND round = $2 AND match_number = $3`,
    [categoryId, nextRound, nextMatchNum]
  )
}

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { categoryId } = await request.json()

    // Get qualified players from round robin phase
    const qualifiedPlayers = await getQualifiedPlayers(categoryId)

    if (qualifiedPlayers.length < 2) {
      return NextResponse.json({ error: 'Not enough qualified players for elimination phase' }, { status: 400 })
    }

    // Generate elimination bracket
    const bracket = generateEliminationBracket(qualifiedPlayers)

    // Insert matches into database
    for (const match of bracket) {
      await pool.query(
        'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye) VALUES ($1, $2, $3, $4, $5, $6)',
        [categoryId, match.round, match.matchNumber, match.player1?.id || null, match.player2?.id || null, match.bye]
      )
    }

    return NextResponse.json({ message: 'Elimination bracket generated successfully' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error generating elimination bracket' }, { status: 500 })
  }
}

async function getQualifiedPlayers(categoryId: number) {
  // Get players ranked by their performance in round robin
  const result = await pool.query(`
    SELECT p.id, p.name,
           COUNT(CASE WHEN rrm.winner_id = p.id THEN 1 END) as wins,
           COUNT(rrm.id) as total_matches
    FROM players p
    JOIN round_robin_matches rrm ON (rrm.player1_id = p.id OR rrm.player2_id = p.id)
    WHERE p.category_id = $1 AND rrm.result IS NOT NULL
    GROUP BY p.id, p.name
    ORDER BY wins DESC, total_matches ASC
  `, [categoryId])

  return result.rows
}

function generateEliminationBracket(players: any[]) {
  const matches = []
  const numPlayers = players.length

  // Determine number of rounds needed
  const numRounds = Math.ceil(Math.log2(numPlayers))

  // First round
  let round = 1
  let matchNumber = 1

  // Sort players by ranking
  const sortedPlayers = players.sort((a, b) => b.wins - a.wins || a.total_matches - b.total_matches)

  // Create first round matches
  for (let i = 0; i < sortedPlayers.length; i += 2) {
    const player1 = sortedPlayers[i]
    const player2 = sortedPlayers[i + 1]

    if (player2) {
      matches.push({
        round,
        matchNumber,
        player1,
        player2,
        bye: false
      })
    } else {
      // Bye for odd number of players
      matches.push({
        round,
        matchNumber,
        player1,
        player2: null,
        bye: true
      })
    }
    matchNumber++
  }

  // Generate subsequent rounds (placeholders for now)
  for (let r = 2; r <= numRounds; r++) {
    const matchesInRound = Math.pow(2, numRounds - r)
    for (let m = 1; m <= matchesInRound; m++) {
      matches.push({
        round: r,
        matchNumber: m,
        player1: null,
        player2: null,
        bye: false
      })
    }
  }

  return matches
}
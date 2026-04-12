import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { categoryId } = await request.json()

    // Get category info
    const categoryResult = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId])
    const category = categoryResult.rows[0]

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Get groups for this category
    const groupsResult = await pool.query('SELECT * FROM groups WHERE category_id = $1 ORDER BY name', [categoryId])
    const groups = groupsResult.rows

    // Generate round robin matches for each group
    for (const group of groups) {
      // Get players in this group
      const playersResult = await pool.query(`
        SELECT p.* FROM players p
        JOIN group_players gp ON p.id = gp.player_id
        WHERE gp.group_id = $1
        ORDER BY gp.position
      `, [group.id])

      const players = playersResult.rows

      // Generate round robin schedule
      const matches = generateRoundRobinMatches(players)

      // Insert matches
      for (const match of matches) {
        await pool.query(
          'INSERT INTO round_robin_matches (category_id, group_id, player1_id, player2_id) VALUES ($1, $2, $3, $4)',
          [categoryId, group.id, match.player1.id, match.player2.id]
        )
      }
    }

    return NextResponse.json({ message: 'Round robin matches generated successfully' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error generating round robin matches' }, { status: 500 })
  }
}

function generateRoundRobinMatches(players: any[]) {
  const matches = []
  const n = players.length

  if (n < 2) return matches

  // If odd number of players, add a bye round
  const hasBye = n % 2 === 1
  const rounds = hasBye ? n : n - 1

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const player1 = players[i]
      const player2 = players[n - 1 - i]

      if (player1 && player2) {
        matches.push({
          player1,
          player2,
          round: round + 1
        })
      }
    }

    // Rotate players (keep first player fixed, rotate others)
    const first = players.shift()
    players.push(first!)
  }

  return matches
}
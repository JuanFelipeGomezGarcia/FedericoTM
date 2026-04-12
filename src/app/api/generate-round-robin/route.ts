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
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({ player1: players[i], player2: players[j] })
    }
  }
  return matches
}
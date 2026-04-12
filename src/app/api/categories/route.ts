import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT c.*, t.name as tournament_name
      FROM categories c
      JOIN tournaments t ON c.tournament_id = t.id
      ORDER BY c.id
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tournament_id, name, players_per_group, qualified_per_group, players } = await request.json()

    // Insert category
    const categoryResult = await pool.query(
      'INSERT INTO categories (tournament_id, name, players_per_group, qualified_per_group) VALUES ($1, $2, $3, $4) RETURNING *',
      [tournament_id, name, players_per_group, qualified_per_group]
    )
    const category = categoryResult.rows[0]

    // Insert players
    const playerNames = players.split('\n').map((name: string) => name.trim()).filter((name: string) => name)
    const playerInserts = playerNames.map((playerName: string) =>
      pool.query('INSERT INTO players (category_id, name) VALUES ($1, $2)', [category.id, playerName])
    )
    await Promise.all(playerInserts)

    // Create groups and distribute players
    const numGroups = Math.ceil(playerNames.length / players_per_group)
    const groupInserts = []
    for (let i = 0; i < numGroups; i++) {
      groupInserts.push(pool.query('INSERT INTO groups (category_id, name) VALUES ($1, $2) RETURNING id', [category.id, `Grupo ${i + 1}`]))
    }
    const groupResults = await Promise.all(groupInserts)
    const groupIds = groupResults.map(r => r.rows[0].id)

    // Distribute players in zig-zag
    const groupPlayers = []
    for (let i = 0; i < playerNames.length; i++) {
      const groupIndex = i % (2 * numGroups) < numGroups ? i % numGroups : numGroups - 1 - (i % numGroups)
      groupPlayers.push({ groupId: groupIds[groupIndex], playerIndex: i, position: Math.floor(i / numGroups) + 1 })
    }

    // Get player ids
    const playerResult = await pool.query('SELECT id FROM players WHERE category_id = $1 ORDER BY id', [category.id])
    const playerIds = playerResult.rows.map(p => p.id)

    // Insert group_players
    const gpInserts = groupPlayers.map(({ groupId, playerIndex, position }) =>
      pool.query('INSERT INTO group_players (group_id, player_id, position) VALUES ($1, $2, $3)', [groupId, playerIds[playerIndex], position])
    )
    await Promise.all(gpInserts)

    // Auto-generate round robin matches for each group
    for (const groupId of groupIds) {
      const playersResult = await pool.query(`
        SELECT p.* FROM players p
        JOIN group_players gp ON p.id = gp.player_id
        WHERE gp.group_id = $1 ORDER BY gp.position
      `, [groupId])
      const groupPlayersList = playersResult.rows
      const rMatches = generateRoundRobinMatches(groupPlayersList)
      for (const match of rMatches) {
        await pool.query(
          'INSERT INTO round_robin_matches (category_id, group_id, player1_id, player2_id) VALUES ($1, $2, $3, $4)',
          [category.id, groupId, match.player1.id, match.player2.id]
        )
      }
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error creating category' }, { status: 500 })
  }
}

function generateRoundRobinMatches(players: any[]) {
  const matches: { player1: any; player2: any }[] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({ player1: players[i], player2: players[j] })
    }
  }
  return matches
}
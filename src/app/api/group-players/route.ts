import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// POST: add player to group
export async function POST(request: NextRequest) {
  try {
    const { groupId, categoryId, name } = await request.json()

    // Insertar jugador
    const playerResult = await pool.query(
      'INSERT INTO players (category_id, name) VALUES ($1, $2) RETURNING *',
      [categoryId, name]
    )
    const player = playerResult.rows[0]

    // Asignar al grupo
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM group_players WHERE group_id = $1',
      [groupId]
    )
    const nextPos = posResult.rows[0].next_pos
    await pool.query(
      'INSERT INTO group_players (group_id, player_id, position) VALUES ($1, $2, $3)',
      [groupId, player.id, nextPos]
    )

    // Generar partidos contra todos los jugadores existentes del grupo
    const existingPlayers = await pool.query(
      'SELECT player_id FROM group_players WHERE group_id = $1 AND player_id != $2',
      [groupId, player.id]
    )
    for (const row of existingPlayers.rows) {
      await pool.query(
        'INSERT INTO round_robin_matches (category_id, group_id, player1_id, player2_id) VALUES ($1, $2, $3, $4)',
        [categoryId, groupId, row.player_id, player.id]
      )
    }

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error adding player' }, { status: 500 })
  }
}

// PUT: rename player
export async function PUT(request: NextRequest) {
  try {
    const { playerId, name } = await request.json()
    const result = await pool.query(
      'UPDATE players SET name = $1 WHERE id = $2 RETURNING *',
      [name, playerId]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error updating player' }, { status: 500 })
  }
}

// DELETE: remove player from group and delete player
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const groupId = searchParams.get('groupId')

    if (!playerId || !groupId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    await pool.query('DELETE FROM group_players WHERE group_id = $1 AND player_id = $2', [groupId, playerId])
    await pool.query('DELETE FROM round_robin_matches WHERE group_id = $1 AND (player1_id = $2 OR player2_id = $2)', [groupId, playerId])
    await pool.query('DELETE FROM players WHERE id = $1', [playerId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error deleting player' }, { status: 500 })
  }
}

// PATCH: move player to a different group
export async function PATCH(request: NextRequest) {
  try {
    const { playerId, fromGroupId, toGroupId, categoryId } = await request.json()

    if (!playerId || !fromGroupId || !toGroupId || !categoryId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Delete matches in the old group
    await pool.query(
      'DELETE FROM round_robin_matches WHERE group_id = $1 AND (player1_id = $2 OR player2_id = $2)',
      [fromGroupId, playerId]
    )

    // Find next position in new group
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM group_players WHERE group_id = $1',
      [toGroupId]
    )
    const nextPos = posResult.rows[0].next_pos

    // Update group assignment
    await pool.query(
      'UPDATE group_players SET group_id = $1, position = $2 WHERE group_id = $3 AND player_id = $4',
      [toGroupId, nextPos, fromGroupId, playerId]
    )

    // Generate matches in the new group
    const existingPlayers = await pool.query(
      'SELECT player_id FROM group_players WHERE group_id = $1 AND player_id != $2',
      [toGroupId, playerId]
    )
    for (const row of existingPlayers.rows) {
      await pool.query(
        'INSERT INTO round_robin_matches (category_id, group_id, player1_id, player2_id) VALUES ($1, $2, $3, $4)',
        [categoryId, toGroupId, row.player_id, playerId]
      )
    }

    // Re-index positions in the old group
    const oldPlayers = await pool.query(
      'SELECT player_id FROM group_players WHERE group_id = $1 ORDER BY position',
      [fromGroupId]
    )
    for (let i = 0; i < oldPlayers.rows.length; i++) {
      await pool.query(
        'UPDATE group_players SET position = $1 WHERE group_id = $2 AND player_id = $3',
        [i + 1, fromGroupId, oldPlayers.rows[i].player_id]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error moving player' }, { status: 500 })
  }
}

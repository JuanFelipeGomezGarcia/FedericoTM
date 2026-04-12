import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const groupId = searchParams.get('groupId')

    let query = `
      SELECT rrm.*,
             p1.name as player1_name,
             p2.name as player2_name,
             g.name as group_name
      FROM round_robin_matches rrm
      JOIN players p1 ON rrm.player1_id = p1.id
      LEFT JOIN players p2 ON rrm.player2_id = p2.id
      JOIN groups g ON rrm.group_id = g.id
    `
    let params: any[] = []

    if (categoryId) {
      query += ' WHERE rrm.category_id = $1'
      params = [categoryId]
    } else if (groupId) {
      query += ' WHERE rrm.group_id = $1'
      params = [groupId]
    }

    query += ' ORDER BY rrm.group_id, rrm.id'

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching round robin matches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category_id, group_id, player1_id, player2_id } = await request.json()
    const result = await pool.query(
      'INSERT INTO round_robin_matches (category_id, group_id, player1_id, player2_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [category_id, group_id, player1_id, player2_id]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating round robin match' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, result } = await request.json()

    // Validate format #-#
    if (result !== null && result !== '') {
      const regex = /^\d+-\d+$/
      if (!regex.test(result)) {
        return NextResponse.json({ error: 'Formato inválido. Usa #-# (ej: 3-1)' }, { status: 400 })
      }
    }

    let winner_id: number | null = null

    if (result && result !== '') {
      const matchResult = await pool.query('SELECT * FROM round_robin_matches WHERE id = $1', [id])
      const match = matchResult.rows[0]
      if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

      // Check category is not finished
      const catResult = await pool.query('SELECT is_finished FROM categories WHERE id = $1', [match.category_id])
      if (catResult.rows[0]?.is_finished) {
        return NextResponse.json({ error: 'Category is finished' }, { status: 403 })
      }

      const parts = result.split('-').map((n: string) => parseInt(n))
      const [s1, s2] = parts
      if (s1 > s2) winner_id = match.player1_id
      else if (s2 > s1) winner_id = match.player2_id
      else winner_id = null // draw (shouldn't happen in table tennis but handle gracefully)
    }

    const updated = await pool.query(
      'UPDATE round_robin_matches SET result = $1, winner_id = $2 WHERE id = $3 RETURNING *',
      [result || null, winner_id, id]
    )
    return NextResponse.json(updated.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error updating match result' }, { status: 500 })
  }
}

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

    query += ' ORDER BY rrm.id'

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

// PUT for updating match results
export async function PUT(request: NextRequest) {
  try {
    const { id, result, winner_id } = await request.json()
    const resultQuery = await pool.query(
      'UPDATE round_robin_matches SET result = $1, winner_id = $2 WHERE id = $3 RETURNING *',
      [result, winner_id, id]
    )
    return NextResponse.json(resultQuery.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error updating match result' }, { status: 500 })
  }
}
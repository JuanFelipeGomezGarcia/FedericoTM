import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    let query = `
      SELECT em.*,
             p1.name as player1_name,
             p2.name as player2_name
      FROM elimination_matches em
      LEFT JOIN players p1 ON em.player1_id = p1.id
      LEFT JOIN players p2 ON em.player2_id = p2.id
    `
    let params: any[] = []

    if (categoryId) {
      query += ' WHERE em.category_id = $1'
      params = [categoryId]
    }

    query += ' ORDER BY em.round, em.match_number'

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching elimination matches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category_id, round, match_number, player1_id, player2_id, bye } = await request.json()
    const result = await pool.query(
      'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [category_id, round, match_number, player1_id, player2_id, bye || false]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating elimination match' }, { status: 500 })
  }
}

// PUT for updating match results
export async function PUT(request: NextRequest) {
  try {
    const { id, result, winner_id } = await request.json()
    const resultQuery = await pool.query(
      'UPDATE elimination_matches SET result = $1, winner_id = $2 WHERE id = $3 RETURNING *',
      [result, winner_id, id]
    )
    return NextResponse.json(resultQuery.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error updating match result' }, { status: 500 })
  }
}
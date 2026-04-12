import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    let query = 'SELECT * FROM players'
    let params: any[] = []

    if (categoryId) {
      query += ' WHERE category_id = $1'
      params = [categoryId]
    }

    query += ' ORDER BY id'

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching players' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category_id, name } = await request.json()
    const result = await pool.query(
      'INSERT INTO players (category_id, name) VALUES ($1, $2) RETURNING *',
      [category_id, name]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating player' }, { status: 500 })
  }
}
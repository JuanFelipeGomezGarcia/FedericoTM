import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM tournaments ORDER BY date DESC')
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/tournaments error:', error)
    return NextResponse.json({ error: 'Error fetching tournaments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, date, tables } = await request.json()
    const tablesCount = parseInt(tables) || 0
    const result = await pool.query(
      'INSERT INTO tournaments (name, date, tables_count) VALUES ($1, $2, $3) RETURNING *',
      [name, date, tablesCount]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/tournaments error:', error)
    return NextResponse.json({ error: 'Error creating tournament' }, { status: 500 })
  }
}
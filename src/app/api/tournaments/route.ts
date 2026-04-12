import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM tournaments ORDER BY date DESC')
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching tournaments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, date } = await request.json()
    const result = await pool.query(
      'INSERT INTO tournaments (name, date) VALUES ($1, $2) RETURNING *',
      [name, date]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error creating tournament' }, { status: 500 })
  }
}
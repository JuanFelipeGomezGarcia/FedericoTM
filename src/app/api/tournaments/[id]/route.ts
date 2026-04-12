import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query('SELECT * FROM tournaments WHERE id = $1', [params.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching tournament' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query('DELETE FROM tournaments WHERE id = $1 RETURNING id', [params.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error deleting tournament' }, { status: 500 })
  }
}
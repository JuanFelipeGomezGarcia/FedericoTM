import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tournamentId, tableNumber } = await request.json()

    if (!tournamentId || !tableNumber) {
      return NextResponse.json(
        { error: 'tournamentId and tableNumber are required' },
        { status: 400 }
      )
    }

    await pool.query(
      'DELETE FROM table_assignments WHERE tournament_id = $1 AND table_number = $2',
      [tournamentId, tableNumber]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error clearing table' }, { status: 500 })
  }
}

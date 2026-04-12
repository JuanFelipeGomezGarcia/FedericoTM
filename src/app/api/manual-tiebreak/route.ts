import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { groupId, tiebreaks } = await request.json()
    // tiebreaks: [{ playerId, position }]

    await pool.query('DELETE FROM manual_tiebreaks WHERE group_id = $1', [groupId])

    for (const tb of tiebreaks) {
      await pool.query(
        'INSERT INTO manual_tiebreaks (group_id, player_id, position) VALUES ($1, $2, $3)',
        [groupId, tb.playerId, tb.position]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error saving tiebreak' }, { status: 500 })
  }
}

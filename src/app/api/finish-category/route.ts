import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { categoryId } = await request.json()

    await pool.query('UPDATE categories SET is_finished = true WHERE id = $1', [categoryId])

    const catResult = await pool.query('SELECT tournament_id FROM categories WHERE id = $1', [categoryId])
    const tournamentId = catResult.rows[0]?.tournament_id

    if (tournamentId) {
      const allResult = await pool.query(
        'SELECT COUNT(*) as total, COUNT(CASE WHEN is_finished THEN 1 END) as finished FROM categories WHERE tournament_id = $1',
        [tournamentId]
      )
      const { total, finished } = allResult.rows[0]
      if (parseInt(total) > 0 && parseInt(total) === parseInt(finished)) {
        await pool.query("UPDATE tournaments SET status = 'Finalizado' WHERE id = $1", [tournamentId])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error finishing category' }, { status: 500 })
  }
}

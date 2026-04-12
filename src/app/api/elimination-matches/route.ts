import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { advanceWinner } from '../generate-elimination/route'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    if (!categoryId) return NextResponse.json({ error: 'categoryId required' }, { status: 400 })

    const result = await pool.query(`
      SELECT em.*,
             p1.name as player1_name,
             p2.name as player2_name,
             w.name as winner_name
      FROM elimination_matches em
      LEFT JOIN players p1 ON em.player1_id = p1.id
      LEFT JOIN players p2 ON em.player2_id = p2.id
      LEFT JOIN players w ON em.winner_id = w.id
      WHERE em.category_id = $1
      ORDER BY em.round, em.match_number
    `, [categoryId])

    return NextResponse.json(result.rows.map((r: any) => ({ ...r, bye: r.bye === true || r.bye === 't' || r.bye === 'true' })))
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching elimination matches' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, winner_id } = await request.json()
    console.log('[PUT elimination] id:', id, 'winner_id:', winner_id)

    const matchResult = await pool.query('SELECT * FROM elimination_matches WHERE id = $1', [id])
    const match = matchResult.rows[0]
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    console.log('[PUT elimination] match:', match)

    // Check category is not finished
    const catResult = await pool.query('SELECT is_finished FROM categories WHERE id = $1', [match.category_id])
    if (catResult.rows[0]?.is_finished) {
      return NextResponse.json({ error: 'Category is finished' }, { status: 403 })
    }

    const updateResult = await pool.query(
      'UPDATE elimination_matches SET winner_id = $1 WHERE id = $2 RETURNING *',
      [winner_id, id]
    )
    console.log('[PUT elimination] updated row:', updateResult.rows[0])

    // Advance winner to next round
    await advanceWinner(match.category_id, match.round, match.match_number, winner_id)

    // Verificar si es la final consultando directamente la DB
    const finalCheck = await pool.query(
      'SELECT next_match_number FROM elimination_matches WHERE id = $1',
      [id]
    )
    const isFinal = !finalCheck.rows[0]?.next_match_number
    console.log('[PUT elimination] isFinal:', isFinal, 'next_match_number:', finalCheck.rows[0]?.next_match_number)

    if (isFinal) {
      await pool.query('UPDATE categories SET is_finished = true WHERE id = $1', [match.category_id])
      console.log('[PUT elimination] category marked as finished:', match.category_id)

      const tournamentRes = await pool.query('SELECT tournament_id FROM categories WHERE id = $1', [match.category_id])
      const tournamentId = tournamentRes.rows[0]?.tournament_id
      if (tournamentId) {
        const allRes = await pool.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN is_finished THEN 1 END) as finished FROM categories WHERE tournament_id = $1',
          [tournamentId]
        )
        const { total, finished } = allRes.rows[0]
        console.log('[PUT elimination] tournament categories:', total, 'finished:', finished)
        if (parseInt(total) > 0 && parseInt(total) === parseInt(finished)) {
          await pool.query("UPDATE tournaments SET status = 'Finalizado' WHERE id = $1", [tournamentId])
          console.log('[PUT elimination] tournament marked as finished:', tournamentId)
        }
      }
    }

    // Devolver todos los partidos actualizados de la categoría
    const updated = await pool.query(`
      SELECT em.*,
             p1.name as player1_name,
             p2.name as player2_name,
             w.name as winner_name
      FROM elimination_matches em
      LEFT JOIN players p1 ON em.player1_id = p1.id
      LEFT JOIN players p2 ON em.player2_id = p2.id
      LEFT JOIN players w ON em.winner_id = w.id
      WHERE em.category_id = $1
      ORDER BY em.round, em.match_number
    `, [match.category_id])

    console.log('[PUT elimination] returning', updated.rows.length, 'matches')
    return NextResponse.json(updated.rows.map((r: any) => ({ ...r, bye: r.bye === true || r.bye === 't' || r.bye === 'true' })))
  } catch (error) {
    console.error('[PUT elimination] ERROR:', error)
    return NextResponse.json({ error: 'Error updating match' }, { status: 500 })
  }
}

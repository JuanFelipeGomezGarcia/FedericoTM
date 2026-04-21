import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function isAdmin(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return false
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded?.role === 'admin'
  } catch {
    return false
  }
}

// GET /api/tables?tournamentId=X → devuelve { tablesCount, assignments }
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get('tournamentId')
  if (!tournamentId) return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 })

  try {
    // tablesCount directo del torneo
    const tRes = await pool.query('SELECT tables_count FROM tournaments WHERE id = $1', [tournamentId])
    const tablesCount = tRes.rows[0]?.tables_count ?? 0

    // Asignaciones activas
    const aRes = await pool.query(
      'SELECT * FROM table_assignments WHERE tournament_id = $1 ORDER BY table_number',
      [tournamentId]
    )

    const assignments: Record<number, any> = {}
    for (const row of aRes.rows) {
      assignments[row.table_number] = {
        categoryId: String(row.category_id),
        categoryName: row.category_name,
        groupId: row.group_id,
        groupName: row.group_name,
        matchId: row.match_id,
        matchType: row.match_type,
        p1Name: row.p1_name,
        p2Name: row.p2_name,
        time: row.assigned_at
          ? new Date(row.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : ''
      }
    }

    return NextResponse.json({ tablesCount, assignments })
  } catch (error) {
    console.error('GET /api/tables error:', error)
    return NextResponse.json({ error: 'Error fetching tables' }, { status: 500 })
  }
}

// POST /api/tables → asigna una mesa (solo admin)
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      tournamentId, tableNumber, categoryId, categoryName,
      groupId, groupName, matchId, matchType, p1Name, p2Name
    } = await request.json()

    if (!tournamentId || !tableNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Si el partido ya estaba asignado a otra mesa, liberarla
    await pool.query(
      'DELETE FROM table_assignments WHERE tournament_id = $1 AND match_id = $2 AND match_type = $3',
      [tournamentId, matchId, matchType || 'round-robin']
    )

    // Insertar / actualizar asignación (upsert por table_number)
    await pool.query(
      `INSERT INTO table_assignments
         (tournament_id, table_number, category_id, category_name, group_id, group_name, match_id, match_type, p1_name, p2_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (tournament_id, table_number)
       DO UPDATE SET
         category_id   = EXCLUDED.category_id,
         category_name = EXCLUDED.category_name,
         group_id      = EXCLUDED.group_id,
         group_name    = EXCLUDED.group_name,
         match_id      = EXCLUDED.match_id,
         match_type    = EXCLUDED.match_type,
         p1_name       = EXCLUDED.p1_name,
         p2_name       = EXCLUDED.p2_name,
         assigned_at   = NOW()`,
      [
        tournamentId, tableNumber,
        categoryId || null, categoryName || null,
        groupId || null, groupName || null,
        matchId, matchType || 'round-robin',
        p1Name, p2Name
      ]
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/tables error:', error)
    return NextResponse.json({ error: 'Error assigning table' }, { status: 500 })
  }
}

// PATCH /api/tables → toggle manual libre/ocupado (solo admin)
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tournamentId, tableNumber, occupied, label } = await request.json()
    if (!tournamentId || !tableNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!occupied) {
      await pool.query(
        'DELETE FROM table_assignments WHERE tournament_id = $1 AND table_number = $2',
        [tournamentId, tableNumber]
      )
    } else {
      // Marcar como ocupada manualmente (sin partido específico, match_id = 0)
      await pool.query(
        `INSERT INTO table_assignments
           (tournament_id, table_number, match_id, match_type, p1_name, p2_name)
         VALUES ($1, $2, 0, 'manual', $3, '')
         ON CONFLICT (tournament_id, table_number)
         DO UPDATE SET
           match_id    = 0,
           match_type  = 'manual',
           p1_name     = EXCLUDED.p1_name,
           p2_name     = '',
           category_id = NULL,
           category_name = NULL,
           group_id    = NULL,
           group_name  = NULL,
           assigned_at = NOW()`,
        [tournamentId, tableNumber, label || 'Ocupada']
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/tables error:', error)
    return NextResponse.json({ error: 'Error updating table' }, { status: 500 })
  }
}

// DELETE /api/tables?tournamentId=X&tableNumber=Y  → libera por número de mesa
// DELETE /api/tables?tournamentId=X&matchId=Y&matchType=Z → libera por partido
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get('tournamentId')
  const tableNumber = searchParams.get('tableNumber')
  const matchId = searchParams.get('matchId')
  const matchType = searchParams.get('matchType')

  try {
    if (tableNumber) {
      await pool.query(
        'DELETE FROM table_assignments WHERE tournament_id = $1 AND table_number = $2',
        [tournamentId, tableNumber]
      )
    } else if (matchId) {
      await pool.query(
        'DELETE FROM table_assignments WHERE tournament_id = $1 AND match_id = $2 AND match_type = $3',
        [tournamentId, matchId, matchType || 'round-robin']
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/tables error:', error)
    return NextResponse.json({ error: 'Error releasing table' }, { status: 500 })
  }
}

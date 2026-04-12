import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    let query = `
      SELECT g.*,
             array_agg(json_build_object('id', p.id, 'name', p.name, 'position', gp.position)) as players
      FROM groups g
      LEFT JOIN group_players gp ON g.id = gp.group_id
      LEFT JOIN players p ON gp.player_id = p.id
    `
    let params: any[] = []

    if (categoryId) {
      query += ' WHERE g.category_id = $1'
      params = [categoryId]
    }

    query += ' GROUP BY g.id ORDER BY g.name'

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching groups' }, { status: 500 })
  }
}
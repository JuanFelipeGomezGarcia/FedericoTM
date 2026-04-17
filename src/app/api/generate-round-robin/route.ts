import { generateBergerSchedule } from '@/lib/berger'

export async function POST(request: NextRequest) {
  try {
    const { categoryId } = await request.json()

    // Get category info
    const categoryResult = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId])
    const category = categoryResult.rows[0]

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Get groups for this category
    const groupsResult = await pool.query('SELECT * FROM groups WHERE category_id = $1 ORDER BY name', [categoryId])
    const groups = groupsResult.rows

    // Generate round robin matches for each group
    for (const group of groups) {
      // Get players in this group sorted by position (seed)
      const playersResult = await pool.query(`
        SELECT p.* FROM players p
        JOIN group_players gp ON p.id = gp.player_id
        WHERE gp.group_id = $1
        ORDER BY gp.position
      `, [group.id])

      const players = playersResult.rows

      // Generate round robin schedule using Berger System
      const schedule = generateBergerSchedule(players.length)

      // Insert matches in the professional sequence
      for (const round of schedule) {
        for (const matchIdx of round.matches) {
          const p1 = players[matchIdx.p1Idx]
          const p2 = players[matchIdx.p2Idx]
          
          await pool.query(
            'INSERT INTO round_robin_matches (category_id, group_id, player1_id, player2_id) VALUES ($1, $2, $3, $4)',
            [categoryId, group.id, p1.id, p2.id]
          )
        }
      }
    }

    return NextResponse.json({ message: 'Round robin matches generated successfully' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error generating round robin matches' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const groupId = searchParams.get('groupId')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    let standings

    if (groupId) {
      // Get standings for a specific group
      standings = await getGroupStandings(parseInt(groupId))
    } else {
      // Get standings for all groups in category
      const groupsResult = await pool.query('SELECT id FROM groups WHERE category_id = $1', [categoryId])
      const groupStandings = []

      for (const group of groupsResult.rows) {
        const groupStanding = await getGroupStandings(group.id)
        groupStandings.push({
          groupId: group.id,
          standings: groupStanding
        })
      }

      standings = groupStandings
    }

    return NextResponse.json(standings)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error calculating standings' }, { status: 500 })
  }
}

async function getGroupStandings(groupId: number) {
  // Get all players in the group
  const playersResult = await pool.query(`
    SELECT p.id, p.name
    FROM players p
    JOIN group_players gp ON p.id = gp.player_id
    WHERE gp.group_id = $1
    ORDER BY gp.position
  `, [groupId])

  const players = playersResult.rows

  // Calculate stats for each player
  const playerStats = []

  for (const player of players) {
    // Get all matches for this player in this group
    const matchesResult = await pool.query(`
      SELECT * FROM round_robin_matches
      WHERE group_id = $1 AND (player1_id = $2 OR player2_id = $3) AND result IS NOT NULL
    `, [groupId, player.id, player.id])

    let wins = 0
    let losses = 0
    let pointsWon = 0
    let pointsLost = 0

    for (const match of matchesResult.rows) {
      const isPlayer1 = match.player1_id === player.id
      const result = match.result?.split('-').map((n: string) => parseInt(n))

      if (!result || result.length !== 2) continue

      const playerScore = isPlayer1 ? result[0] : result[1]
      const opponentScore = isPlayer1 ? result[1] : result[0]

      pointsWon += playerScore
      pointsLost += opponentScore

      if (match.winner_id === player.id) {
        wins++
      } else {
        losses++
      }
    }

    playerStats.push({
      id: player.id,
      name: player.name,
      played: wins + losses,
      wins,
      losses,
      pointsWon,
      pointsLost,
      pointDifference: pointsWon - pointsLost,
      winPercentage: wins + losses > 0 ? wins / (wins + losses) : 0
    })
  }

  // Sort by tie-breaking rules:
  // 1. Most wins
  // 2. Best point difference
  // 3. Most points won
  // 4. Head-to-head result
  playerStats.sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.pointDifference !== b.pointDifference) return b.pointDifference - a.pointDifference
    if (a.pointsWon !== b.pointsWon) return b.pointsWon - a.pointsWon

    // Head-to-head (simplified - would need more complex logic for full implementation)
    return a.name.localeCompare(b.name) // Fallback to alphabetical
  })

  return playerStats
}
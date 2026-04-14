import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getGroupStandings } from '../standings/route'

interface BracketPlayer {
  id: number
  groupId: number
  rankInGroup: number
}

export async function POST(request: NextRequest) {
  try {
    const { categoryId } = await request.json()

    const categoryResult = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId])
    const category = categoryResult.rows[0]
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    // Delete existing elimination matches
    await pool.query('DELETE FROM elimination_matches WHERE category_id = $1', [categoryId])

    const groupsResult = await pool.query('SELECT id, name FROM groups WHERE category_id = $1 ORDER BY name', [categoryId])
    const groups = groupsResult.rows

    // Get qualified players per group in order
    const firstPlaces: BracketPlayer[] = []
    const otherPlaces: BracketPlayer[] = []
    let totalPlayers = 0

    for (const group of groups) {
      const standings = await getGroupStandings(group.id)
      const qualified = standings.slice(0, category.qualified_per_group)
      qualified.forEach((p: any, idx: number) => {
        totalPlayers++
        const b = { id: p.id, groupId: group.id, rankInGroup: idx + 1 }
        if (idx === 0) firstPlaces.push(b)
        else otherPlaces.push(b)
      })
    }

    if (totalPlayers < 2) return NextResponse.json({ error: 'Not enough qualified players' }, { status: 400 })

    const bracketSize = nextPow2(totalPlayers)
    const byesCount = bracketSize - totalPlayers
    const standardSlots = buildStandardSlots(bracketSize)

    const isBye = (seed: number) => seed > bracketSize - byesCount
    const assignments = new Map<number, number>() // playerId -> seed

    let availableSeeds = Array.from({length: bracketSize}, (_, i) => i + 1).filter(s => !isBye(s))

    const seedPools = [
       [1], [2], [3, 4], [5, 6, 7, 8],
       Array.from({length: 8}, (_,i)=>i+9),
       Array.from({length: 16},(_,i)=>i+17)
    ]

    let currentPoolIdx = 0
    let currentPool = [...seedPools[currentPoolIdx]]

    // Assign 1st places
    for (const p of firstPlaces) {
       if (currentPool.length === 0) {
           currentPoolIdx++
           if (seedPools[currentPoolIdx]) {
               currentPool = [...seedPools[currentPoolIdx]]
           } else {
               currentPool = []
               break
           }
       }
       const rndIdx = Math.floor(Math.random() * currentPool.length)
       const pickedSeed = currentPool.splice(rndIdx, 1)[0]
       
       assignments.set(p.id, pickedSeed)
       availableSeeds = availableSeeds.filter(s => s !== pickedSeed)
    }

    // Assign others via backtracking to ensure maximum separation from same group
    function solve(playerIndex: number): boolean {
        if (playerIndex === otherPlaces.length) return true
        const p = otherPlaces[playerIndex]
        const shuffled = [...availableSeeds].sort(() => Math.random() - 0.5)
        
        for (const seed of shuffled) {
            if (isValid(p, seed, assignments, standardSlots, bracketSize, firstPlaces, otherPlaces)) {
                assignments.set(p.id, seed)
                availableSeeds = availableSeeds.filter(s => s !== seed)
                
                if (solve(playerIndex + 1)) return true
                
                availableSeeds.push(seed)
                assignments.delete(p.id)
            }
        }
        return false
    }

    if (!solve(0)) {
       console.log('Could not find strict separation, using random mapping for remaining.')
       const shuffled = [...availableSeeds].sort(() => Math.random() - 0.5)
       for (let i = 0; i < otherPlaces.length; i++) {
           assignments.set(otherPlaces[i].id, shuffled[i])
       }
    }

    const slots: (number | null)[] = standardSlots.map(seed => {
       if (isBye(seed)) return null
       for (const [pid, s] of assignments.entries()) {
           if (s === seed) return pid
       }
       return null 
    })

    const round1Matches = bracketSize / 2
    const hasNextRound = Math.log2(bracketSize) > 1
    
    for (let i = 0; i < round1Matches; i++) {
      const p1 = slots[i * 2]
      const p2 = slots[i * 2 + 1]
      
      const isMatchBye = p1 === null || p2 === null
      const nextMatchNumber = hasNextRound ? Math.floor(i / 2) + 1 : null
      await pool.query(
        'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye, next_match_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [categoryId, 1, i + 1, p1 || null, p2 || null, isMatchBye, nextMatchNumber]
      )
    }

    const numRounds = Math.log2(bracketSize)
    for (let r = 2; r <= numRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r)
      for (let m = 1; m <= matchesInRound; m++) {
        await pool.query(
          'INSERT INTO elimination_matches (category_id, round, match_number, player1_id, player2_id, bye, next_match_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [categoryId, r, m, null, null, false, r < numRounds ? Math.ceil(m / 2) : null]
        )
      }
    }

    const byeMatches = await pool.query(
      'SELECT * FROM elimination_matches WHERE category_id = $1 AND round = 1 AND bye = true',
      [categoryId]
    )
    for (const bm of byeMatches.rows) {
      const winnerId = bm.player1_id || bm.player2_id
      if (winnerId) {
        await pool.query('UPDATE elimination_matches SET winner_id = $1 WHERE id = $2', [winnerId, bm.id])
        await advanceWinner(categoryId, 1, bm.match_number, winnerId)
      }
    }

    return NextResponse.json({ message: 'Elimination bracket generated perfectly', bracketSize, totalPlayers })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error generating elimination bracket' }, { status: 500 })
  }
}

async function advanceWinner(categoryId: number, round: number, matchNumber: number, winnerId: number) {
  const currentMatch = await pool.query(
    'SELECT next_match_number FROM elimination_matches WHERE category_id = $1 AND round = $2 AND match_number = $3',
    [categoryId, round, matchNumber]
  )
  if (currentMatch.rows.length === 0) return
  const nextMatchNum = currentMatch.rows[0].next_match_number
  if (!nextMatchNum) return

  const nextRound = round + 1
  const isPlayer1Slot = matchNumber % 2 === 1

  const nextMatch = await pool.query(
    'SELECT * FROM elimination_matches WHERE category_id = $1 AND round = $2 AND match_number = $3',
    [categoryId, nextRound, nextMatchNum]
  )
  if (nextMatch.rows.length === 0) return

  const field = isPlayer1Slot ? 'player1_id' : 'player2_id'
  await pool.query(
    `UPDATE elimination_matches SET ${field} = $1 WHERE category_id = $2 AND round = $3 AND match_number = $4 RETURNING id`,
    [winnerId, categoryId, nextRound, nextMatchNum]
  )
}

function nextPow2(n: number) {
  let p = 1
  while (p < n) p *= 2
  return p
}

function buildStandardSlots(size: number): number[] {
  let slots = [1, 2]
  let rounds = Math.log2(size)
  for (let r = 1; r < rounds; r++) {
    let nextSlots: number[] = []
    let sum = Math.pow(2, r + 1) + 1
    for (let i = 0; i < slots.length; i++) {
        let val = slots[i]
        if (i % 2 === 0) {
            nextSlots.push(val, sum - val)
        } else {
            nextSlots.push(sum - val, val)
        }
    }
    slots = nextSlots
  }
  return size === 1 ? [1] : slots
}

function isValid(
   player: BracketPlayer, 
   seed: number, 
   assignments: Map<number, number>, 
   standardSlots: number[], 
   bracketSize: number,
   firstPlaces: BracketPlayer[],
   otherPlaces: BracketPlayer[]
): boolean {
   if (bracketSize <= 2) return true 

   const idx = standardSlots.indexOf(seed)
   const half = idx < bracketSize / 2 ? 0 : 1

   let halfCounts = [0, 0]
   const allPlayers = [...firstPlaces, ...otherPlaces]

   for (const p of allPlayers) {
       if (p.groupId === player.groupId && assignments.has(p.id)) {
           const s = assignments.get(p.id)!
           const i = standardSlots.indexOf(s)
           halfCounts[i < bracketSize / 2 ? 0 : 1]++
       }
   }

   if (half === 0 && halfCounts[0] > halfCounts[1]) return false
   if (half === 1 && halfCounts[1] > halfCounts[0]) return false

   return true
}

export { advanceWinner }

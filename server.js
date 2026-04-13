import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import pool from './src/lib/db.ts'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join tournament room
    socket.on('join-tournament', (tournamentId) => {
      socket.join(`tournament-${tournamentId}`)
      console.log(`Client ${socket.id} joined tournament ${tournamentId}`)
    })

    // Join category room
    socket.on('join-category', (categoryId) => {
      socket.join(`category-${categoryId}`)
      console.log(`Client ${socket.id} joined category ${categoryId}`)
    })

    // Handle match result updates
    socket.on('match-result', async (data) => {
      try {
        const { matchId, result, winnerId, matchType } = data

        if (matchType === 'round-robin') {
          await pool.query(
            'UPDATE round_robin_matches SET result = $1, winner_id = $2 WHERE id = $3',
            [result, winnerId, matchId]
          )
        } else if (matchType === 'elimination') {
          await pool.query(
            'UPDATE elimination_matches SET result = $1, winner_id = $2 WHERE id = $3',
            [result, winnerId, matchId]
          )
        }

        // Get updated match data
        let matchData
        if (matchType === 'round-robin') {
          const result = await pool.query(`
            SELECT rrm.*, p1.name as player1_name, p2.name as player2_name, g.name as group_name, c.name as category_name
            FROM round_robin_matches rrm
            JOIN players p1 ON rrm.player1_id = p1.id
            LEFT JOIN players p2 ON rrm.player2_id = p2.id
            JOIN groups g ON rrm.group_id = g.id
            JOIN categories c ON rrm.category_id = c.id
            WHERE rrm.id = $1
          `, [matchId])
          matchData = result.rows[0]
        } else {
          const result = await pool.query(`
            SELECT em.*, p1.name as player1_name, p2.name as player2_name, c.name as category_name
            FROM elimination_matches em
            LEFT JOIN players p1 ON em.player1_id = p1.id
            LEFT JOIN players p2 ON em.player2_id = p2.id
            JOIN categories c ON em.category_id = c.id
            WHERE em.id = $1
          `, [matchId])
          matchData = result.rows[0]
        }

        // Broadcast update to all clients in the category room
        socket.to(`category-${matchData.category_id}`).emit('match-updated', {
          matchId,
          matchData,
          matchType
        })

        // Also broadcast to tournament room
        socket.to(`tournament-${matchData.tournament_id}`).emit('match-updated', {
          matchId,
          matchData,
          matchType
        })

      } catch (error) {
        console.error('Error updating match result:', error)
        socket.emit('error', { message: 'Failed to update match result' })
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
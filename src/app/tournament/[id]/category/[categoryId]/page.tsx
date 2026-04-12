'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Category {
  id: number
  name: string
  players_per_group: number
  qualified_per_group: number
}

interface Group {
  id: number
  name: string
  players: Array<{
    id: number
    name: string
    position: number
  }>
}

interface Match {
  id: number
  player1_name: string
  player2_name: string
  result: string
  winner_id: number
}

interface Standing {
  id: number
  name: string
  played: number
  wins: number
  losses: number
  pointsWon: number
  pointsLost: number
  pointDifference: number
  winPercentage: number
}

export default function CategoryPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const categoryId = params.categoryId as string

  const [category, setCategory] = useState<Category | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<{ [key: number]: Standing[] }>({})
  const [activeTab, setActiveTab] = useState<'groups' | 'matches' | 'standings'>('groups')

  useEffect(() => {
    if (categoryId) {
      fetchCategory()
      fetchGroups()
      fetchMatches()
      fetchStandings()
    }
  }, [categoryId])

  const fetchCategory = async () => {
    const response = await fetch(`/api/categories/${categoryId}`)
    if (response.ok) {
      const data = await response.json()
      setCategory(data)
    }
  }

  const fetchGroups = async () => {
    const response = await fetch(`/api/groups?categoryId=${categoryId}`)
    const data = await response.json()
    setGroups(data)
  }

  const fetchMatches = async () => {
    const response = await fetch(`/api/round-robin-matches?categoryId=${categoryId}`)
    const data = await response.json()
    setMatches(data)
  }

  const fetchStandings = async () => {
    const response = await fetch(`/api/standings?categoryId=${categoryId}`)
    const data = await response.json()
    const standingsMap: { [key: number]: Standing[] } = {}
    data.forEach((groupStanding: any) => {
      standingsMap[groupStanding.groupId] = groupStanding.standings
    })
    setStandings(standingsMap)
  }

  const generateRoundRobin = async () => {
    const response = await fetch('/api/generate-round-robin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: parseInt(categoryId) })
    })
    if (response.ok) {
      fetchMatches()
      fetchStandings()
    }
  }

  if (!category) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href={`/tournament/${tournamentId}`} className="text-blue-600 hover:text-blue-800">← Volver al Torneo</Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{category.name}</h1>
            </div>
            <div className="space-x-2">
              <Button onClick={generateRoundRobin} variant="outline">
                Generar Round Robin
              </Button>
              <Button variant="outline">
                Generar Eliminación
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'groups', label: 'Grupos' },
              { id: 'matches', label: 'Partidos' },
              { id: 'standings', label: 'Clasificación' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {group.players.map((player) => (
                      <li key={player.id} className="text-sm">
                        {player.position}. {player.name}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'matches' && (
          <Card>
            <CardHeader>
              <CardTitle>Partidos de Round Robin</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador 1</TableHead>
                    <TableHead>Jugador 2</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Ganador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>{match.player1_name}</TableCell>
                      <TableCell>{match.player2_name || 'BYE'}</TableCell>
                      <TableCell>{match.result || 'Pendiente'}</TableCell>
                      <TableCell>
                        {match.winner_id ? (match.winner_id === match.player1_id ? match.player1_name : match.player2_name) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'standings' && (
          <div className="space-y-6">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name} - Clasificación</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Posición</TableHead>
                        <TableHead>Jugador</TableHead>
                        <TableHead>PJ</TableHead>
                        <TableHead>G</TableHead>
                        <TableHead>P</TableHead>
                        <TableHead>PF</TableHead>
                        <TableHead>PC</TableHead>
                        <TableHead>Dif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings[group.id]?.map((standing, index) => (
                        <TableRow key={standing.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{standing.name}</TableCell>
                          <TableCell>{standing.played}</TableCell>
                          <TableCell>{standing.wins}</TableCell>
                          <TableCell>{standing.losses}</TableCell>
                          <TableCell>{standing.pointsWon}</TableCell>
                          <TableCell>{standing.pointsLost}</TableCell>
                          <TableCell>{standing.pointDifference}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
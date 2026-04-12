'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Tournament {
  id: number
  name: string
  date: string
  status: string
}

interface Category {
  id: number
  tournament_id: number
  name: string
  players_per_group: number
  qualified_per_group: number
}

export default function TournamentPage() {
  const params = useParams()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (tournamentId) {
      fetchTournament()
      fetchCategories()
    }
  }, [tournamentId])

  const fetchTournament = async () => {
    const response = await fetch(`/api/tournaments/${tournamentId}`)
    if (response.ok) {
      const data = await response.json()
      setTournament(data)
    }
  }

  const fetchCategories = async () => {
    const response = await fetch(`/api/categories?tournamentId=${tournamentId}`)
    const data = await response.json()
    setCategories(data)
  }

  if (!tournament) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800">← Volver</Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{tournament.name}</h1>
              <p className="text-gray-600">
                {new Date(tournament.date).toLocaleDateString('es-ES')} - {tournament.status}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Categorías</h2>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No hay categorías en este torneo.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      {category.players_per_group} jugadores por grupo
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {category.qualified_per_group} clasificados por grupo
                    </p>
                    <Link href={`/tournament/${tournamentId}/category/${category.id}`}>
                      <Button className="w-full">Ver Categoría</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
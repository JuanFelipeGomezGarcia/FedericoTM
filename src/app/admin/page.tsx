'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
  tournament_name: string
}

export default function AdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newTournament, setNewTournament] = useState({ name: '', date: '' })
  const [newCategory, setNewCategory] = useState({
    tournament_id: '',
    name: '',
    players_per_group: '',
    qualified_per_group: '',
    players: ''
  })

  useEffect(() => {
    fetchTournaments()
    fetchCategories()
  }, [])

  const fetchTournaments = async () => {
    const response = await fetch('/api/tournaments')
    const data = await response.json()
    setTournaments(data)
  }

  const fetchCategories = async () => {
    const response = await fetch('/api/categories')
    const data = await response.json()
    setCategories(data)
  }

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTournament)
    })
    if (response.ok) {
      setNewTournament({ name: '', date: '' })
      fetchTournaments()
    }
  }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newCategory,
        tournament_id: parseInt(newCategory.tournament_id),
        players_per_group: parseInt(newCategory.players_per_group),
        qualified_per_group: parseInt(newCategory.qualified_per_group)
      })
    })
    if (response.ok) {
      setNewCategory({
        tournament_id: '',
        name: '',
        players_per_group: '',
        qualified_per_group: '',
        players: ''
      })
      fetchCategories()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tournaments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Torneos</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTournament} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nombre del torneo"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                  required
                />
                <Input
                  type="date"
                  value={newTournament.date}
                  onChange={(e) => setNewTournament({...newTournament, date: e.target.value})}
                  required
                />
              </div>
              <Button type="submit">Crear Torneo</Button>
            </form>

            <div className="space-y-2">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <h3 className="font-semibold">{tournament.name}</h3>
                    <p className="text-sm text-gray-600">{tournament.date} - {tournament.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories Section */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCategory} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newCategory.tournament_id}
                  onChange={(e) => setNewCategory({...newCategory, tournament_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar torneo</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <Input
                  placeholder="Nombre de la categoría"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="Jugadores por grupo"
                  value={newCategory.players_per_group}
                  onChange={(e) => setNewCategory({...newCategory, players_per_group: e.target.value})}
                  required
                />
                <Input
                  type="number"
                  placeholder="Clasificados por grupo"
                  value={newCategory.qualified_per_group}
                  onChange={(e) => setNewCategory({...newCategory, qualified_per_group: e.target.value})}
                  required
                />
              </div>
              <textarea
                placeholder="Jugadores (uno por línea)"
                value={newCategory.players}
                onChange={(e) => setNewCategory({...newCategory, players: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={5}
                required
              />
              <Button type="submit">Crear Categoría</Button>
            </form>

            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-600">
                      {category.tournament_name} - {category.players_per_group} jugadores/grupo, {category.qualified_per_group} clasificados
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
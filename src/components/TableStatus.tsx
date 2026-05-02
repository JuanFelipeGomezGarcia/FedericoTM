'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface Table {
  id: number
  tournament_id: number
  name: string
  status: 'disponible' | 'ocupada'
}

interface TableStatusProps {
  tournamentId: string | number
  isAdmin: boolean
}

export default function TableStatus({ tournamentId, isAdmin }: TableStatusProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const fetchTables = useCallback(async () => {
    const res = await fetch(`/api/tables?tournamentId=${tournamentId}`)
    if (res.ok) setTables(await res.json())
  }, [tournamentId])

  useEffect(() => {
    fetchTables()
    // Polling cada 10s para que usuarios no-admin vean cambios en tiempo real
    const interval = setInterval(fetchTables, 10000)
    return () => clearInterval(interval)
  }, [fetchTables])

  const toggleStatus = async (table: Table) => {
    if (!isAdmin) return
    const newStatus = table.status === 'disponible' ? 'ocupada' : 'disponible'
    const token = localStorage.getItem('admin-token')
    const res = await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: table.id, status: newStatus }),
    })
    if (res.ok) {
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: newStatus } : t))
    }
  }

  const addTable = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const token = localStorage.getItem('admin-token')
    const res = await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tournament_id: tournamentId, name: newName.trim() }),
    })
    if (res.ok) {
      const created = await res.json()
      setTables(prev => [...prev, created])
      setNewName('')
      setShowAdd(false)
    }
    setAdding(false)
  }

  const deleteTable = async (id: number) => {
    const token = localStorage.getItem('admin-token')
    const res = await fetch(`/api/tables?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setTables(prev => prev.filter(t => t.id !== id))
  }

  if (tables.length === 0 && !isAdmin) return null

  return (
    <div className="border-b border-border/30 bg-background/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0">
          Mesas
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {tables.map(table => (
            <div key={table.id} className="flex items-center gap-1">
              <button
                onClick={() => toggleStatus(table)}
                disabled={!isAdmin}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  table.status === 'disponible'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  table.status === 'disponible' ? 'bg-emerald-400' : 'bg-red-400'
                }`} />
                {table.name}
              </button>
              {isAdmin && (
                <button
                  onClick={() => deleteTable(table.id)}
                  className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          showAdd ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTable(); if (e.key === 'Escape') setShowAdd(false) }}
                placeholder="Ej: Mesa 1"
                className="input-field py-1 px-2 text-xs w-28"
              />
              <button onClick={addTable} disabled={adding || !newName.trim()} className="btn-primary py-1 px-2 text-xs disabled:opacity-50">
                {adding ? '...' : 'Agregar'}
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary py-1 px-2 text-xs">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-400 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Agregar mesa
            </button>
          )
        )}
      </div>
    </div>
  )
}

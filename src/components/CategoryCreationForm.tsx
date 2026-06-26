'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Plus } from 'lucide-react'

export interface CategoryDraft {
  name: string
  players: string
  players_per_group: string
  qualified_per_group: string
}

interface CategoryCreationFormProps {
  onSubmit: (values: CategoryDraft) => Promise<void> | void
  isSubmitting?: boolean
  error?: string
  resetKey?: number
  title?: string
  submitLabel?: string
}

const emptyValues = (): CategoryDraft => ({
  name: '',
  players: '',
  players_per_group: '4',
  qualified_per_group: '2',
})

export default function CategoryCreationForm({
  onSubmit,
  isSubmitting = false,
  error = '',
  resetKey,
  title = 'Nueva categoría',
  submitLabel = 'Agregar categoría',
}: CategoryCreationFormProps) {
  const [values, setValues] = useState<CategoryDraft>(emptyValues())

  useEffect(() => {
    setValues(emptyValues())
  }, [resetKey])

  const playerCount = values.players.split('\n').filter((p) => p.trim()).length

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onSubmit(values)
  }

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <Plus className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nombre de la categoría</label>
          <input
            type="text"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            className="input-field"
            placeholder="Ej: Masculino A, Femenino, Sub-18..."
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Jugadores por grupo</label>
            <input
              type="number"
              min="2"
              max="20"
              value={values.players_per_group}
              onChange={(event) => setValues({ ...values, players_per_group: event.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Clasificados por grupo</label>
            <input
              type="number"
              min="1"
              max="10"
              value={values.qualified_per_group}
              onChange={(event) => setValues({ ...values, qualified_per_group: event.target.value })}
              className="input-field"
              required
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-muted-foreground">Participantes</label>
            {playerCount > 0 && (
              <span className="text-xs text-cyan-400 font-medium">{playerCount} jugadores</span>
            )}
          </div>
          <textarea
            value={values.players}
            onChange={(event) => setValues({ ...values, players: event.target.value })}
            className="input-field resize-none font-mono text-xs"
            rows={8}
            placeholder={'Juan García\nMaría López\nCarlos Martínez\n(uno por línea, en orden de nivel)'}
            required
          />
          <p className="text-xs text-muted-foreground mt-1.5">Un participante por línea, ordenados por nivel (el primero es el mejor)</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full disabled:opacity-50">
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {submitLabel}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

interface Assignment {
  categoryId: string
  categoryName: string
  groupId: number
  groupName: string
  matchId: number
  matchType: string
  p1Name: string
  p2Name: string
  time: string
}

interface TablesData {
  tablesCount: number
  assignments: Record<number, Assignment>
}

interface TableStatusProps {
  tournamentId: string | number
  isAdmin?: boolean // Mantenemos la prop por compatibilidad con llamadas existentes
}

export default function TableStatus({ tournamentId, isAdmin }: TableStatusProps) {
  const [data, setData] = useState<TablesData>({ tablesCount: 0, assignments: {} })

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/tables?tournamentId=${tournamentId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchTables()
    // Polling cada 10s para cambios en tiempo real
    const interval = setInterval(fetchTables, 10000)
    return () => clearInterval(interval)
  }, [fetchTables])

  if (data.tablesCount === 0) return null

  // Array of tables 1 to N
  const tables = Array.from({ length: data.tablesCount }, (_, i) => i + 1)

  return (
    <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap flex-shrink-0 drop-shadow-sm">
            Mesas
          </div>
          <div className="flex items-center gap-4">
            {tables.map(tableNum => {
              const assignment = data.assignments[tableNum]
              const isOccupied = !!assignment

              return (
                <div 
                  key={tableNum} 
                  className={`flex flex-col min-w-[160px] h-[88px] px-3.5 py-2.5 rounded-2xl border transition-all duration-300 ease-out flex-shrink-0 ${
                    isOccupied 
                      ? 'bg-red-500/10 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.15)] hover:border-red-500/50' 
                      : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.1)] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold tracking-wider ${isOccupied ? 'text-red-400' : 'text-emerald-400'} flex items-center gap-2`}>
                      <span className={`w-2 h-2 rounded-full shadow-sm ${isOccupied ? 'bg-red-500 shadow-red-500/50 animate-pulse' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
                      MESA {tableNum}
                    </span>
                  </div>
                  
                  {isOccupied ? (
                    <div className="flex flex-col gap-0.5 mt-auto">
                      {assignment.categoryName && assignment.groupName ? (
                        <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wide">
                          {assignment.categoryName} • {assignment.groupName}
                        </span>
                      ) : assignment.matchType === 'manual' ? (
                         <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wide">Ocupada Manualmente</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wide">En Partido</span>
                      )}
                      
                      {assignment.matchType !== 'manual' && (
                        <div className="text-xs font-semibold text-foreground truncate mt-1">
                          {assignment.p1Name} <span className="text-muted-foreground/60 text-[10px] mx-1 font-normal">vs</span> {assignment.p2Name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center mt-auto">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                        Disponible
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

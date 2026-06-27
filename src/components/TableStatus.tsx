'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'

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
  updateTrigger?: number // Cambia para forzar un refetch de las mesas
}

export default function TableStatus({ tournamentId, isAdmin, updateTrigger = 0 }: TableStatusProps) {
  const [data, setData] = useState<TablesData>({ tablesCount: 0, assignments: {} })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [clearingTable, setClearingTable] = useState<number | null>(null)

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
  }, [fetchTables, updateTrigger])

  const handleClearTable = async (tableNum: number) => {
    try {
      setClearingTable(tableNum)
      const res = await fetch('/api/tables/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, tableNumber: tableNum })
      })
      if (res.ok) {
        await fetchTables()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setClearingTable(null)
    }
  }

  useEffect(() => {
    // Polling cada 10s para cambios en tiempo real
    const interval = setInterval(fetchTables, 10000)
    return () => clearInterval(interval)
  }, [fetchTables])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 2 // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk
  }

  if (data.tablesCount === 0) return null

  // Array of tables 1 to N
  const tables = Array.from({ length: data.tablesCount }, (_, i) => i + 1)

  return (
    <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex items-center gap-5 overflow-x-auto pb-2 scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
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
                  className={`flex flex-col min-w-[160px] h-[88px] px-3.5 py-2.5 rounded-2xl border transition-all duration-300 ease-out flex-shrink-0 relative ${
                    isOccupied 
                      ? 'bg-red-500/10 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.15)] hover:border-red-500/50' 
                      : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.1)] hover:border-emerald-500/50'
                  }`}
                >
                  {isAdmin && isOccupied && (
                    <button
                      onClick={() => handleClearTable(tableNum)}
                      disabled={clearingTable === tableNum}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 border border-muted-foreground/30 flex items-center justify-center transition-all duration-200 disabled:opacity-50 cursor-pointer"
                      title="Limpiar mesa"
                    >
                      <X size={12} className="text-muted-foreground" />
                    </button>
                  )}
                  
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

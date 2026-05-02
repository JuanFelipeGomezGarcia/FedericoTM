'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm font-semibold transition-all duration-200 hover:scale-105
        dark:bg-secondary dark:text-foreground dark:hover:bg-secondary/80
        light:bg-white light:text-slate-700 light:hover:bg-slate-50
        bg-secondary text-foreground hover:bg-secondary/80"
      title={theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-yellow-400" />
          <span className="hidden sm:inline text-xs uppercase tracking-wider">Modo Día</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline text-xs uppercase tracking-wider">Modo Noche</span>
        </>
      )}
    </button>
  )
}

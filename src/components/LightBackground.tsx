'use client'

import { useTheme } from './ThemeProvider'

export default function LightBackground() {
  const { theme } = useTheme()
  if (theme !== 'light') return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Círculo azul grande - esquina superior derecha */}
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-sky-200/70 to-blue-100/50" />

      {/* Círculo amarillo - esquina superior derecha desplazado */}
      <div className="absolute top-44 -right-10 w-[260px] h-[260px] rounded-full bg-gradient-to-br from-yellow-300/65 to-amber-200/40" />

      {/* Patrón de puntos - esquina superior derecha */}
      <svg className="absolute top-20 right-52 w-44 h-44 opacity-[0.18]" viewBox="0 0 200 200">
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 20 + 10} cy={row * 20 + 10} r="2.5" fill="#64748b" />
          ))
        )}
      </svg>

      {/* Círculo amarillo grande - esquina inferior derecha */}
      <div className="absolute -bottom-28 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-yellow-300/55 to-amber-100/30" />

      {/* Patrón de puntos - esquina inferior derecha */}
      <svg className="absolute bottom-36 right-72 w-36 h-36 opacity-[0.15]" viewBox="0 0 200 200">
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 20 + 10} cy={row * 20 + 10} r="2.5" fill="#64748b" />
          ))
        )}
      </svg>

      {/* Círculo azul sutil - esquina inferior izquierda */}
      <div className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-sky-200/40 to-blue-100/20" />
    </div>
  )
}

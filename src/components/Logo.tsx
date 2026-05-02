'use client'

import Image from 'next/image'
import { useTheme } from './ThemeProvider'

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export default function Logo({ width = 160, height = 45, className = '' }: LogoProps) {
  const { theme } = useTheme()
  const src = theme === 'light' ? '/assets/LogoFondoBlanco.png' : '/assets/LogoSinFondo.png'

  return (
    <Image
      src={src}
      alt="Federico TM Logo"
      width={width}
      height={height}
      className={`object-contain transition-all duration-300 ${className}`}
      priority
    />
  )
}

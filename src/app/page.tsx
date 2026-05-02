'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Calendar, ChevronRight, Shield, Zap, Users, Clock, MapPin, Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import Logo from '@/components/Logo'

interface Tournament {
  id: number
  name: string
  date: string
  status: string
}

const heroImages = [
  '/hero1.jpg', '/hero2.jpg', '/hero3.jpg', '/hero4.jpg',
  '/hero5.jpg', '/hero6.jpg', '/hero7.jpg', '/hero8.jpg'
]

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(data => {
        setTournaments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const active = tournaments.filter(t => t.status === 'En curso')
  const finished = tournaments.filter(t => t.status === 'Finalizado')

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Background Marquee */}
      <div className="absolute top-0 left-0 w-full h-[750px] z-0 overflow-hidden pointer-events-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
          @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } }
          .animate-marquee { display: flex; width: max-content; animation: marquee 50s linear infinite; will-change: transform; }
          .animate-marquee-reverse { display: flex; width: max-content; animation: marquee-reverse 50s linear infinite; will-change: transform; }
        `}} />
        <div className="flex flex-col gap-3 opacity-[0.85] rotate-[-5deg] scale-[1.1] -translate-y-10">
          <div className="animate-marquee gap-3">
            {[...heroImages, ...heroImages].map((src, i) => (
              <div key={`r1-${i}`} style={{ width: '280px', height: '180px', minWidth: '280px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
                <img src={src} alt="" style={{ width: '280px', height: '180px', objectFit: 'cover', display: 'block', transform: 'translateZ(0)' }} />
              </div>
            ))}
          </div>
          <div className="animate-marquee-reverse gap-3">
            {[...heroImages, ...heroImages].map((src, i) => (
              <div key={`r2-${i}`} style={{ width: '280px', height: '180px', minWidth: '280px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
                <img src={src} alt="" style={{ width: '280px', height: '180px', objectFit: 'cover', display: 'block', transform: 'translateZ(0)' }} />
              </div>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-col lg:gap-3">
            <div className="animate-marquee gap-3">
              {[...heroImages, ...heroImages].map((src, i) => (
                <div key={`r3-${i}`} style={{ width: '300px', height: '200px', minWidth: '300px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={src} alt="" style={{ width: '300px', height: '200px', objectFit: 'cover', display: 'block', transform: 'translateZ(0)' }} />
                </div>
              ))}
            </div>
            <div className="animate-marquee-reverse gap-3">
              {[...heroImages, ...heroImages].map((src, i) => (
                <div key={`r4-${i}`} style={{ width: '300px', height: '200px', minWidth: '300px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={src} alt="" style={{ width: '300px', height: '200px', objectFit: 'cover', display: 'block', transform: 'translateZ(0)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-background/50 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-20" />
      </div>

      {/* Header */}
      <header className="page-header relative z-30 shadow-sm">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-md pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative z-10">
          <Logo width={160} height={45} className="hover:scale-105 transition-transform duration-300" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/admin" className="btn-primary text-sm py-2">
              <Shield className="w-4 h-4" />
              Panel Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-20 border-b border-border/20 pt-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-6 backdrop-blur-md animate-fade-in mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Resultados en tiempo real
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] mb-6 drop-shadow-lg [text-wrap:balance]">
                Torneos de{' '}
                <span className="gradient-text font-black">Tenis de Mesa</span>
              </h1>
              <p className="text-gray-100 text-lg leading-relaxed mb-10 max-w-xl backdrop-blur-sm bg-black/50 rounded-xl p-4 border border-white/5">
                Fomentamos el espíritu deportivo y el esfuerzo continuo. Sigue los resultados en vivo y apoya el talento de nuestra comunidad de jóvenes con el respaldo de la fundación.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                {[
                  { icon: Zap, label: 'En curso', value: active.length, color: 'text-emerald-400', border: 'border-emerald-500/20' },
                  { icon: Trophy, label: 'Finalizados', value: finished.length, color: 'text-cyan-400', border: 'border-cyan-500/20' },
                  { icon: Users, label: 'Total torneos', value: tournaments.length, color: 'text-blue-400', border: 'border-blue-500/20' },
                ].map(({ icon: Icon, label, value, color, border }) => (
                  <div key={label} className={`flex items-center gap-4 glass-card px-5 py-3.5 backdrop-blur-md bg-background/80 border ${border}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                    <div>
                      <div className="text-2xl font-bold text-foreground leading-none mb-1">{value}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex lg:col-span-5 relative group mt-10 lg:mt-0 justify-center items-center">
              <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-visible transition-all duration-500 group-hover:-translate-y-4 group-hover:scale-105 z-20 flex justify-center items-center">
                <Image src="/assets/LogoTM.png" alt="Logo Oficial TM" fill className="object-contain drop-shadow-[0_30px_60px_rgba(6,182,212,0.8)]" priority />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-cyan-600/40 blur-[90px] rounded-full pointer-events-none z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10 bg-background/20">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-5">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <span className="text-cyan-400/80 font-medium tracking-wide animate-pulse">Cargando torneos...</span>
            </div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 glass-card backdrop-blur-sm bg-background/50">
            <Trophy className="w-10 h-10 text-muted-foreground/50" />
            <h3 className="text-foreground text-2xl font-bold">No hay torneos disponibles</h3>
            <p className="text-muted-foreground text-center max-w-sm">Próximamente estaremos publicando nuevos campeonatos.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {active.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">En Curso</h2>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {active.map((t, i) => <TournamentCard key={t.id} tournament={t} index={i} />)}
                </div>
              </section>
            )}
            {finished.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Finalizados</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finished.map((t, i) => <TournamentCard key={t.id} tournament={t} index={i} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-background border-t border-border/10 pt-20 pb-10 mt-10 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div className="space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
              <Image src="/assets/LogoSinFondo.png" alt="Fundación Federico" width={220} height={60} className="object-contain" />
              <p className="text-muted-foreground text-lg italic max-w-md leading-relaxed">
                "La vida nos ha preparado para grandes cosas, hacemos de ellas un reto y las volvemos una realidad."
              </p>
              <Link
                href="https://api.whatsapp.com/send?phone=3182099130&text=Quiero%20hacer%20una%20donaci%C3%B3n%20a%20la%20fundaci%C3%B3n"
                target="_blank" rel="noopener noreferrer"
                className="group relative px-10 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest text-sm">
                  Dona Ahora <span className="text-red-400">❤️</span>
                </span>
              </Link>
            </div>
            <div className="flex flex-col items-center lg:items-start space-y-12">
              <div className="space-y-6">
                <h4 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-sm text-center lg:text-left">Contacto</h4>
                <ul className="space-y-5">
                  {[
                    { Icon: MapPin, text: 'Calle 47 # 29-69 Oficina 202 Bucaramanga, Santander' },
                    { Icon: Mail, text: 'contacto@fundacionfederico.com' },
                    { Icon: Phone, text: '+57 318 209 9130' },
                  ].map(({ Icon, text }) => (
                    <li key={text} className="flex items-start gap-4 text-muted-foreground group">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-base">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-5">
                {[
                  { icon: Facebook, href: 'https://www.facebook.com/fundacionfederico', label: 'Facebook' },
                  { icon: Instagram, href: 'https://www.instagram.com/fundacionfederico/', label: 'Instagram' },
                  { icon: Twitter, href: 'https://x.com/FundacionFRC', label: 'X' },
                ].map(({ icon: Icon, href, label }) => (
                  <Link key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-500/40 group transition-all duration-300"
                    aria-label={label}>
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-xs font-medium uppercase tracking-widest">
            <p>Copyright © 2026 Reservados todos los derechos — Fundación Federico</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TournamentCard({ tournament, index }: { tournament: Tournament; index: number }) {
  const isActive = tournament.status === 'En curso'
  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className="group glass-card p-6 h-full flex flex-col justify-between hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all duration-500 animate-fade-in"
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'both' }}
    >
      <div>
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 flex items-center justify-center group-hover:from-cyan-500/30 transition-all duration-500">
            <Trophy className="w-6 h-6 text-cyan-400" />
          </div>
          {isActive ? (
            <span className="status-active">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              En curso
            </span>
          ) : (
            <span className="status-finished">
              <Clock className="w-3.5 h-3.5" />
              Finalizado
            </span>
          )}
        </div>
        <h3 className="font-extrabold text-foreground text-xl mb-3 group-hover:text-cyan-300 transition-colors duration-300 line-clamp-2">
          {tournament.name}
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground/80 text-sm mb-6 font-medium">
          <Calendar className="w-4 h-4 text-cyan-500/70" />
          {new Date(tournament.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-auto">
        <span className="text-sm font-semibold text-cyan-400/70 group-hover:text-cyan-400 transition-colors">Ver campeonato</span>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}

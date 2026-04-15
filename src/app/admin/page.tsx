'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Calendar, ChevronRight, Shield, Zap, Users, Clock, MapPin, Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react'

interface Tournament {
  id: number
  name: string
  date: string
  status: string
}

// Foundation photos
const heroImages = [
  '/hero1.jpg',
  '/hero2.jpg',
  '/hero3.jpg',
  '/hero4.jpg',
  '/hero5.jpg',
  '/hero6.jpg',
  '/hero7.jpg',
  '/hero8.jpg'
]

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTournaments(data)
        } else {
          setTournaments([]) // Fallback to empty array if API returns error
          console.error('Failed to load tournaments:', data)
        }
        setLoading(false)
      })
      .catch((e) => {
        console.error('Error fetching tournaments:', e)
        setLoading(false)
      })
  }, [])

  const active = tournaments.filter(t => t.status === 'En curso')
  const finished = tournaments.filter(t => t.status === 'Finalizado')

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Background Marquee for Hero */}
      <div className="absolute top-0 left-0 w-full h-[750px] z-0 overflow-hidden pointer-events-none">

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-reverse {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
          }
          .animate-marquee { display: flex; width: max-content; animation: marquee 50s linear infinite; }
          .animate-marquee-reverse { display: flex; width: max-content; animation: marquee-reverse 50s linear infinite; }
        `}} />

        <div className="flex flex-col gap-3 opacity-[0.85] rotate-[-5deg] scale-[1.1] -translate-y-10">
          {/* Fila 1 */}
          <div className="animate-marquee gap-3">
            {[...heroImages, ...heroImages].map((src, i) => (
              <div key={`r1-${i}`} className="rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg" style={{ width: '280px', height: '180px', minWidth: '280px' }}>
                <img src={`${src}?v=3`} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="eager" />
              </div>
            ))}
          </div>
          {/* Fila 2 */}
          <div className="animate-marquee-reverse gap-3">
            {[...heroImages, ...heroImages].reverse().map((src, i) => (
              <div key={`r2-${i}`} className="rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg" style={{ width: '280px', height: '180px', minWidth: '280px' }}>
                <img src={`${src}?v=3`} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="eager" />
              </div>
            ))}
          </div>
          {/* Fila 3 y 4 (Solo escritorio para ahorrar memoria en móvil) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-3">
            <div className="animate-marquee gap-3">
              {[...heroImages, ...heroImages].map((src, i) => (
                <div key={`r3-${i}`} className="relative w-[300px] h-[200px] rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                  <img src={`${src}?v=3`} alt="bg" className="w-full h-full object-cover" decoding="async" />
                </div>
              ))}
            </div>
            <div className="animate-marquee-reverse gap-3">
              {[...heroImages, ...heroImages].reverse().map((src, i) => (
                <div key={`r4-${i}`} className="relative w-[300px] h-[200px] rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                  <img src={`${src}?v=3`} alt="bg" className="w-full h-full object-cover" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overlays para mezclar perfecto con los textos pero sin ocultar demasiado la foto */}
        <div className="absolute inset-0 bg-background/50 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-20" />
      </div>

      {/* Header */}
      <header className="page-header relative z-30 border-b-none shadow-sm">
        {/* Overlay especifico extra solo para que el nav no pierda contraste */}
        <div className="absolute inset-0 bg-background/50 backdrop-blur-md pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/LogoSinFondo.png"
              alt="Federico TM Logo"
              width={160}
              height={45}
              className="object-contain hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              priority
            />
          </div>
          <Link href="/admin" className="btn-primary hover:scale-105 transition-transform duration-300 shadow-lg shadow-cyan-500/20 text-sm py-2">
            <Shield className="w-4 h-4" />
            Panel Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-20 border-b border-border/20 pt-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Side: Texts & Stats */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-fade-in mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                Resultados en tiempo real
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] mb-6 drop-shadow-lg [text-wrap:balance]">
                Torneos de{' '}
                <span className="gradient-text font-black drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">Tenis de Mesa</span>
              </h1>

              <p className="text-gray-100 text-lg leading-relaxed mb-10 max-w-xl backdrop-blur-sm bg-black/50 rounded-xl p-4 border border-white/5 drop-shadow-md">
                Fomentamos el espíritu deportivo y el esfuerzo continuo. Sigue los resultados en vivo y apoya el talento de nuestra comunidad de jóvenes con el respaldo de la fundación.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                {[
                  { icon: Zap, label: 'En curso', value: active.length, color: 'text-emerald-400', border: 'border-emerald-500/20' },
                  { icon: Trophy, label: 'Finalizados', value: finished.length, color: 'text-cyan-400', border: 'border-cyan-500/20' },
                  { icon: Users, label: 'Total torneos', value: tournaments.length, color: 'text-blue-400', border: 'border-blue-500/20' },
                ].map(({ icon: Icon, label, value, color, border }) => (
                  <div key={label} className={`flex items-center gap-4 glass-card px-5 py-3.5 backdrop-blur-md bg-background/80 border ${border} hover:bg-background/90 transition-colors`}>
                    <Icon className={`w-6 h-6 ${color} drop-shadow-md`} />
                    <div>
                      <div className="text-2xl font-bold text-foreground leading-none mb-1">{value}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Logo TM 3D (Hidden on mobile) */}
            <div className="hidden lg:flex lg:col-span-5 relative group mt-10 lg:mt-0 justify-center items-center">
              <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-visible transition-all duration-500 ease-out transform group-hover:-translate-y-4 group-hover:scale-105 z-20 flex justify-center items-center">
                <Image
                  src="/assets/LogoTM.png"
                  alt="Logo Oficial TM"
                  fill
                  className="object-contain drop-shadow-[0_30px_60px_rgba(6,182,212,0.8)]"
                  priority
                />
              </div>

              {/* Glow Behind Logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-cyan-600/40 blur-[90px] rounded-full pointer-events-none z-0 transition-all duration-500 group-hover:bg-cyan-500/50 group-hover:blur-[110px]" />
            </div>

          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10 bg-background/20">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-5">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              <span className="text-cyan-400/80 font-medium tracking-wide animate-pulse">Cargando torneos...</span>
            </div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 glass-card backdrop-blur-sm bg-background/50 border-white/5">
            <div className="w-20 h-20 rounded-3xl bg-secondary/50 flex items-center justify-center shadow-inner">
              <Trophy className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-foreground text-2xl font-bold">No hay torneos disponibles</h3>
            <p className="text-muted-foreground text-center max-w-sm">Próximamente estaremos publicando nuevos campeonatos. ¡Mantente atento!</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Active tournaments */}
            {active.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">En Curso</h2>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {active.map((t, i) => (
                    <TournamentCard key={t.id} tournament={t} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Finished tournaments */}
            {finished.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight text-white/90">Finalizados</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finished.map((t, i) => (
                    <TournamentCard key={t.id} tournament={t} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 bg-background border-t border-border/10 pt-20 pb-10 mt-10 overflow-hidden">
        {/* Subtle glow for footer area */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">

            {/* Left Column: Brand & Quote */}
            <div className="space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="transition-transform duration-500 hover:scale-105">
                <Image
                  src="/assets/LogoSinFondo.png"
                  alt="Fundación Federico"
                  width={220}
                  height={60}
                  className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                />
              </div>

              <p className="text-gray-400 text-lg italic max-w-md leading-relaxed">
                "La vida nos ha preparado para grandes cosas, hacemos de ellas un reto y las volvemos una realidad."
              </p>

              <Link
                href="https://api.whatsapp.com/send?phone=3182099130&text=Quiero%20hacer%20una%20donaci%C3%B3n%20a%20la%20fundaci%C3%B3n"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-10 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest text-sm text-white">
                  Dona Ahora <span className="text-red-400 group-hover:scale-125 transition-transform duration-300">❤️</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
            </div>

            {/* Right Column: Contact & Socials */}
            <div className="flex flex-col items-center lg:items-start space-y-12">
              <div className="space-y-6">
                <h4 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-sm text-center lg:text-left">Contacto</h4>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4 text-gray-400 group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                      <MapPin className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-base group-hover:text-gray-200 transition-colors">Calle 47 # 29-69 Oficina 202 Bucaramanga, Santander</span>
                  </li>
                  <li className="flex items-center gap-4 text-gray-400 group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-base group-hover:text-gray-200 transition-colors">contacto@fundacionfederico.com</span>
                  </li>
                  <li className="flex items-center gap-4 text-gray-400 group">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                      <Phone className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-base group-hover:text-gray-200 transition-colors">+57 318 209 9130</span>
                  </li>
                </ul>
              </div>

              {/* Social Links */}
              <div className="flex gap-5">
                {[
                  { icon: Facebook, href: 'https://www.facebook.com/fundacionfederico', label: 'Facebook' },
                  { icon: Instagram, href: 'https://www.instagram.com/fundacionfederico/', label: 'Instagram' },
                  { icon: Twitter, href: 'https://x.com/FundacionFRC', label: 'X' },
                ].map(({ icon: Icon, href, label }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-500/40 group transition-all duration-300 shadow-lg"
                    aria-label={label}
                  >
                    <Icon className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors group-hover:scale-110 duration-300" />
                  </Link>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs font-medium uppercase tracking-widest">
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
      className={`group glass-card p-6 h-full flex flex-col justify-between hover:border-cyan-500/40 hover:bg-cyan-950/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-500 animate-fade-in`}
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'both' }}
    >
      <div>
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-600/30 group-hover:border-cyan-400/40 transition-all duration-500 shadow-inner">
            <Trophy className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-500" />
          </div>
          {isActive ? (
            <span className="status-active shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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

        <h3 className="font-extrabold text-foreground text-xl mb-3 group-hover:text-cyan-300 transition-colors duration-300 leading-snug line-clamp-2">
          {tournament.name}
        </h3>

        <div className="flex items-center gap-2 text-muted-foreground/80 text-sm mb-6 font-medium">
          <Calendar className="w-4 h-4 text-cyan-500/70" />
          {new Date(tournament.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <span className="text-sm font-semibold text-cyan-400/70 group-hover:text-cyan-400 transition-colors">Ver campeonato</span>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
          <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}
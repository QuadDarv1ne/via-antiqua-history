'use client'

import { Landmark, BookOpen, ExternalLink, Heart } from 'lucide-react'
import Link from 'next/link'
import { FOOTER_NAV, SOCIAL_LINKS, SITE_NAME, AUTHOR_NAME } from '@/lib/constants'
import { GitHubIcon, RutubeIcon, VKIcon, ORCIDIcon, SchoolIcon, StepikIcon, ChessIcon } from '@/lib/icons'
import { useInView } from '@/hooks/use-in-view'

const socialIcons: Record<string, React.ReactNode> = {
  'Rutube': <RutubeIcon />,
  'GitHub': <GitHubIcon />,
  'VK': <VKIcon />,
  'VK Video': <VKIcon />,
  'ORCID': <ORCIDIcon />,
  'Школа программирования Maestro7IT': <SchoolIcon />,
  'Stepik': <StepikIcon />,
  'Chess': <ChessIcon />,
}

export function Footer() {
  const { ref: gridRef, inView } = useInView({ threshold: 0.1, rootMargin: '-60px' })
  const { ref: bottomRef, inView: bottomInView } = useInView({ threshold: 0.1 })

  return (
    <footer className="mt-auto border-t border-border bg-gradient-to-b from-card/30 via-card/50 to-card/30">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:py-12 md:py-14">
        {/* Основная сетка */}
        <div
          ref={gridRef}
          className="grid sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10"
        >
          {/* Колонка 1: Лого + описание (lg:col-span-4) */}
          <div
            className="lg:col-span-4 transition-all duration-500"
            style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '100ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Landmark className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <span className="font-display text-lg font-semibold block leading-tight">
                  {SITE_NAME}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Via Antiqua
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-5">
              Образовательный ресурс о цивилизациях Древней Греции, Рима,
              Месопотамии и Кубани. Интерактивная хронология, карта и авторский
              анализ единого античного пространства.
            </p>
            {/* Аватар автора */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/50">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-display text-lg font-bold border-2 border-primary/20 shrink-0">
                М
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {AUTHOR_NAME}
                </p>
                <a
                  href="https://github.com/QuadDarv1ne"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <GitHubIcon className="h-3.5 w-3.5" />
                  QuadDarv1ne
                </a>
              </div>
            </div>
          </div>

          {/* Колонка 2: Разделы (lg:col-span-4) */}
          <div
            className="lg:col-span-4 transition-all duration-500"
            style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '220ms' }}
          >
            <h4 className="font-display text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/90">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" /> Разделы
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5" aria-label="Разделы сайта">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 h-px bg-primary transition-all duration-200 group-hover:w-1.5" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка 3: Соцсети (lg:col-span-4) */}
          <div
            className="lg:col-span-4 transition-all duration-500"
            style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '340ms' }}
          >
            <h4 className="font-display text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/90">
              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Контакты
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_LINKS.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/40 border border-border/40 hover:border-primary/30 hover:bg-card/70 hover:scale-110 transition-all duration-200 text-muted-foreground/70 hover:text-foreground group"
                  title={link.title}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <span className="transition-colors duration-200 group-hover:text-primary">
                    {socialIcons[link.label] || <ExternalLink className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <span className="text-xs font-medium truncate">{link.label}</span>
                  <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Нижняя полоса */}
        <div
          ref={bottomRef}
          className="mt-10 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500"
          style={{ opacity: bottomInView ? 1 : 0, transform: bottomInView ? 'translateY(0)' : 'translateY(12px)', transitionDelay: '500ms' }}
        >
          <p className="text-xs text-muted-foreground/60 text-center md:text-left">
            © {new Date().getFullYear()} «{SITE_NAME}». Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
            Сделано с <Heart className="h-3 w-3 text-red-400 fill-red-400" aria-hidden="true" /> для образования
          </p>
        </div>
      </div>
    </footer>
  )
}

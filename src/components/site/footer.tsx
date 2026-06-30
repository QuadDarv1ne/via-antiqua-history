'use client'

import { motion } from 'framer-motion'
import { Landmark, Feather, BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { FOOTER_NAV, SOCIAL_LINKS } from '@/lib/constants'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const colVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={containerVariants}
          className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
        >
          <motion.div variants={colVariants}>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Landmark className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-semibold">
                Исторический Лабиринт
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Образовательный ресурс о цивилизациях Древней Греции, Рима,
              Месопотамии и Кубани. Интерактивная хронология, карта и авторский
              анализ единого античного пространства.
            </p>
          </motion.div>

          <motion.div variants={colVariants}>
            <h4 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Разделы
            </h4>
            <ul className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-2">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={colVariants}>
            <h4 className="font-display text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
              <Feather className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Авторство
            </h4>
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display text-base sm:text-lg font-semibold border border-border shrink-0">
                М
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  Дуплей Максим Игоревич
                </p>
                <a
                  href="https://github.com/QuadDarv1ne"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  QuadDarv1ne
                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </a>
              </div>
            </div>
            <p className="mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-muted-foreground italic leading-relaxed">
              Материалы сайта носят образовательный характер и основаны на
              классических исторических источниках. Цитирование — с указанием
              автора.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3"
        >
          <p className="text-[11px] sm:text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} «Исторический Лабиринт». Все права
            защищены.
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center md:justify-end">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
                title={link.title}
              >
                {link.label}
                <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

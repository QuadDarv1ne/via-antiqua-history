import Link from 'next/link'
import { Landmark } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="container mx-auto max-w-7xl px-3 sm:px-4">
          <nav className="flex h-14 sm:h-16 items-center">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-12">
                <Landmark className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="font-display text-base lg:text-xl font-semibold tracking-wide truncate">
                Исторический Лабиринт
              </span>
            </Link>
          </nav>
        </div>
      </header>
      <div className="pt-14 sm:pt-16">
        {children}
      </div>
    </>
  )
}

import Link from 'next/link'
import { Compass, Home, Landmark } from 'lucide-react'

export default function NotFound() {
  return (
    <main role="alert" className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="text-center max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground animate-[scale-in_0.3s_ease-out]">
            <Landmark className="h-5 w-5" />
          </span>
        </Link>

        <div className="flex justify-center mb-6 animate-[scale-in_0.4s_ease-out_0.1s_both]">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border border-border">
            <Compass className="h-8 w-8 text-muted-foreground" />
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl font-semibold mb-2 gold-text animate-[fade-up_0.5s_ease-out_0.25s_both]">
          404 — Путь не найден
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed animate-[fade-up_0.5s_ease-out_0.45s_both]">
          Эта страница затерялась в лабиринте истории. Возможно, она никогда не
          существовала или была разрушена временем.
        </p>

        <div className="animate-[fade-up_0.5s_ease-out_0.55s_both]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 sm:px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
          >
            <Home className="h-4 w-4" />
            Вернуться к началу
          </Link>
        </div>
      </div>
    </main>
  )
}

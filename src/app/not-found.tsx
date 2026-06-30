import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Compass className="h-8 w-8 text-muted-foreground" />
          </span>
        </div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold mb-2 gold-text">
          404
        </h1>
        <p className="font-display text-xl text-foreground mb-4">
          Путь не найден
        </p>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Эта страница затерялась в лабиринте истории. Возможно, она никогда не
          существовала или была разрушена временем.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 sm:px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
        >
          <Home className="h-4 w-4" />
          Вернуться к началу
        </Link>
      </div>
    </main>
  )
}

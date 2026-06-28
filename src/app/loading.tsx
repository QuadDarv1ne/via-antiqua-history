import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </span>
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Открываем свиток истории…
          </p>
        </div>
      </div>
    </main>
  )
}

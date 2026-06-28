import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Открываем свиток истории…
        </p>
      </div>
    </main>
  )
}

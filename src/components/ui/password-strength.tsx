import { cn } from '@/lib/utils'

interface PasswordStrengthBarProps {
  score: number
  label: string
  color: string
}

export function PasswordStrengthBar({ score, label, color }: PasswordStrengthBarProps) {
  if (score === 0 && !label) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? color : 'bg-muted/60'
            )}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground/60">{label}</p>
    </div>
  )
}

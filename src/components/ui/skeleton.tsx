import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  )
}

interface CardSkeletonProps {
  lines?: number
}

export function CardSkeleton({ lines = 4 }: CardSkeletonProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <Skeleton className="h-5 w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 mb-2',
            i === lines - 1 && 'w-2/3'
          )}
        />
      ))}
    </div>
  )
}

export function GridSkeleton({ count = 3, lines = 3 }: { count?: number; lines?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 sm:p-5"
        >
          <Skeleton className="h-5 w-2/3 mb-3" />
          <Skeleton className="h-3 w-1/2 mb-2" />
          {Array.from({ length: lines - 1 }).map((_, j) => (
            <Skeleton key={j} className="h-3 w-full mb-1.5" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SectionDivider() {
  return (
    <div className="relative h-16 sm:h-20 md:h-24 overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-gradient-to-b from-transparent via-border/30 to-transparent" />
      </div>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-3 sm:gap-4 px-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-border/50 bg-background shadow-sm">
          <span className="h-2 w-2 rounded-full bg-primary/30" />
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />
      </div>
      {/* Меандроподобная полоска внизу */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-[0.07] dark:opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            currentColor 0, currentColor 1px,
            transparent 1px, transparent 3px,
            currentColor 3px, currentColor 4px,
            transparent 4px, transparent 7px
          )`,
        }}
      />
    </div>
  )
}

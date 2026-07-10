'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface FilterOption {
  key: string
  label: string
  color?: string
}

interface FilterBarProps {
  options: FilterOption[]
  active: string
  onChange: (key: string) => void
  className?: string
  label?: string
}

export const FilterBar = React.memo(function FilterBar({
  options,
  active,
  onChange,
  className,
  label,
}: FilterBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIdx = options.findIndex((o) => o.key === active);
    if (currentIdx === -1) return;
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (currentIdx + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (currentIdx - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = options.length - 1;
    }
    if (nextIdx !== currentIdx) {
      onChange(options[nextIdx].key);
    }
  };

  return (
    <div
      className={`flex flex-wrap gap-1.5 sm:gap-2 ${className ?? ''}`}
      role="radiogroup"
      aria-label={label || 'Фильтр'}
      onKeyDown={handleKeyDown}
    >
      {options.map((opt) => (
        <button
          type="button"
          key={opt.key}
          role="radio"
          aria-checked={active === opt.key}
          tabIndex={active === opt.key ? 0 : -1}
          onClick={() => onChange(opt.key)}
          className={cn(
            'px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
            active === opt.key
              ? 'text-white border-transparent'
              : 'bg-card border-border hover:border-primary/40'
          )}
          style={
            active === opt.key && opt.color
              ? { backgroundColor: opt.color }
              : opt.color
                ? { color: opt.color }
                : undefined
          }
        >
          {opt.color && (
            <span
              className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full mr-1.5"
              style={{
                backgroundColor:
                  active === opt.key ? 'white' : opt.color,
              }}
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  )
})

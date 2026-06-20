// Единые константы для всего проекта

export const REGION_COLORS: Record<string, string> = {
  greece: 'oklch(0.55 0.13 70)',
  rome: 'oklch(0.55 0.13 35)',
  mesopotamia: 'oklch(0.55 0.13 50)',
  kuban: 'oklch(0.5 0.11 145)',
  egypt: 'oklch(0.6 0.1 60)',
  general: 'oklch(0.5 0.05 60)',
}

export const REGION_LABELS: Record<string, string> = {
  greece: 'Греция',
  rome: 'Рим',
  mesopotamia: 'Месопотамия',
  kuban: 'Кубань',
  egypt: 'Египет',
  general: 'Общее',
}

export const REGION_SHORT: Record<string, string> = {
  greece: 'ГР',
  rome: 'РИ',
  mesopotamia: 'МЕ',
  kuban: 'КУ',
  egypt: 'ЕГ',
  general: 'ОБ',
}

export const FILTER_LABELS: Record<string, string> = {
  greece: 'Греция',
  rome: 'Рим',
  mesopotamia: 'Месопотамия',
  kuban: 'Кубань',
  general: 'Общее',
  all: 'Все',
}

// Префикс для скролл-индикатора (должен быть выше navbar z-50)
export const SCROLL_INDICATOR_Z_INDEX = 51

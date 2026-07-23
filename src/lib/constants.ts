// Единые константы для всего проекта

export const DEFAULT_SITE_URL = 'https://via-antiqua.maestro7it.ru'
export const SUBSCRIPTION_PRICE = 999

export const REGION_COLORS: Record<string, string> = {
  greece: 'oklch(0.55 0.13 70)',
  rome: 'oklch(0.55 0.13 35)',
  mesopotamia: 'oklch(0.55 0.13 50)',
  kuban: 'oklch(0.5 0.11 145)',
  general: 'oklch(0.5 0.05 60)',
}

export const REGION_LABELS: Record<string, string> = {
  greece: 'Греция',
  rome: 'Рим',
  mesopotamia: 'Месопотамия',
  kuban: 'Кубань',
  general: 'Общее',
}

export const REGION_SHORT: Record<string, string> = {
  greece: 'ГР',
  rome: 'РИ',
  mesopotamia: 'МЕ',
  kuban: 'КУ',
  general: 'ОБ',
}

export const FILTER_LABELS: Record<string, string> = {
  ...REGION_LABELS,
  all: 'Все',
}

// Навигация — единый источник для navbar, footer, breadcrumbs
export const PUBLIC_NAV = [
  { href: '#greece', label: 'Греция' },
  { href: '#kuban', label: 'Кубань' },
  { href: '#persons', label: 'Персоналии' },
  { href: '#wonders', label: 'Чудеса' },
  { href: '#timeline', label: 'Хронология' },
  { href: '#glossary', label: 'Глоссарий' },
  { href: '#quiz', label: 'Квиз' },
  { href: '#sources', label: 'Источники' },
] as const

export const PROTECTED_NAV = [
  { href: '#rome', label: 'Рим' },
  { href: '#mesopotamia', label: 'Месопотамия' },
  { href: '#orders', label: 'Ордера' },
  { href: '#epochs', label: 'Эпохи' },
  { href: '#map', label: 'Карта' },
  { href: '#comparison', label: 'Сравнение' },
  { href: '#analysis', label: 'Анализ' },
] as const

export const SITE_NAV = [...PUBLIC_NAV, ...PROTECTED_NAV] as const

// Полный список навигации для footer (SITE_NAV уже содержит #sources через PUBLIC_NAV)
export const FOOTER_NAV = [...SITE_NAV] as const

export const SOCIAL_LINKS = [
  { href: 'https://rutube.ru/channel/4218729/', label: 'Rutube', title: 'Хижина программиста' },
  { href: 'https://github.com/QuadDarv1ne', label: 'GitHub', title: 'QuadDarv1ne' },
  { href: 'https://vk.com/maestro7it', label: 'VK', title: 'maestro7it' },
  { href: 'https://live.vkvideo.ru/quadd4rv1n7', label: 'VK Video', title: 'quadd4rv1n7' },
  { href: 'https://orcid.org/0009-0007-7605-539X', label: 'ORCID', title: 'ORCID' },
  { href: 'https://school-maestro7it.ru/', label: 'Школа программирования Maestro7IT', title: 'Школа Маэстро' },
  { href: 'https://stepik.org/users/150943726/teach', label: 'Stepik', title: 'Stepik' },
  { href: 'https://worldchess.com/profile/1094367', label: 'Chess', title: 'World Chess' },
] as const



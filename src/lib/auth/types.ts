export type User = {
  id: string
  email: string
  name: string
  emailVerified: number
  totpEnabled: number
  createdAt: string
}

export type BookmarkRow = {
  id: string
  type: string
  title: string
  subtitle: string
  href: string
  region: string
  createdAt: string
}



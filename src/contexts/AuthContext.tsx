'use client'

import * as React from 'react'
import type { User } from '@/lib/auth/types'

type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string, totpCode?: string) => Promise<{ ok: boolean; error?: string; require2fa?: boolean }>
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.status === 429) {
        setUser(null)
        return
      }
      const json = await res.json()
      if (json.ok && json.data) {
        setUser(json.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const login = React.useCallback(async (email: string, password: string, totpCode?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpCode }),
      })
      const json = await res.json()

      if (!json.ok) {
        return { ok: false, error: json.error || 'Ошибка входа' }
      }

      if (json.data?.require2fa) {
        return { ok: true, require2fa: true }
      }

      // Fetch canonical user data from /api/auth/me to ensure correct field mapping
      await refresh()

      return { ok: true }
    } catch {
      return { ok: false, error: 'Ошибка сети. Проверьте подключение.' }
    }
  }, [refresh])

  const register = React.useCallback(async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const json = await res.json()

      if (json.ok && json.data) {
        setUser(json.data as User)
      }

      return { ok: json.ok, error: json.error }
    } catch {
      return { ok: false, error: 'Ошибка сети. Проверьте подключение.' }
    }
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

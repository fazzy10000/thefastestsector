import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import type { UserRole } from '../lib/types'

export type AuthUser = {
  uid: string
  email: string
  displayName: string
  role: UserRole
}

type AuthAction =
  | 'manage_users'
  | 'manage_authors'
  | 'edit_any_article'
  | 'edit_own_article'
  | 'publish_article'
  | 'manage_settings'
  | 'manage_seo'
  | 'manage_quizzes'
  | 'manage_newsletter'
  | 'manage_ads'

type AuthContextValue = {
  user: AuthUser | null
  uid: string
  loading: boolean
  role: UserRole
  signIn: (email: string, password: string) => Promise<AuthUser>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isDemo: boolean
  can: (action: AuthAction) => boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole>('author')

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: AuthUser | null }>('/api/auth/me')
      setUser(data.user)
      setRole(data.user?.role || 'author')
    } catch {
      setUser(null)
      setRole('author')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setUser(data.user)
    setRole(data.user.role)
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setRole('author')
    }
  }, [])

  const can = useCallback(
    (action: AuthAction) => {
      switch (action) {
        case 'manage_users':
          return role === 'admin'
        case 'manage_settings':
        case 'manage_seo':
          return role === 'admin' || role === 'seo'
        case 'manage_authors':
        case 'edit_any_article':
        case 'publish_article':
        case 'manage_newsletter':
        case 'manage_ads':
          return role === 'admin' || role === 'editor'
        case 'manage_quizzes':
          return role === 'admin' || role === 'editor' || role === 'author'
        case 'edit_own_article':
          return true
        default:
          return false
      }
    },
    [role],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      uid: user?.uid || '',
      loading,
      role,
      signIn,
      signOut,
      isAuthenticated: Boolean(user),
      isDemo: false,
      can,
      refresh,
    }),
    [user, loading, role, signIn, signOut, can, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

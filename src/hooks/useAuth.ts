import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, isDemoMode, isFirebaseConfigured } from '../lib/firebase'
import type { UserRole } from '../lib/types'

const DEMO_KEY = 'tfs_demo_auth'
const DEMO_ROLE_KEY = 'tfs_demo_role'
const DEMO_SIGNED_OUT_KEY = 'tfs_demo_signed_out'

let listeners: Array<() => void> = []
function emitDemoChange() {
  listeners.forEach((l) => l())
}

function subscribeDemoAuth(cb: () => void) {
  listeners.push(cb)
  return () => { listeners = listeners.filter((l) => l !== cb) }
}

function getDemoSnapshot() {
  return localStorage.getItem(DEMO_KEY) === 'true'
}

// Auto-establishes a demo session so dev/demo mode needs no login step on first visit —
// but respects an explicit sign-out, so the Sign Out button stays effective until
// Demo Login is clicked again.
function ensureDemoSession() {
  if (localStorage.getItem(DEMO_SIGNED_OUT_KEY) === 'true') return
  if (localStorage.getItem(DEMO_KEY) !== 'true') {
    localStorage.setItem(DEMO_KEY, 'true')
    localStorage.setItem(DEMO_ROLE_KEY, 'admin')
    emitDemoChange()
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole>('admin')
  const demoAuthed = useSyncExternalStore(subscribeDemoAuth, getDemoSnapshot)

  useEffect(() => {
    if (isDemoMode) {
      ensureDemoSession()
      const savedRole = localStorage.getItem(DEMO_ROLE_KEY) as UserRole | null
      setRole(savedRole || 'admin')
      setLoading(false)
      return
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        setUser(u)
        if (u) {
          const { getDoc, setDoc, doc, collection, getDocs } = await import('firebase/firestore')
          const { db } = await import('../lib/firebase')
          if (db) {
            try {
              const snap = await getDoc(doc(db, 'users', u.uid))
              if (snap.exists()) {
                setRole((snap.data().role as UserRole) || 'author')
              } else {
                const usersSnap = await getDocs(collection(db, 'users'))
                const assignedRole: UserRole = usersSnap.empty ? 'admin' : 'author'
                await setDoc(doc(db, 'users', u.uid), {
                  email: u.email || '',
                  displayName: u.displayName || u.email?.split('@')[0] || '',
                  role: assignedRole,
                  createdAt: Date.now(),
                })
                setRole(assignedRole)
              }
            } catch {
              setRole('author')
            }
          }
        }
        setLoading(false)
      })
      return unsubscribe
    }

    const savedRole = localStorage.getItem(DEMO_ROLE_KEY) as UserRole | null
    setRole(savedRole || 'admin')
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isDemoMode && isFirebaseConfigured && auth) {
      return signInWithEmailAndPassword(auth, email, password)
    }
    throw new Error('Firebase not configured — use Demo Login instead')
  }

  const demoSignIn = () => {
    localStorage.removeItem(DEMO_SIGNED_OUT_KEY)
    localStorage.setItem(DEMO_KEY, 'true')
    localStorage.setItem(DEMO_ROLE_KEY, 'admin')
    setRole('admin')
    emitDemoChange()
  }

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.setItem(DEMO_SIGNED_OUT_KEY, 'true')
      localStorage.removeItem(DEMO_KEY)
      emitDemoChange()
      return
    }
    if (isFirebaseConfigured && auth) {
      return firebaseSignOut(auth)
    }
    localStorage.removeItem(DEMO_KEY)
    localStorage.removeItem(DEMO_ROLE_KEY)
  }

  const isAuthenticated = isDemoMode ? demoAuthed : Boolean(user)
  const uid = isDemoMode ? (demoAuthed ? 'demo-admin' : '') : (user?.uid || '')

  const can = useCallback(
    (
      action:
        | 'manage_users'
        | 'manage_authors'
        | 'edit_any_article'
        | 'edit_own_article'
        | 'manage_settings'
        | 'manage_seo'
        | 'manage_quizzes',
    ) => {
      switch (action) {
        case 'manage_users':
          return role === 'admin'
        case 'manage_settings':
          return role === 'admin' || role === 'seo'
        case 'manage_seo':
          return role === 'admin' || role === 'seo'
        case 'manage_authors':
        case 'edit_any_article':
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

  return {
    user,
    uid,
    loading,
    role,
    signIn,
    signOut,
    demoSignIn,
    isAuthenticated,
    isDemo: isDemoMode,
    can,
  }
}

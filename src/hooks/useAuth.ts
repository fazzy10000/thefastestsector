import { useState, useEffect, useSyncExternalStore, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import type { UserRole } from '../lib/types'

const DEMO_KEY = 'tfs_demo_auth'
const DEMO_ROLE_KEY = 'tfs_demo_role'

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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole>('admin')
  const demoUser = useSyncExternalStore(subscribeDemoAuth, getDemoSnapshot)

  useEffect(() => {
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
    if (isFirebaseConfigured && auth) {
      return signInWithEmailAndPassword(auth, email, password)
    }
    throw new Error('Firebase not configured — use Demo Login instead')
  }

  const demoSignIn = () => {
    localStorage.setItem(DEMO_KEY, 'true')
    localStorage.setItem(DEMO_ROLE_KEY, 'admin')
    setRole('admin')
    emitDemoChange()
  }

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      return firebaseSignOut(auth)
    }
    localStorage.removeItem(DEMO_KEY)
    localStorage.removeItem(DEMO_ROLE_KEY)
    emitDemoChange()
  }

  const isAuthenticated = isFirebaseConfigured ? Boolean(user) : demoUser

  const uid = isFirebaseConfigured ? (user?.uid || '') : (demoUser ? 'demo-admin' : '')

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
    isDemo: !isFirebaseConfigured,
    can,
  }
}

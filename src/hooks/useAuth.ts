import { useState, useEffect, useSyncExternalStore } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'

const DEMO_KEY = 'tfs_demo_auth'

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
  const demoUser = useSyncExternalStore(subscribeDemoAuth, getDemoSnapshot)

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
      return unsubscribe
    }
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
    emitDemoChange()
  }

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      return firebaseSignOut(auth)
    }
    localStorage.removeItem(DEMO_KEY)
    emitDemoChange()
  }

  const isAuthenticated = Boolean(user) || demoUser

  return { user, loading, signIn, signOut, demoSignIn, isAuthenticated, isDemo: !isFirebaseConfigured }
}

import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { AppUser, Invite, UserRole } from '../lib/types'

const COLLECTION = 'users'
const INVITES_COLLECTION = 'invites'
const LS_KEY = 'tfs_users'
const LS_INVITES_KEY = 'tfs_invites'

function readLocal(): AppUser[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AppUser[]
  } catch {
    return []
  }
}

function writeLocal(users: AppUser[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(users))
}

function readLocalInvites(): Invite[] {
  try {
    const raw = localStorage.getItem(LS_INVITES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Invite[]
  } catch {
    return []
  }
}

function writeLocalInvites(invites: Invite[]) {
  localStorage.setItem(LS_INVITES_KEY, JSON.stringify(invites))
}

function initLocalIfEmpty() {
  if (!localStorage.getItem(LS_KEY)) {
    const defaultAdmin: AppUser = {
      uid: 'demo-admin',
      email: 'admin@thefastestsector.com',
      displayName: 'Demo Admin',
      role: 'admin',
      createdAt: Date.now(),
    }
    writeLocal([defaultAdmin])
  }
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      const data = readLocal()
      setUsers(data)
      setInvites(readLocalInvites().filter((i) => !i.used))
      setLoading(false)
      return data
    }

    setLoading(true)
    try {
      const [usersSnap, invitesSnap] = await Promise.all([
        getDocs(collection(db, COLLECTION)),
        getDocs(query(collection(db, INVITES_COLLECTION), where('used', '==', false))),
      ])
      const data = usersSnap.docs.map((d) => ({ ...d.data(), uid: d.id } as AppUser))
      const invData = invitesSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Invite))
      setUsers(data)
      setInvites(invData)
      return data
    } catch (err) {
      console.error('Error fetching users:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getUser = useCallback(async (uid: string): Promise<AppUser | null> => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      return readLocal().find((u) => u.uid === uid) ?? null
    }
    try {
      const snap = await getDoc(doc(db, COLLECTION, uid))
      if (!snap.exists()) return null
      return { ...snap.data(), uid: snap.id } as AppUser
    } catch {
      return null
    }
  }, [])

  const ensureUser = useCallback(
    async (uid: string, email: string, displayName: string): Promise<AppUser> => {
      const existing = await getUser(uid)
      if (existing) return existing

      const newUser: AppUser = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role: 'author',
        createdAt: Date.now(),
      }

      if (!isFirebaseConfigured || !db) {
        const all = readLocal()
        all.push(newUser)
        writeLocal(all)
        setUsers(all)
      } else {
        const { uid: id, ...data } = newUser
        await setDoc(doc(db, COLLECTION, id), data)
      }
      return newUser
    },
    [getUser],
  )

  const createInvite = useCallback(async (email: string, role: UserRole, createdBy: string): Promise<Invite> => {
    const invite: Invite = {
      id: crypto.randomUUID(),
      email,
      role,
      createdBy,
      createdAt: Date.now(),
      used: false,
    }

    if (!isFirebaseConfigured || !db) {
      const all = readLocalInvites()
      all.push(invite)
      writeLocalInvites(all)
      setInvites(all.filter((i) => !i.used))
      return invite
    }

    const { id, ...data } = invite
    await setDoc(doc(db, INVITES_COLLECTION, id), data)
    await fetchUsers()
    return invite
  }, [fetchUsers])

  const getInviteByToken = useCallback(async (token: string): Promise<Invite | null> => {
    if (!isFirebaseConfigured || !db) {
      return readLocalInvites().find((i) => i.id === token && !i.used) ?? null
    }
    try {
      const snap = await getDoc(doc(db, INVITES_COLLECTION, token))
      if (!snap.exists()) return null
      const data = { ...snap.data(), id: snap.id } as Invite
      return data.used ? null : data
    } catch {
      return null
    }
  }, [])

  const markInviteUsed = useCallback(async (token: string) => {
    if (!isFirebaseConfigured || !db) {
      const all = readLocalInvites()
      const idx = all.findIndex((i) => i.id === token)
      if (idx !== -1) {
        all[idx] = { ...all[idx], used: true }
        writeLocalInvites(all)
        setInvites(all.filter((i) => !i.used))
      }
      return
    }
    const snap = await getDoc(doc(db, INVITES_COLLECTION, token))
    if (snap.exists()) {
      await setDoc(doc(db, INVITES_COLLECTION, token), { ...snap.data(), used: true })
    }
  }, [])

  const revokeInvite = useCallback(async (token: string) => {
    if (!isFirebaseConfigured || !db) {
      const filtered = readLocalInvites().filter((i) => i.id !== token)
      writeLocalInvites(filtered)
      setInvites(filtered.filter((i) => !i.used))
      return
    }
    await deleteDoc(doc(db, INVITES_COLLECTION, token))
    await fetchUsers()
  }, [fetchUsers])

  const updateRole = useCallback(async (uid: string, role: UserRole) => {
    if (!isFirebaseConfigured || !db) {
      const all = readLocal()
      const idx = all.findIndex((u) => u.uid === uid)
      if (idx !== -1) {
        all[idx] = { ...all[idx], role }
        writeLocal(all)
        setUsers(all)
      }
      return
    }
    const snap = await getDoc(doc(db, COLLECTION, uid))
    if (snap.exists()) {
      await setDoc(doc(db, COLLECTION, uid), { ...snap.data(), role })
      await fetchUsers()
    }
  }, [fetchUsers])

  const removeUser = useCallback(async (uid: string) => {
    if (!isFirebaseConfigured || !db) {
      const filtered = readLocal().filter((u) => u.uid !== uid)
      writeLocal(filtered)
      setUsers(filtered)
      return
    }
    await deleteDoc(doc(db, COLLECTION, uid))
    await fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    invites,
    loading,
    fetchUsers,
    getUser,
    ensureUser,
    createInvite,
    getInviteByToken,
    markInviteUsed,
    revokeInvite,
    updateRole,
    removeUser,
  }
}

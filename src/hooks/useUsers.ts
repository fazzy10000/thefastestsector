import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { AppUser, Invite, UserRole } from '../lib/types'

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, i] = await Promise.all([
        api<{ users: AppUser[] }>('/api/users'),
        api<{ invites: Invite[] }>('/api/invites'),
      ])
      setUsers(u.users)
      setInvites(i.invites)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const createInvite = useCallback(
    async (email: string, role: UserRole) => {
      const res = await api<{ id: string }>('/api/invites', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      })
      await fetchAll()
      return res.id
    },
    [fetchAll],
  )

  const revokeInvite = useCallback(
    async (id: string) => {
      await api(`/api/invites/${id}`, { method: 'DELETE' })
      await fetchAll()
    },
    [fetchAll],
  )

  const updateRole = useCallback(
    async (uid: string, role: UserRole) => {
      await api(`/api/users/${uid}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      await fetchAll()
    },
    [fetchAll],
  )

  const removeUser = useCallback(
    async (uid: string) => {
      await api(`/api/users/${uid}`, { method: 'DELETE' })
      await fetchAll()
    },
    [fetchAll],
  )

  const getInviteByToken = useCallback(async (token: string): Promise<Invite | null> => {
    try {
      const data = await api<{ invite: Invite }>(`/api/invites/${token}`)
      if (data.invite.used) return null
      return data.invite
    } catch {
      return null
    }
  }, [])

  return {
    users,
    invites,
    loading,
    fetchAll,
    createInvite,
    revokeInvite,
    updateRole,
    removeUser,
    getInviteByToken,
  }
}

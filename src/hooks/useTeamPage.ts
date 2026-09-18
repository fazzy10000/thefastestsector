import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { TeamPageMember } from '../lib/types'

export function useTeamPage() {
  const [members, setMembers] = useState<TeamPageMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ members: TeamPageMember[] }>('/api/team-page')
      setMembers(data.members || [])
      return data.members || []
    } catch {
      setMembers([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMembers()
  }, [fetchMembers])

  const saveMembers = useCallback(async (next: TeamPageMember[]) => {
    const data = await api<{ members: TeamPageMember[] }>('/api/team-page', {
      method: 'PUT',
      body: JSON.stringify({ members: next }),
    })
    setMembers(data.members || next)
    return data.members || next
  }, [])

  const importAuthors = useCallback(async (authorIds?: string[]) => {
    const data = await api<{ members: TeamPageMember[]; imported: number }>(
      '/api/team-page/import-authors',
      {
        method: 'POST',
        body: JSON.stringify({ authorIds: authorIds || [] }),
      },
    )
    setMembers(data.members || [])
    return data
  }, [])

  const importStaff = useCallback(async (userIds?: string[]) => {
    const data = await api<{ members: TeamPageMember[]; imported: number }>(
      '/api/team-page/import-staff',
      {
        method: 'POST',
        body: JSON.stringify({ userIds: userIds || [] }),
      },
    )
    setMembers(data.members || [])
    return data
  }, [])

  const fetchStaffCandidates = useCallback(async () => {
    const data = await api<{
      users: { uid: string; email: string; displayName: string; role: string }[]
    }>('/api/team-page/staff-candidates')
    return data.users || []
  }, [])

  return {
    members,
    loading,
    fetchMembers,
    saveMembers,
    importAuthors,
    importStaff,
    fetchStaffCandidates,
  }
}

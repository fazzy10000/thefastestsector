import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../lib/types'
import {
  Users,
  Shield,
  Edit3,
  UserCircle,
  Trash2,
  UserPlus,
  Crown,
  X,
  Copy,
  Check,
  Mail,
  Clock,
  Search,
} from 'lucide-react'

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: typeof Shield; desc: string }> = {
  admin: {
    label: 'Admin',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: Crown,
    desc: 'Full access: manage users, authors, settings, and all articles',
  },
  editor: {
    label: 'Editor',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Edit3,
    desc: 'Edit any article, manage authors',
  },
  author: {
    label: 'Author',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: UserCircle,
    desc: 'Create and edit their own articles',
  },
  seo: {
    label: 'SEO',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Search,
    desc: 'Can manage SEO settings and article metadata',
  },
}

export default function TeamManager() {
  const { users, invites, loading, createInvite, revokeInvite, updateRole, removeUser } = useUsers()
  const { can, uid, user } = useAuth()
  const [editingUid, setEditingUid] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('author')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  if (!can('manage_users')) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Access Restricted</h2>
        <p className="text-sm text-gray-400 mt-1">Only admins can manage the team.</p>
      </div>
    )
  }

  const handleRoleChange = async (userUid: string, newRole: UserRole) => {
    await updateRole(userUid, newRole)
    setEditingUid(null)
  }

  const handleRemove = async (userUid: string) => {
    if (!confirm('Remove this user? They will lose access to the admin panel.')) return
    await removeUser(userUid)
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    const createdBy = user?.email || 'admin'
    const invite = await createInvite(inviteEmail.trim(), inviteRole, createdBy)
    const base = window.location.origin + '/thefastestsector'
    setInviteLink(`${base}/admin/signup?token=${invite.id}`)
    setInviteEmail('')
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevokeInvite = async (id: string) => {
    if (!confirm('Revoke this invite? The link will no longer work.')) return
    await revokeInvite(id)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Team
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage user roles and permissions</p>
        </div>
        <button
          onClick={() => { setShowInvite(!showInvite); setInviteLink('') }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          {showInvite ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showInvite ? 'Cancel' : 'Invite Member'}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Send an Invite
          </h3>

          {inviteLink ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Invite created! Share this link with your new team member:
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                The invitee will create their own password when they sign up. Their default role is <strong className="capitalize">{inviteRole}</strong>.
              </p>
              <button
                onClick={() => setInviteLink('')}
                className="text-sm text-primary hover:underline"
              >
                Send another invite
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="writer@example.com"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                    {(['author', 'editor', 'seo', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInviteRole(r)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          inviteRole === r
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {ROLE_CONFIG[r].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <Mail className="w-4 h-4" />
                Create Invite Link
              </button>
            </form>
          )}
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-amber-900 text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Invites ({invites.length})
          </h3>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 break-all">{inv.email}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_CONFIG[inv.role].color}`}>
                    {ROLE_CONFIG[inv.role].label}
                  </span>
                </div>
                <button
                  onClick={() => handleRevokeInvite(inv.id)}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role legend */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, config]) => (
          <div key={role} className={`rounded-xl border p-4 ${config.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <config.icon className="w-4 h-4" />
              <span className="font-semibold text-sm">{config.label}</span>
            </div>
            <p className="text-xs opacity-80">{config.desc}</p>
          </div>
        ))}
      </div>

      {/* User list */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading team members...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No team members yet. Click "Invite Member" to send an invite.</div>
        ) : (
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.author
                const isCurrentUser = u.uid === uid
                return (
                  <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {u.displayName}
                            {isCurrentUser && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-5 py-4">
                      {editingUid === u.uid ? (
                        <div className="flex items-center gap-1">
                          {(['admin', 'editor', 'seo', 'author'] as UserRole[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(u.uid, r)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                u.role === r ? ROLE_CONFIG[r].color : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {ROLE_CONFIG[r].label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                          <config.icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {!isCurrentUser && (
                          <>
                            <button
                              onClick={() => setEditingUid(editingUid === u.uid ? null : u.uid)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Change role"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(u.uid)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

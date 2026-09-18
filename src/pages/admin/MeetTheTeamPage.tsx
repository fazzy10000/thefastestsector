import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeamPage } from '../../hooks/useTeamPage'
import { useSettings } from '../../hooks/useSettings'
import type { TeamPageMember } from '../../lib/types'
import MediaPicker from '../../components/admin/MediaPicker'
import {
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Users,
  ExternalLink,
} from 'lucide-react'

const EMPTY: Omit<TeamPageMember, 'sortOrder'> = {
  id: '',
  authorId: '',
  userId: '',
  name: '',
  roleTitle: '',
  bio: '',
  avatar: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  articleCount: 0,
}
export default function MeetTheTeamPage() {
  const { members, loading, saveMembers, importStaff } = useTeamPage()
  const { settings, saveSettings } = useSettings()
  const [draft, setDraft] = useState<TeamPageMember[]>([])
  const [dirty, setDirty] = useState(false)
  const [ourStory, setOurStory] = useState<string | null>(null)
  const [editing, setEditing] = useState<TeamPageMember | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const list = dirty ? draft : members
  const storyText = ourStory ?? settings.ourStory
  const storyDirty = ourStory !== null && ourStory !== settings.ourStory
  const hasUnsaved = dirty || storyDirty

  const beginEdit = (member?: TeamPageMember) => {
    setEditing(
      member
        ? { ...member }
        : { ...EMPTY, id: crypto.randomUUID(), sortOrder: list.length },
    )
  }

  const updateList = (next: TeamPageMember[]) => {
    setDraft(next.map((m, i) => ({ ...m, sortOrder: i })))
    setDirty(true)
  }

  const handleSaveMember = () => {
    if (!editing || !editing.name.trim()) return
    const nextMember = {
      ...editing,
      name: editing.name.trim(),
      roleTitle: editing.roleTitle.trim(),
      bio: editing.bio.trim(),
    }
    const idx = list.findIndex((m) => m.id === nextMember.id)
    if (idx >= 0) {
      const next = [...list]
      next[idx] = nextMember
      updateList(next)
    } else {
      updateList([...list, nextMember])
    }
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Remove this person from the Meet the Team page?')) return
    updateList(list.filter((m) => m.id !== id))
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= list.length) return
    const next = [...list]
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    updateList(next)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setMessage('')
    try {
      if (dirty) {
        await saveMembers(list)
        setDirty(false)
      }
      if (storyDirty) {
        await saveSettings({ ...settings, ourStory: storyText })
        setOurStory(null)
      }
      setMessage('About / Meet the Team page saved.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleImportTeam = async () => {
    setSaving(true)
    setMessage('')
    try {
      if (dirty) await saveMembers(list)
      const result = await importStaff([])
      setDirty(false)
      const parts: string[] = []
      if (result.imported > 0) {
        parts.push(`added ${result.imported}`)
      }
      if ((result.linked || 0) > 0) {
        parts.push(`linked ${result.linked} to Author profiles`)
      }
      setMessage(
        parts.length
          ? `Team import complete — ${parts.join(', ')}.`
          : 'Everyone with a login is already on the page.',
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meet the Team</h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit the public{' '}
            <Link
              to="/about"
              target="_blank"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              About / Meet the Team page
              <ExternalLink className="w-3 h-3" />
            </Link>
            . Import team pulls everyone with a login (authors, editors, SEO, admins) and fills
            bios/photos from their Author profile when names match. Add extras for anyone without
            a login.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleImportTeam()}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            Import team
          </button>
          <button
            type="button"
            onClick={() => beginEdit()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            Add person
          </button>
          <button
            type="button"
            onClick={() => void handleSaveAll()}
            disabled={saving || !hasUnsaved}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save page
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-sky-50 border border-sky-200 text-sm text-sky-800">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 text-sm mb-2">Our Story</h2>
        <p className="text-xs text-gray-400 mb-3">Shown at the top of the public About page.</p>
        <textarea
          value={storyText}
          onChange={(e) => setOurStory(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary resize-y"
        />
      </div>

      <h2 className="font-semibold text-gray-900 text-sm mb-3">The Team</h2>

      {loading && !list.length ? (
        <div className="p-8 text-center text-gray-400">Loading team page...</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">
            Nobody on the Meet the Team page yet. Import everyone with a login, or add someone
            manually.
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void handleImportTeam()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              Import team
            </button>
            <button
              type="button"
              onClick={() => beginEdit()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
            >
              Add custom person
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((member, index) => (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-start"
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-bold shrink-0">
                  {member.name.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{member.name}</h3>
                  {member.roleTitle && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {member.roleTitle}
                    </span>
                  )}
                  {member.userId && member.authorId ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                      Staff + Author
                    </span>
                  ) : member.userId ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                      Staff
                    </span>
                  ) : member.authorId ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                      Author profile
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {member.bio || 'No bio set'}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === list.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => beginEdit(member)}
                  className="p-1.5 text-gray-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(member.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dirty && (
        <p className="text-xs text-amber-600 mt-4">
          You have unsaved team roster changes.
        </p>
      )}
      {storyDirty && (
        <p className="text-xs text-amber-600 mt-1">You have unsaved Our Story changes.</p>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {list.some((m) => m.id === editing.id) ? 'Edit team member' : 'Add team member'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role / title</label>
                <input
                  type="text"
                  value={editing.roleTitle}
                  onChange={(e) => setEditing({ ...editing, roleTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Founder, Motorsports Writer (not Admin/SEO login roles)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                <textarea
                  value={editing.bio}
                  onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="Short bio for the About page"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Avatar</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editing.avatar}
                    onChange={(e) => setEditing({ ...editing, avatar: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => setLibraryOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Library
                  </button>
                </div>
                {editing.avatar && (
                  <img
                    src={editing.avatar}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover mt-2"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">X / Twitter</label>
                  <input
                    type="text"
                    value={editing.twitter}
                    onChange={(e) => setEditing({ ...editing, twitter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                    placeholder="URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={editing.instagram}
                    onChange={(e) => setEditing({ ...editing, instagram: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                    placeholder="URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={editing.linkedin}
                    onChange={(e) => setEditing({ ...editing, linkedin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                    placeholder="URL"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMember}
                disabled={!editing.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Add to list
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPicker
        open={libraryOpen && Boolean(editing)}
        onClose={() => setLibraryOpen(false)}
        title="Choose avatar"
        imagesOnly
        onSelect={(asset) => {
          if (editing) setEditing({ ...editing, avatar: asset.url })
        }}
      />
    </div>
  )
}

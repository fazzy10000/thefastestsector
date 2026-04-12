import { useState } from 'react'
import { useAuthors } from '../../hooks/useAuthors'
import type { Author } from '../../lib/types'
import { PlusCircle, Edit, Trash2, X, Save } from 'lucide-react'

const EMPTY_AUTHOR: Author = {
  id: '',
  name: '',
  bio: '',
  avatar: '',
  twitter: '',
  instagram: '',
  linkedin: '',
}

export default function AuthorManager() {
  const { authors, saveAuthor, removeAuthor } = useAuthors()
  const [editing, setEditing] = useState<Author | null>(null)

  const handleNew = () => {
    setEditing({ ...EMPTY_AUTHOR, id: crypto.randomUUID() })
  }

  const handleEdit = (author: Author) => {
    setEditing({ ...author })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this author? Articles using them will keep the name but lose the author block.')) return
    await removeAuthor(id)
  }

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) return
    await saveAuthor({ ...editing, name: editing.name.trim(), bio: editing.bio.trim() })
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the writers who appear on articles</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New Author
        </button>
      </div>

      {/* Author cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {authors.map((author) => (
          <div key={author.id} className="bg-white rounded-xl border border-gray-200 p-5 flex gap-4">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-bold shrink-0">
                {author.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">{author.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{author.bio || 'No bio set'}</p>
              <div className="flex items-center gap-2 mt-2">
                {author.twitter && <span className="text-[10px] text-gray-400">X</span>}
                {author.instagram && <span className="text-[10px] text-gray-400">IG</span>}
                {author.linkedin && <span className="text-[10px] text-gray-400">LI</span>}
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => handleEdit(author)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(author.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {authors.length === 0 && (
        <div className="text-center text-gray-400 py-12">No authors yet. Create your first one.</div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editing.name ? 'Edit Author' : 'New Author'}
              </h2>
              <button onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                <textarea
                  value={editing.bio}
                  onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="Short bio for the author block at the end of articles"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Avatar URL</label>
                <input
                  type="text"
                  value={editing.avatar}
                  onChange={(e) => setEditing({ ...editing, avatar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="https://..."
                />
                {editing.avatar && (
                  <img src={editing.avatar} alt="" className="w-16 h-16 rounded-full object-cover mt-2" />
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editing.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Mail, PlusCircle, Pencil, Trash2, Users } from 'lucide-react'
import { useNewsletters } from '../../hooks/useNewsletters'
import { NEWSLETTER_EDITION_LABELS } from '../../lib/types'
import type { Newsletter } from '../../lib/types'

export default function NewsletterList() {
  const { newsletters, subscribers, loading, fetchNewsletters, fetchSubscribers, removeNewsletter } =
    useNewsletters()
  const [list, setList] = useState<Newsletter[]>([])

  useEffect(() => {
    setList(newsletters)
  }, [newsletters])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this newsletter? This does not unsubscribe anyone.')) return
    await removeNewsletter(id)
    setList(await fetchNewsletters())
    await fetchSubscribers()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletters</h1>
          <p className="text-gray-500 text-sm mt-1">
            Write Sector Sweep and send it to people who subscribed in the footer.
          </p>
        </div>
        <Link
          to="/admin/newsletter/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New newsletter
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{subscribers.length}</p>
            <p className="text-sm text-gray-500">Subscribers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">
              {list.filter((n) => n.status === 'sent').length}
            </p>
            <p className="text-sm text-gray-500">Sent editions</p>
          </div>
        </div>
      </div>

      {subscribers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-8 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Recent subscribers</h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {subscribers.slice(0, 12).map((s) => (
              <li key={s.id} className="px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-800 truncate">{s.email}</span>
                <span className="text-xs text-gray-400 capitalize shrink-0">
                  {s.edition === 'all' ? 'All' : s.edition}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No newsletters yet.</p>
          <Link
            to="/admin/newsletter/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
          >
            <PlusCircle className="w-4 h-4" />
            Write the first edition
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold hidden sm:table-cell">Audience</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Updated</th>
                <th className="px-5 py-3 font-semibold w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{item.subject || 'Untitled'}</td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                    {NEWSLETTER_EDITION_LABELS[item.edition] || item.edition}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        item.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.status === 'sent' && item.recipientCount > 0 && (
                      <span className="ml-2 text-xs text-gray-400">{item.recipientCount}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                    {item.updatedAt
                      ? formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/newsletter/edit/${item.id}`}
                        className="p-1.5 text-gray-500 hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

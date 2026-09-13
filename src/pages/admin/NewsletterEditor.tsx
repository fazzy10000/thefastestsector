import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft,
  Bold,
  FolderOpen,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  Loader2,
  Monitor,
  Save,
  Send,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNewsletters } from '../../hooks/useNewsletters'
import { useImageUpload } from '../../hooks/useImageUpload'
import { useMediaLibrary } from '../../hooks/useMediaLibrary'
import MediaPicker from '../../components/admin/MediaPicker'
import { getNewsletterSendStatus, sendNewsletterEmails } from '../../lib/sendNewsletter'
import { NEWSLETTER_TEMPLATES, wrapNewsletterHtml } from '../../lib/newsletterHtml'
import { NEWSLETTER_EDITION_LABELS } from '../../lib/types'
import type { Newsletter, NewsletterEdition } from '../../lib/types'

const EDITIONS = Object.keys(NEWSLETTER_EDITION_LABELS) as NewsletterEdition[]

export default function NewsletterEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { uid } = useAuth()
  const { uploadImage, uploading } = useImageUpload()
  const { createAsset } = useMediaLibrary({ autoFetch: false })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    getNewsletter,
    createNewsletter,
    updateNewsletter,
    fetchSubscribers,
    recipientsFor,
  } = useNewsletters()

  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [edition, setEdition] = useState<NewsletterEdition>('all')
  const [content, setContent] = useState('<p></p>')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [localDev, setLocalDev] = useState(false)
  const [sendConfigured, setSendConfigured] = useState<boolean | null>(null)
  const [sendFrom, setSendFrom] = useState('')
  const [recipientCount, setRecipientCount] = useState(0)
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop')
  const [liveSendTest, setLiveSendTest] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({ inline: false, allowBase64: true }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write this month’s Sector Sweep…' }),
    ],
    content: '<p></p>',
    editorProps: {
      attributes: { class: 'tiptap' },
    },
    onUpdate: ({ editor: ed }) => setContent(ed.getHTML()),
  })

  useEffect(() => {
    getNewsletterSendStatus().then((s) => {
      setLocalDev(Boolean(s.localDev))
      setSendConfigured(s.configured)
      setSendFrom(s.from || '')
    })
  }, [])

  useEffect(() => {
    fetchSubscribers().then((list) => setRecipientCount(recipientsFor(edition, list).length))
  }, [edition, fetchSubscribers, recipientsFor])

  useEffect(() => {
    if (!id) {
      setLoadingDoc(false)
      return
    }
    getNewsletter(id).then((doc) => {
      if (doc) {
        setSubject(doc.subject)
        setPreviewText(doc.previewText || '')
        setEdition(doc.edition || 'all')
        setContent(doc.content || '<p></p>')
        editor?.commands.setContent(doc.content || '<p></p>')
      }
      setLoadingDoc(false)
    })
  }, [id, getNewsletter, editor])

  const persist = async (status: Newsletter['status'], extra: Partial<Newsletter> = {}) => {
    const payload: Omit<Newsletter, 'id'> = {
      subject: subject.trim() || 'Untitled newsletter',
      previewText: previewText.trim(),
      content: editor?.getHTML() || content,
      edition,
      status,
      recipientCount: extra.recipientCount ?? 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sentAt: extra.sentAt ?? null,
      createdBy: uid || '',
      ...extra,
    }
    if (id) {
      const { createdAt, createdBy, ...update } = payload
      void createdAt
      void createdBy
      await updateNewsletter(id, update)
      return id
    }
    const newId = await createNewsletter(payload)
    navigate(`/admin/newsletter/edit/${newId}`, { replace: true })
    return newId
  }

  const handleSave = async () => {
    setError('')
    setNotice('')
    setSaving(true)
    try {
      await persist('draft')
      setNotice('Draft saved.')
    } catch {
      setError('Could not save draft.')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    setError('')
    setNotice('')
    if (!subject.trim()) {
      setError('Add a subject line before sending.')
      return
    }
    const html = editor?.getHTML() || content
    if (!html || html === '<p></p>') {
      setError('Write some content before sending.')
      return
    }

    const list = recipientsFor(edition, await fetchSubscribers())
    const testAddress = testEmail.trim().toLowerCase()
    const emails = liveSendTest && testAddress ? [testAddress] : list.map((s) => s.email)

    if (liveSendTest && !testAddress) {
      setError('Enter a test email address for live send.')
      return
    }
    if (emails.length === 0) {
      setError('No subscribers yet. The footer form is where people sign up.')
      return
    }

    const confirmed = confirm(
      liveSendTest
        ? `LIVE TEST: send a real email to ${emails.join(', ')}?`
        : `Send “${subject.trim()}” to ${emails.length} subscriber${emails.length === 1 ? '' : 's'}?`,
    )
    if (!confirmed) return

    setSending(true)
    try {
      const result = await sendNewsletterEmails({
        subject: subject.trim(),
        html,
        previewText: previewText.trim(),
        emails,
        live: liveSendTest,
      })
      if (liveSendTest) {
        setNotice(`Live test sent to ${emails.join(', ')}. The newsletter was not marked as sent to the full list.`)
        return
      }
      await persist('sent', {
        recipientCount: result.sent,
        sentAt: Date.now(),
      })
      setNotice(`Sent to ${result.sent} subscriber${result.sent === 1 ? '' : 's'}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  const addLink = () => {
    const url = window.prompt('Link URL')
    if (!url) return
    editor?.chain().focus().setLink({ href: url }).run()
  }

  const insertImageFromFile = useCallback(
    async (file: File) => {
      setError('')
      try {
        const url = await uploadImage(file)
        const name = file.name.replace(/\.[^.]+$/, '')
        void createAsset({ url, name, alt: name, tags: ['newsletter'], createdBy: uid || '' })
        editor?.chain().focus().setImage({ src: url, alt: name }).run()
      } catch {
        setError('Could not add that image. Try another file or paste an image URL.')
      }
    },
    [editor, uploadImage, createAsset, uid],
  )

  const addImageUrl = () => {
    const url = window.prompt('Image URL')
    if (!url) return
    editor?.chain().focus().setImage({ src: url }).run()
  }

  const applyTemplate = (templateId: string) => {
    const template = NEWSLETTER_TEMPLATES.find((t) => t.id === templateId)
    if (!template || !editor) return
    const hasContent = (editor.getText() || '').trim().length > 0
    if (hasContent && !confirm('Replace the current draft with this template?')) return
    editor.commands.setContent(template.html)
    setContent(template.html)
    if (template.subject) setSubject(template.subject)
    if (template.previewText) setPreviewText(template.previewText)
  }

  const previewHtml = wrapNewsletterHtml(editor?.getHTML() || content, previewText)

  if (loadingDoc) {
    return <p className="text-gray-500 text-sm">Loading…</p>
  }

  return (
    <div>
      <Link
        to="/admin/newsletter"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All newsletters
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit newsletter' : 'New newsletter'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {recipientCount} subscriber{recipientCount === 1 ? '' : 's'} in this audience
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || sending}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={saving || sending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send now
          </button>
        </div>
      </div>

      {sendConfigured === false && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {localDev
            ? 'Add RESEND_API_KEY to `.dev.vars` and restart `npm run dev`. Stay on port 5173; no Worker needed locally.'
            : 'Resend is not configured on this Worker. Run `npx wrangler secret put RESEND_API_KEY`, then send again.'}
        </div>
      )}
      {sendConfigured && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          <p>
            Resend is connected{sendFrom ? <> · sending as <span className="font-medium">{sendFrom}</span></> : null}.
          </p>
          {/@resend\.dev\b/i.test(sendFrom) && (
            <p className="mt-1 text-amber-800">
              Test sender only: Live send test must go to the email on your Resend account
              (resend.com/settings), or to <span className="font-mono">delivered@resend.dev</span>.
              You cannot mail subscribers until thefastestsector.com is verified in Resend.
            </p>
          )}
          {localDev && (
            <p className="mt-1 text-gray-500">Stay on port 5173 — you do not need 8787 for a live test.</p>
          )}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-4 text-sm text-green-700">{notice}</p>}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Templates</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {NEWSLETTER_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-red-50/40 transition-colors"
                >
                  <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Sector Sweep — August 2026"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preview text</label>
              <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Inbox snippet after the subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
              <select
                value={edition}
                onChange={(e) => setEdition(e.target.value as NewsletterEdition)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {EDITIONS.map((ed) => (
                  <option key={ed} value={ed}>
                    {NEWSLETTER_EDITION_LABELS[ed]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={liveSendTest}
                onChange={(e) => setLiveSendTest(e.target.checked)}
                className="w-4 h-4 accent-[#c8102e]"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-900">Live send test</span>
                <span className="block text-xs text-gray-500">
                  Deliver a real email to the address below. The full subscriber list is not mailed.
                  With beth.t@example.com, this must be your Resend-account email or delivered@resend.dev.
                </span>
              </span>
            </label>
            {liveSendTest && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Test email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your-resend-login@email.com or delivered@resend.dev"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Body</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="p-1.5 rounded hover:bg-gray-200" aria-label="Heading">
                  <Heading2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className="p-1.5 rounded hover:bg-gray-200" aria-label="Bold">
                  <Bold className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className="p-1.5 rounded hover:bg-gray-200" aria-label="Italic">
                  <Italic className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="p-1.5 rounded hover:bg-gray-200" aria-label="List">
                  <List className="w-4 h-4" />
                </button>
                <button type="button" onClick={addLink} className="p-1.5 rounded hover:bg-gray-200" aria-label="Link">
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
                  aria-label="Upload image"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="p-1.5 rounded hover:bg-gray-200"
                  aria-label="Choose from library"
                  title="Choose from library"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button type="button" onClick={addImageUrl} className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded">
                  Image URL
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void insertImageFromFile(file)
                    e.target.value = ''
                  }}
                />
              </div>
              <EditorContent editor={editor} className="prose max-w-none min-h-[280px]" />
            </div>
          </div>
        </div>

        <aside className="xl:sticky xl:top-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Email preview</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPreviewWidth('desktop')}
                className={`p-1.5 rounded ${previewWidth === 'desktop' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                aria-label="Desktop preview"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewWidth('mobile')}
                className={`p-1.5 rounded ${previewWidth === 'mobile' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                aria-label="Mobile preview"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-[#e8e8e8] p-3">
            <div className="bg-white rounded-lg shadow-sm mb-3 px-3 py-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Inbox</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {subject.trim() || 'Subject line'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {previewText.trim() || 'Preview text appears here'}
              </p>
            </div>
            <div className="flex justify-center overflow-hidden">
              <iframe
                title="Newsletter email preview"
                srcDoc={previewHtml}
                className="bg-white border-0 rounded-md shadow-sm"
                style={{
                  width: previewWidth === 'mobile' ? 360 : 600,
                  maxWidth: '100%',
                  height: 640,
                }}
              />
            </div>
          </div>
        </aside>
      </div>

      <MediaPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Insert image"
        imagesOnly
        onSelect={(asset) => {
          editor?.chain().focus().setImage({ src: asset.url, alt: asset.alt || asset.name }).run()
        }}
      />
    </div>
  )
}

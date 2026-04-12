import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useArticles } from '../../hooks/useArticles'
import { useAuthors } from '../../hooks/useAuthors'
import { useAuth } from '../../hooks/useAuth'
import { useImageUpload } from '../../hooks/useImageUpload'
import { useVersions } from '../../hooks/useVersions'
import { CATEGORY_LABELS, CONTENT_TYPE_LABELS } from '../../lib/types'
import type { Article, Category, ContentType } from '../../lib/types'
import SEOPanel from '../../components/admin/SEOPanel'
import ImageTools from '../../components/admin/ImageTools'
import {
  Save,
  Eye,
  Image,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo,
  Redo,
  Upload,
  ArrowLeft,
  SlidersHorizontal,
  History,
  CalendarClock,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getArticle, createArticle, updateArticle } = useArticles()
  const { authors } = useAuthors()
  const { user } = useAuth()
  const { uploadImage, uploading } = useImageUpload()
  const { versions, fetchVersions, saveVersion } = useVersions(id)
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState<Category>('formula-1')
  const [contentType, setContentType] = useState<ContentType>('news')
  const [tags, setTags] = useState('')
  const [author, setAuthor] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [featured, setFeatured] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loadingArticle, setLoadingArticle] = useState(!!id)
  const [focusKeyphrase, setFocusKeyphrase] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [showImageTools, setShowImageTools] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your article...' }),
    ],
    content: '',
  })

  useEffect(() => {
    if (id) {
      getArticle(id).then((article) => {
        if (article) {
          setTitle(article.title)
          setSlug(article.slug)
          setExcerpt(article.excerpt)
          setCategory(article.category)
          setContentType(article.contentType || 'news')
          setTags(article.tags.join(', '))
          setAuthor(article.author)
          setAuthorId(article.authorId || '')
          setFeaturedImage(article.featuredImage)
          setStatus(article.status)
          setFeatured(article.featured)
          if (article.scheduledAt) {
            setScheduledAt(new Date(article.scheduledAt).toISOString().slice(0, 16))
          }
          editor?.commands.setContent(article.content)
        }
        setLoadingArticle(false)
      })
      fetchVersions()
    }
  }, [id, getArticle, editor, fetchVersions])

  useEffect(() => {
    if (!isEditing && title) {
      setSlug(slugify(title))
    }
  }, [title, isEditing])

  const handleImageUpload = useCallback(async (file: File, target: 'featured' | 'content') => {
    const url = await uploadImage(file)
    if (target === 'featured') {
      setFeaturedImage(url)
    } else if (editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [uploadImage, editor])

  const handleSave = async (saveStatus?: 'draft' | 'published' | 'scheduled') => {
    if (!title.trim() || !editor) return
    setSaving(true)

    const finalStatus = saveStatus || status
    const now = Date.now()

    if (isEditing && id) {
      const editedBy = user?.email || user?.displayName || 'demo'
      await saveVersion({
        content: editor.getHTML(),
        title: title.trim(),
        excerpt: excerpt.trim(),
        editedBy,
        editedAt: now,
      })
    }

    const scheduledTimestamp = finalStatus === 'scheduled' && scheduledAt
      ? new Date(scheduledAt).getTime()
      : null

    const data: Omit<Article, 'id'> = {
      title: title.trim(),
      slug: slug || slugify(title),
      excerpt: excerpt.trim(),
      content: editor.getHTML(),
      featuredImage,
      category,
      contentType,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      author: author.trim(),
      authorId,
      status: finalStatus,
      featured,
      scheduledAt: scheduledTimestamp,
      createdAt: now,
      updatedAt: now,
      publishedAt: finalStatus === 'published' ? now : null,
    }

    try {
      if (isEditing && id) {
        const { createdAt: _, ...updateData } = data
        await updateArticle(id, updateData as Partial<Article>)
      } else {
        await createArticle(data)
      }
      navigate('/admin')
    } catch (err) {
      console.error('Error saving article:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = (version: { content: string; title: string; excerpt: string }) => {
    setTitle(version.title)
    setExcerpt(version.excerpt)
    editor?.commands.setContent(version.content)
    setShowHistory(false)
  }

  const handlePreview = () => {
    if (slug) {
      window.open(`${window.location.origin}/thefastestsector/article/${slug || slugify(title)}?preview=true`, '_blank')
    }
  }

  if (loadingArticle) {
    return <div className="text-gray-400 text-center py-16">Loading article...</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Article' : 'New Article'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing && (
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchVersions() }}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showHistory ? 'border-primary text-primary bg-primary/5' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span> Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div className={`${showHistory ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-5`}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full text-2xl sm:text-3xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none bg-transparent"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Slug:</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 px-2 py-1 text-gray-600 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a short excerpt..."
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-primary resize-none text-sm"
          />

          {/* Editor toolbar */}
          {editor && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50">
                <ToolbarBtn
                  icon={<Bold className="w-4 h-4" />}
                  active={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarBtn
                  icon={<Italic className="w-4 h-4" />}
                  active={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarBtn
                  icon={<Heading1 className="w-4 h-4" />}
                  active={editor.isActive('heading', { level: 1 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                />
                <ToolbarBtn
                  icon={<Heading2 className="w-4 h-4" />}
                  active={editor.isActive('heading', { level: 2 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarBtn
                  icon={<List className="w-4 h-4" />}
                  active={editor.isActive('bulletList')}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                />
                <ToolbarBtn
                  icon={<ListOrdered className="w-4 h-4" />}
                  active={editor.isActive('orderedList')}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                />
                <ToolbarBtn
                  icon={<Quote className="w-4 h-4" />}
                  active={editor.isActive('blockquote')}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarBtn
                  icon={<Link2 className="w-4 h-4" />}
                  active={editor.isActive('link')}
                  onClick={() => {
                    const url = prompt('Enter URL:')
                    if (url) editor.chain().focus().setLink({ href: url }).run()
                  }}
                />
                <label className="cursor-pointer">
                  <ToolbarBtn
                    icon={<Image className="w-4 h-4" />}
                    active={false}
                    onClick={() => {}}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleImageUpload(f, 'content')
                    }}
                  />
                </label>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarBtn
                  icon={<Undo className="w-4 h-4" />}
                  active={false}
                  onClick={() => editor.chain().focus().undo().run()}
                />
                <ToolbarBtn
                  icon={<Redo className="w-4 h-4" />}
                  active={false}
                  onClick={() => editor.chain().focus().redo().run()}
                />
                {uploading && <span className="ml-2 text-xs text-gray-400">Uploading image...</span>}
              </div>
              <EditorContent editor={editor} className="prose max-w-none" />
            </div>
          )}

          {/* SEO Panel */}
          <SEOPanel
            title={title}
            slug={slug}
            excerpt={excerpt}
            content={editor?.getHTML() || ''}
            featuredImage={featuredImage}
            focusKeyphrase={focusKeyphrase}
            onFocusKeyphraseChange={setFocusKeyphrase}
            metaTitle={metaTitle}
            onMetaTitleChange={setMetaTitle}
            metaDescription={metaDescription}
            onMetaDescriptionChange={setMetaDescription}
          />
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Version History
              </h3>
              {versions.length === 0 ? (
                <p className="text-xs text-gray-400">No versions saved yet. Versions are created each time you save.</p>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {versions.map((v, i) => (
                    <div
                      key={v.editedAt}
                      className="p-3 border border-gray-100 rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[60%]">
                          {v.title}
                        </span>
                        {i > 0 && (
                          <button
                            onClick={() => handleRestore(v)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {v.editedBy} &middot;{' '}
                        {v.editedAt && !isNaN(v.editedAt)
                          ? formatDistanceToNow(new Date(v.editedAt), { addSuffix: true })
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Featured Image</h3>
            {featuredImage ? (
              <div className="relative group">
                <img src={featuredImage} alt="" className="w-full h-40 object-cover rounded-lg" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowImageTools(true)}
                    className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    title="Edit image"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFeaturedImage('')}
                    className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-xs text-gray-400">Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImageUpload(f, 'featured')
                  }}
                />
              </label>
            )}
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Or paste image URL"
              className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Category</h3>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Content Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Content Type</h3>
            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
              {(Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setContentType(val)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    contentType === val
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Schedule
            </h3>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
            {scheduledAt && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleSave('scheduled')}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  Schedule
                </button>
                <button
                  onClick={() => setScheduledAt('')}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Author */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Author</h3>
            <select
              value={authorId}
              onChange={(e) => {
                const sel = authors.find((a) => a.id === e.target.value)
                setAuthorId(e.target.value)
                if (sel) setAuthor(sel.name)
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            >
              <option value="">Select an author...</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {!authorId && (
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Or type a name"
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 focus:outline-none focus:border-primary"
              />
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Tags</h3>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Options</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Featured article</span>
            </label>
          </div>
        </div>
      </div>

      {/* Image Tools Modal */}
      {showImageTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Featured Image</h2>
              <button
                onClick={() => setShowImageTools(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <ImageTools
              initialSrc={featuredImage}
              onApply={(dataUrl) => {
                setFeaturedImage(dataUrl)
                setShowImageTools(false)
              }}
              compact
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({
  icon,
  active,
  onClick,
}: {
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {icon}
    </button>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useArticles } from '../../hooks/useArticles'
import { useImageUpload } from '../../hooks/useImageUpload'
import { CATEGORY_LABELS } from '../../lib/types'
import type { Article, Category } from '../../lib/types'
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
} from 'lucide-react'

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
  const { uploadImage, uploading } = useImageUpload()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState<Category>('formula-1')
  const [tags, setTags] = useState('')
  const [author, setAuthor] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingArticle, setLoadingArticle] = useState(!!id)

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
          setTags(article.tags.join(', '))
          setAuthor(article.author)
          setFeaturedImage(article.featuredImage)
          setStatus(article.status)
          setFeatured(article.featured)
          editor?.commands.setContent(article.content)
        }
        setLoadingArticle(false)
      })
    }
  }, [id, getArticle, editor])

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

  const handleSave = async (saveStatus?: 'draft' | 'published') => {
    if (!title.trim() || !editor) return
    setSaving(true)

    const finalStatus = saveStatus || status
    const data: Omit<Article, 'id'> = {
      title: title.trim(),
      slug: slug || slugify(title),
      excerpt: excerpt.trim(),
      content: editor.getHTML(),
      featuredImage,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      author: author.trim(),
      status: finalStatus,
      featured,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: finalStatus === 'published' ? Date.now() : null,
    }

    try {
      if (isEditing && id) {
        await updateArticle(id, { ...data, createdAt: undefined } as Partial<Article>)
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

  if (loadingArticle) {
    return <div className="text-gray-400 text-center py-16">Loading article...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Article' : 'New Article'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none bg-transparent"
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
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Featured Image</h3>
            {featuredImage ? (
              <div className="relative group">
                <img src={featuredImage} alt="" className="w-full h-40 object-cover rounded-lg" />
                <button
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
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

          {/* Author */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Author</h3>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
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

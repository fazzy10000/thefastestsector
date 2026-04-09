import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, Search, Share2 } from 'lucide-react'

interface SEOPanelProps {
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  focusKeyphrase: string
  onFocusKeyphraseChange: (v: string) => void
  metaTitle: string
  onMetaTitleChange: (v: string) => void
  metaDescription: string
  onMetaDescriptionChange: (v: string) => void
}

type CheckStatus = 'good' | 'warning' | 'bad'

interface SEOCheck {
  label: string
  status: CheckStatus
  message: string
}

function stripHtml(html: string) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function computeChecks(props: SEOPanelProps): SEOCheck[] {
  const {
    title, slug, excerpt, content, featuredImage,
    focusKeyphrase, metaTitle, metaDescription,
  } = props

  const plainContent = stripHtml(content)
  const wordCount = countWords(plainContent)
  const effectiveTitle = metaTitle || title
  const effectiveDesc = metaDescription || excerpt
  const kw = focusKeyphrase.toLowerCase().trim()

  const checks: SEOCheck[] = []

  // Title length
  if (!effectiveTitle) {
    checks.push({ label: 'SEO Title', status: 'bad', message: 'No title set.' })
  } else if (effectiveTitle.length < 30) {
    checks.push({ label: 'SEO Title', status: 'warning', message: `Too short (${effectiveTitle.length}/60). Aim for 50–60 characters.` })
  } else if (effectiveTitle.length > 60) {
    checks.push({ label: 'SEO Title', status: 'warning', message: `Too long (${effectiveTitle.length}/60). May be truncated in search results.` })
  } else {
    checks.push({ label: 'SEO Title', status: 'good', message: `Good length (${effectiveTitle.length}/60).` })
  }

  // Meta description
  if (!effectiveDesc) {
    checks.push({ label: 'Meta Description', status: 'bad', message: 'No meta description set. Add an excerpt.' })
  } else if (effectiveDesc.length < 120) {
    checks.push({ label: 'Meta Description', status: 'warning', message: `Too short (${effectiveDesc.length}/160). Aim for 120–160 characters.` })
  } else if (effectiveDesc.length > 160) {
    checks.push({ label: 'Meta Description', status: 'warning', message: `Too long (${effectiveDesc.length}/160). May be truncated.` })
  } else {
    checks.push({ label: 'Meta Description', status: 'good', message: `Good length (${effectiveDesc.length}/160).` })
  }

  // Focus keyphrase
  if (!kw) {
    checks.push({ label: 'Focus Keyphrase', status: 'warning', message: 'No focus keyphrase set. Add one for better analysis.' })
  } else {
    if (effectiveTitle.toLowerCase().includes(kw)) {
      checks.push({ label: 'Keyphrase in Title', status: 'good', message: 'Focus keyphrase found in the SEO title.' })
    } else {
      checks.push({ label: 'Keyphrase in Title', status: 'bad', message: 'Focus keyphrase not found in the SEO title.' })
    }

    if (slug.toLowerCase().includes(kw.replace(/\s+/g, '-'))) {
      checks.push({ label: 'Keyphrase in Slug', status: 'good', message: 'Focus keyphrase found in the URL slug.' })
    } else {
      checks.push({ label: 'Keyphrase in Slug', status: 'warning', message: 'Focus keyphrase not found in the URL slug.' })
    }

    if (effectiveDesc.toLowerCase().includes(kw)) {
      checks.push({ label: 'Keyphrase in Description', status: 'good', message: 'Focus keyphrase found in the meta description.' })
    } else {
      checks.push({ label: 'Keyphrase in Description', status: 'bad', message: 'Focus keyphrase not found in the meta description.' })
    }

    if (plainContent.toLowerCase().includes(kw)) {
      const count = plainContent.toLowerCase().split(kw).length - 1
      const density = ((count * kw.split(/\s+/).length) / Math.max(wordCount, 1)) * 100
      if (density < 0.5) {
        checks.push({ label: 'Keyphrase Density', status: 'warning', message: `Low density (${density.toFixed(1)}%). Aim for 1–3%.` })
      } else if (density > 3) {
        checks.push({ label: 'Keyphrase Density', status: 'warning', message: `Too high (${density.toFixed(1)}%). Aim for 1–3%.` })
      } else {
        checks.push({ label: 'Keyphrase Density', status: 'good', message: `Good density (${density.toFixed(1)}%).` })
      }
    } else {
      checks.push({ label: 'Keyphrase in Content', status: 'bad', message: 'Focus keyphrase not found in the article body.' })
    }

    const firstParagraph = plainContent.substring(0, 200).toLowerCase()
    if (firstParagraph.includes(kw)) {
      checks.push({ label: 'Keyphrase in Introduction', status: 'good', message: 'Focus keyphrase appears in the first paragraph.' })
    } else {
      checks.push({ label: 'Keyphrase in Introduction', status: 'warning', message: 'Focus keyphrase not found in the first paragraph.' })
    }
  }

  // Content length
  if (wordCount === 0) {
    checks.push({ label: 'Content Length', status: 'bad', message: 'No content written yet.' })
  } else if (wordCount < 300) {
    checks.push({ label: 'Content Length', status: 'warning', message: `Only ${wordCount} words. Aim for 300+ for better SEO.` })
  } else if (wordCount >= 300 && wordCount < 600) {
    checks.push({ label: 'Content Length', status: 'good', message: `${wordCount} words. Good length.` })
  } else {
    checks.push({ label: 'Content Length', status: 'good', message: `${wordCount} words. Great, comprehensive content.` })
  }

  // Featured image
  if (featuredImage) {
    checks.push({ label: 'Featured Image', status: 'good', message: 'Featured image is set.' })
  } else {
    checks.push({ label: 'Featured Image', status: 'bad', message: 'No featured image. Articles with images rank better.' })
  }

  // Internal/external links
  const linkCount = (content.match(/<a\s/gi) || []).length
  if (linkCount > 0) {
    checks.push({ label: 'Links', status: 'good', message: `${linkCount} link(s) found in content.` })
  } else {
    checks.push({ label: 'Links', status: 'warning', message: 'No links found. Consider adding internal or external links.' })
  }

  // Headings
  const headingCount = (content.match(/<h[2-6]/gi) || []).length
  if (headingCount > 0) {
    checks.push({ label: 'Subheadings', status: 'good', message: `${headingCount} subheading(s) found. Good structure.` })
  } else if (wordCount > 300) {
    checks.push({ label: 'Subheadings', status: 'warning', message: 'No subheadings found. Add H2/H3 to improve readability.' })
  }

  return checks
}

function getOverallScore(checks: SEOCheck[]): { score: number; label: string; color: string } {
  if (checks.length === 0) return { score: 0, label: 'N/A', color: 'text-gray-400' }
  const good = checks.filter((c) => c.status === 'good').length
  const total = checks.length
  const pct = Math.round((good / total) * 100)

  if (pct >= 80) return { score: pct, label: 'Good', color: 'text-green-500' }
  if (pct >= 50) return { score: pct, label: 'OK', color: 'text-yellow-500' }
  return { score: pct, label: 'Needs Work', color: 'text-red-500' }
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width="72" height="72" className="transform -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none" strokeWidth="6"
        stroke="currentColor" className={color}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x="36" y="36"
        textAnchor="middle" dominantBaseline="central"
        className={`${color} text-lg font-bold`}
        style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}
        fill="currentColor"
      >
        {score}
      </text>
    </svg>
  )
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'good') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
  if (status === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
  return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
}

function CharBar({ current, max, label }: { current: number; max: number; label: string }) {
  const pct = Math.min((current / max) * 100, 100)
  const over = current > max
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
        <span>{label}</span>
        <span className={over ? 'text-red-400' : ''}>{current}/{max}</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : pct > 70 ? 'bg-green-400' : 'bg-yellow-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function SEOPanel(props: SEOPanelProps) {
  const {
    title, slug, excerpt, focusKeyphrase, onFocusKeyphraseChange,
    metaTitle, onMetaTitleChange, metaDescription, onMetaDescriptionChange,
  } = props

  const [tab, setTab] = useState<'seo' | 'social'>('seo')
  const [detailsOpen, setDetailsOpen] = useState(true)

  const checks = useMemo(() => computeChecks(props), [
    props.title, props.slug, props.excerpt, props.content,
    props.featuredImage, props.focusKeyphrase, props.metaTitle, props.metaDescription,
  ])
  const overall = useMemo(() => getOverallScore(checks), [checks])

  const effectiveTitle = metaTitle || title || 'Page Title'
  const effectiveDesc = metaDescription || excerpt || 'Add a meta description for this article...'
  const displayUrl = `thefastestsector.com › article › ${slug || 'your-slug'}`

  const goodCount = checks.filter((c) => c.status === 'good').length
  const warnCount = checks.filter((c) => c.status === 'warning').length
  const badCount = checks.filter((c) => c.status === 'bad').length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setTab('seo')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
            tab === 'seo' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          SEO
        </button>
        <button
          onClick={() => setTab('social')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
            tab === 'social' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Social
        </button>
      </div>

      {tab === 'seo' && (
        <div className="p-5 space-y-5">
          {/* Score overview */}
          <div className="flex items-center gap-4">
            <ScoreRing score={overall.score} color={overall.color} />
            <div>
              <p className={`text-lg font-bold ${overall.color}`}>{overall.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="text-green-500 font-medium">{goodCount}</span> good
                {' · '}
                <span className="text-yellow-500 font-medium">{warnCount}</span> improvements
                {' · '}
                <span className="text-red-500 font-medium">{badCount}</span> issues
              </p>
            </div>
          </div>

          {/* Focus keyphrase */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Focus Keyphrase</label>
            <input
              type="text"
              value={focusKeyphrase}
              onChange={(e) => onFocusKeyphraseChange(e.target.value)}
              placeholder="e.g. Verstappen 2027"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Google preview */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Google Preview</label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-green-700 truncate">{displayUrl}</p>
              <p className="text-base text-blue-700 font-medium leading-snug mt-0.5 line-clamp-1">{effectiveTitle}</p>
              <p className="text-xs text-gray-600 leading-relaxed mt-1 line-clamp-2">{effectiveDesc}</p>
            </div>
          </div>

          {/* Meta title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">SEO Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => onMetaTitleChange(e.target.value)}
              placeholder={title || 'Custom SEO title (optional)'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
            <CharBar current={(metaTitle || title).length} max={60} label="characters" />
          </div>

          {/* Meta description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              placeholder={excerpt || 'Custom meta description (optional)'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary resize-none"
            />
            <CharBar current={(metaDescription || excerpt).length} max={160} label="characters" />
          </div>

          {/* Detailed checks */}
          <div>
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-700"
            >
              SEO Analysis ({checks.length} checks)
              {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {detailsOpen && (
              <ul className="mt-3 space-y-2">
                {checks.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <StatusIcon status={c.status} />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{c.label}</p>
                      <p className="text-[11px] text-gray-400 leading-snug">{c.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div className="p-5 space-y-5">
          <label className="block text-xs font-semibold text-gray-700 mb-2">Social Media Preview</label>

          {/* Facebook / Open Graph */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Facebook / LinkedIn</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {props.featuredImage ? (
                <img src={props.featuredImage} alt="" className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  No image set
                </div>
              )}
              <div className="p-3">
                <p className="text-[10px] text-gray-400 uppercase">thefastestsector.com</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2">{metaTitle || title || 'Article Title'}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{metaDescription || excerpt || 'Article description...'}</p>
              </div>
            </div>
          </div>

          {/* Twitter card */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">X / Twitter</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              {props.featuredImage ? (
                <img src={props.featuredImage} alt="" className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  No image set
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{metaTitle || title || 'Article Title'}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{metaDescription || excerpt || 'Article description...'}</p>
                <p className="text-[10px] text-gray-400 mt-1">thefastestsector.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

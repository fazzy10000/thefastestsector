import { useState, useCallback } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../../lib/firebase'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ImportPage() {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 })
  const [finished, setFinished] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-200), msg])
  }, [])

  const handleImport = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
      addLog('Firebase is not configured. Cannot import.')
      return
    }

    setImporting(true)
    setFinished(false)
    setLog([])

    try {
      addLog('Loading import data...')
      const mod = await import('../../data/wp-import.json')
      const data = mod.default || mod

      const articles = data.articles || []
      const authors = data.authors || []
      setProgress({ done: 0, total: articles.length + authors.length, errors: 0 })

      addLog(`Importing ${authors.length} authors...`)
      let errors = 0
      for (const author of authors) {
        try {
          await setDoc(doc(db!, 'authors', author.id), author)
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        } catch (e) {
          errors++
          addLog(`  Error: author "${author.name}": ${e}`)
          setProgress((p) => ({ ...p, done: p.done + 1, errors: p.errors + 1 }))
        }
      }
      addLog(`Authors done.`)

      addLog(`Importing ${articles.length} articles...`)
      const BATCH = 5
      for (let i = 0; i < articles.length; i += BATCH) {
        const batch = articles.slice(i, i + BATCH)
        const results = await Promise.allSettled(
          batch.map((article: Record<string, unknown>) =>
            setDoc(doc(db!, 'articles', article.id as string), article),
          ),
        )
        for (const r of results) {
          if (r.status === 'rejected') {
            errors++
            addLog(`  Error: ${r.reason}`)
          }
        }
        setProgress((p) => ({
          ...p,
          done: p.done + batch.length,
          errors,
        }))
        if ((i + BATCH) % 50 === 0) {
          addLog(`  ... ${Math.min(i + BATCH, articles.length)}/${articles.length}`)
        }
      }

      addLog(`\nImport complete! ${articles.length + authors.length - errors} succeeded, ${errors} errors.`)
      setFinished(true)
    } catch (e) {
      addLog(`Fatal error: ${e}`)
    } finally {
      setImporting(false)
    }
  }, [addLog])

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Articles</h1>
      <p className="text-sm text-gray-500 mb-6">
        Import all {485} articles from the original WordPress site into Firebase.
        This uses your authenticated session to write directly to Firestore.
      </p>

      {!isFirebaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Firebase is not configured. Import requires a Firebase connection.
          </p>
        </div>
      )}

      {!importing && !finished && (
        <button
          onClick={handleImport}
          disabled={!isFirebaseConfigured}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Start Import (485 articles + 15 authors)
        </button>
      )}

      {importing && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm font-medium text-gray-700">
              Importing... {progress.done}/{progress.total} ({pct}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {finished && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-green-800 font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Import complete! {progress.done - progress.errors} items uploaded
            {progress.errors > 0 && ` (${progress.errors} errors)`}.
          </p>
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-4 bg-gray-900 rounded-lg p-4 max-h-80 overflow-y-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
            {log.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}

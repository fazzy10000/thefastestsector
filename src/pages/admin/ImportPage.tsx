import { useState } from 'react'
import { Terminal, CheckCircle } from 'lucide-react'

export default function ImportPage() {
  const [copied, setCopied] = useState(false)

  const command = 'npm run seed:d1'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Articles</h1>
      <p className="text-sm text-gray-500 mb-6">
        Content lives in Cloudflare D1. Seed authors and WordPress articles from{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">src/data/wp-import.json</code> using the CLI.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-xl space-y-4">
        <p className="text-sm text-gray-700">
          Run this from the project root (uses Wrangler + your D1 database). It also creates a bootstrap
          admin if <code className="text-xs bg-gray-100 px-1 rounded">SEED_ADMIN_EMAIL</code> and{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">SEED_ADMIN_PASSWORD</code> are set.
        </p>
        <div className="flex items-center gap-2">
          <pre className="flex-1 text-sm bg-gray-900 text-gray-100 rounded-lg px-4 py-3 overflow-x-auto">
            {command}
          </pre>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(command)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-gray-500 flex items-start gap-2">
          <Terminal className="w-4 h-4 mt-0.5 shrink-0" />
          Add <code className="bg-gray-100 px-1 rounded">--remote</code> via{' '}
          <code className="bg-gray-100 px-1 rounded">npm run seed:d1 -- --remote</code> to seed production D1.
        </p>
      </div>
    </div>
  )
}

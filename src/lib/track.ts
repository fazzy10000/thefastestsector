const VISITOR_KEY = 'tfs_visitor_id'

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

let lastTrackedPath = ''

export function trackPageview(path: string) {
  if (path.startsWith('/admin')) return
  if (path === lastTrackedPath) return
  lastTrackedPath = path
  const payload = JSON.stringify({
    path,
    referrer: document.referrer || '',
    visitorId: getVisitorId(),
  })
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // tracking must never break the page
  }
}

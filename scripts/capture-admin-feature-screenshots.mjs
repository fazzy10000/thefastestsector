import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const base = process.env.BASE_URL || 'http://localhost:5173'
const email = process.env.SHOT_EMAIL || 'screenshot-admin@tfs.local'
const password = process.env.SHOT_PASSWORD || 'ScreenshotAdmin1!'
const outDir = join(process.cwd(), 'tmp-screenshots')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 })
await page.fill('input[type="email"], input[name="email"]', email)
await page.fill('input[type="password"], input[name="password"]', password)
await Promise.all([
  page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }).catch(() => null),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(1000)

const shots = [
  { name: '10-admin-traffic', path: '/admin/stats', wait: 1500 },
  { name: '11-admin-insights', path: '/admin/stats?tab=insights', wait: 1200 },
  { name: '12-admin-subscribers', path: '/admin/stats?tab=subscribers', wait: 1200 },
  { name: '13-admin-ads', path: '/admin/ads', wait: 1500 },
  { name: '14-home-with-ad', path: '/', wait: 1500 },
]

for (const shot of shots) {
  await page.goto(base + shot.path, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(shot.wait)
  const file = join(outDir, `${shot.name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('saved', file)
}

// Article page with sidebar ad — open first news article link if present
await page.goto(`${base}/category/news`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(800)
const articleHref = await page.locator('a[href^="/article/"]').first().getAttribute('href')
if (articleHref) {
  await page.goto(base + articleHref, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(outDir, '15-article-sidebar-ad.png'), fullPage: false })
  console.log('saved article sidebar')
}

await browser.close()
console.log('done')

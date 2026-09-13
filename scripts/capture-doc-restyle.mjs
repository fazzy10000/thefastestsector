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

async function shot(name) {
  await page.screenshot({ path: join(outDir, name) })
  console.log('saved', name)
}

// Login
await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 })
await page.fill('input[type="email"], input[name="email"]', email)
await page.fill('input[type="password"], input[name="password"]', password)
await Promise.all([
  page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }).catch(() => null),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(1500)

// 30: dashboard
await page.goto(`${base}/admin`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1500)
await shot('30-admin-dashboard.png')

// 31/32: article editor + SEO panel. Find first edit link on dashboard.
const editHref = await page.getAttribute('a[href*="/admin/edit/"]', 'href').catch(() => null)
if (editHref) {
  await page.goto(`${base}${editHref}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(2000)
  await shot('31-admin-editor.png')
  const gp = page.locator('text=Google Preview').first()
  if (await gp.count()) {
    await gp.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await shot('32-editor-seo-panel.png')
  } else {
    console.log('no Google Preview element found')
  }
} else {
  console.log('no edit link found on dashboard')
}

// 33: media library
await page.goto(`${base}/admin/media`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1500)
await shot('33-admin-media.png')

// 34: newsletters
await page.goto(`${base}/admin/newsletter`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1500)
await shot('34-admin-newsletters.png')

// 35: SEO dashboard
await page.goto(`${base}/admin/seo`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2000)
await shot('35-admin-seo.png')

// 36: settings
await page.goto(`${base}/admin/settings`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1500)
await shot('36-admin-settings.png')

// 37: team
await page.goto(`${base}/admin/team`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1500)
await shot('37-admin-team.png')

// 38: public article page
await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1000)
const artHref = await page.getAttribute('a[href^="/article/"]', 'href').catch(() => null)
if (artHref) {
  await page.goto(`${base}${artHref}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  await shot('38-article-page.png')
} else {
  console.log('no article link found on home')
}

// 39: sitemap viewer LAST (concurrent rework in progress)
await page.goto(`${base}/admin/sitemap`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)
await shot('39-admin-sitemap.png')

await browser.close()
console.log('done')

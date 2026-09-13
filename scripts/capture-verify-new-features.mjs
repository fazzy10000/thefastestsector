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

// Public: home (header tagline) and policies hub
await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: join(outDir, '20-header-tagline.png'), fullPage: false })
console.log('saved 20-header-tagline')

await page.goto(`${base}/policies`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(800)
await page.screenshot({ path: join(outDir, '21-policies-hub.png'), fullPage: false })
console.log('saved 21-policies-hub')

// Footer with Policies link
await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(800)
await page.screenshot({ path: join(outDir, '22-footer-policies.png'), fullPage: false })
console.log('saved 22-footer-policies')

// Admin: sitemap viewer (login first)
await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 })
await page.fill('input[type="email"], input[name="email"]', email)
await page.fill('input[type="password"], input[name="password"]', password)
await Promise.all([
  page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }).catch(() => null),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(1000)
await page.goto(`${base}/admin/sitemap`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: join(outDir, '23-admin-sitemap.png'), fullPage: false })
console.log('saved 23-admin-sitemap')

await browser.close()
console.log('done')

import { chromium } from 'playwright'
import { join } from 'path'

const base = process.env.BASE_URL || 'http://localhost:5173'
const email = 'screenshot-admin@tfs.local'
const password = 'ScreenshotAdmin1!'

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
await page.goto(`${base}/admin/sitemap`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)
await page.screenshot({ path: join(process.cwd(), 'tmp-screenshots', '39-admin-sitemap.png') })
await browser.close()
console.log('sitemap recaptured')

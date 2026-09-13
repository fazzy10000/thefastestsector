import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const base = process.env.BASE_URL || 'http://localhost:5173'
const outDir = join(process.cwd(), 'tmp-screenshots')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 })
await page.fill('input[type="email"]', 'screenshot-admin@tfs.local')
await page.fill('input[type="password"]', 'ScreenshotAdmin1!')
await Promise.all([
  page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }).catch(() => null),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(1500)

// Fresh context = no seen flag, so the tour auto-starts; skip it first.
await page.waitForSelector('.tfs-tour-card', { timeout: 15000 })
await page.click('.tfs-tour-card button:has-text("Skip tour")')
await page.waitForTimeout(500)

// Sidebar "Take the tour" button
const btn = page.locator('[data-tour="tour-button"]')
await btn.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: join(outDir, '32-tour-button.png') })
console.log('saved 32-tour-button')

// Re-trigger: clicking must restart from step 1 despite the seen flag
await btn.click()
await page.waitForSelector('.tfs-tour-card', { timeout: 10000 })
await page.waitForTimeout(600)
console.log('restarted at:', await page.textContent('.tfs-tour-card h3'))
await page.click('.tfs-tour-card button:has-text("Skip tour")')
await page.waitForTimeout(500)

// Dark mode check
await page.click('aside button:has-text("Dark mode")')
await page.waitForTimeout(400)
await page.evaluate(() => window.scrollTo(0, 0))
await btn.click()
await page.waitForSelector('.tfs-tour-card', { timeout: 10000 })
await page.waitForTimeout(600)
await page.screenshot({ path: join(outDir, '34-tour-dark.png') })
console.log('saved 34-tour-dark —', await page.textContent('.tfs-tour-card h3'))

// Back to light mode for other users of this account
await page.click('.tfs-tour-card button:has-text("Skip tour")')
await page.waitForTimeout(300)
await page.click('aside button:has-text("Light mode")')
await page.waitForTimeout(300)

await browser.close()
console.log('done')

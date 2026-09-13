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

// Login
await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 })
await page.fill('input[type="email"], input[name="email"]', email)
await page.fill('input[type="password"], input[name="password"]', password)
await Promise.all([
  page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }).catch(() => null),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(1000)

// Clear any tour-seen flags so the first-login auto-start fires
await page.evaluate(() => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('tfs_admin_tour_seen_')) localStorage.removeItem(key)
  }
})

// Reload /admin — tour should auto-open after ~1s
await page.goto(`${base}/admin`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForSelector('.tfs-tour-card', { timeout: 15000 })
await page.waitForTimeout(800)
await page.screenshot({ path: join(outDir, '30-tour-step1.png') })
console.log('saved 30-tour-step1 —', await page.textContent('.tfs-tour-card'))

const next = async (settle = 1600) => {
  await page.click('.tfs-tour-card button:has-text("Next")')
  await page.waitForTimeout(settle)
}

// Step 2 (sidebar), step 3 (new article link)
await next()
console.log('step 2:', await page.textContent('.tfs-tour-card h3'))
await next()
console.log('step 3:', await page.textContent('.tfs-tour-card h3'))

// Step 4 — navigates to /admin/new, spotlight on title field
await next(2500)
console.log('step 4:', page.url(), '—', await page.textContent('.tfs-tour-card h3'))
await page.screenshot({ path: join(outDir, '31-tour-editor.png') })
console.log('saved 31-tour-editor')

// Click through the remaining editor steps (5..11)
for (let i = 5; i <= 11; i++) {
  await next()
  console.log(`step ${i}:`, await page.textContent('.tfs-tour-card h3'))
}

// Step 12 — navigates back to /admin dashboard
await next(2500)
console.log('step 12:', page.url(), '—', await page.textContent('.tfs-tour-card h3'))
await page.screenshot({ path: join(outDir, '33-tour-laststep.png') })

// Finish
await page.click('.tfs-tour-card button:has-text("Finish")')
await page.waitForTimeout(800)
const seen = await page.evaluate(() =>
  Object.keys(localStorage).filter((k) => k.startsWith('tfs_admin_tour_seen_')),
)
console.log('seen flags after finish:', seen)

// Sidebar "Take the tour" button
await page.screenshot({ path: join(outDir, '32-tour-button.png') })
console.log('saved 32-tour-button')

await browser.close()
console.log('done')

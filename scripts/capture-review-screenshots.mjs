import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const base = process.env.BASE_URL || 'http://localhost:5173'
const outDir = join(process.cwd(), 'tmp-screenshots')
mkdirSync(outDir, { recursive: true })

const shots = [
  { name: '01-home', path: '/', fullPage: true },
  { name: '02-footer-home', path: '/', clipFooter: true },
  { name: '03-standings', path: '/standings', fullPage: false },
  { name: '04-news-hub', path: '/category/news', fullPage: false },
  { name: '05-about', path: '/about', fullPage: false },
  { name: '06-join', path: '/join', fullPage: false },
  { name: '07-admin-login', path: '/admin/login', fullPage: false },
]

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

for (const shot of shots) {
  await page.goto(base + shot.path, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(800)
  const file = join(outDir, `${shot.name}.png`)
  if (shot.clipFooter) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    await page.screenshot({ path: file, fullPage: false })
  } else {
    await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) })
  }
  console.log('saved', file)
}

// Admin pages need auth — try traffic & insights / ads if session exists; otherwise skip
for (const shot of [
  { name: '08-admin-stats', path: '/admin/stats' },
  { name: '09-admin-ads', path: '/admin/ads' },
]) {
  await page.goto(base + shot.path, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(600)
  const file = join(outDir, `${shot.name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('saved', file)
}

await browser.close()
console.log('done')

#!/usr/bin/env node
/**
 * Generates public/sitemap.xml from the WordPress import JSON.
 * Run: node scripts/generate-sitemap.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = 'https://thefastestsector.com'

const importPath = path.join(root, 'src', 'data', 'wp-import.json')
const outPath = path.join(root, 'public', 'sitemap.xml')

const data = JSON.parse(fs.readFileSync(importPath, 'utf-8'))
const articles = Array.isArray(data.articles) ? data.articles : []

const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'hourly' },
  { loc: '/about', priority: '0.6', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
  { loc: '/join', priority: '0.6', changefreq: 'monthly' },
  { loc: '/schedule', priority: '0.8', changefreq: 'weekly' },
  { loc: '/standings', priority: '0.8', changefreq: 'daily' },
  { loc: '/quizzes', priority: '0.7', changefreq: 'weekly' },
  { loc: '/games', priority: '0.7', changefreq: 'monthly' },
  { loc: '/interactive', priority: '0.6', changefreq: 'monthly' },
  { loc: '/interactive/polls', priority: '0.6', changefreq: 'weekly' },
  { loc: '/sector-sweep', priority: '0.7', changefreq: 'weekly' },
  { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/editorial-policy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/corrections-policy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  { loc: '/category/news', priority: '0.9', changefreq: 'hourly' },
  { loc: '/category/formula-1', priority: '0.8', changefreq: 'daily' },
  { loc: '/category/indycar', priority: '0.7', changefreq: 'daily' },
  { loc: '/category/formula-e', priority: '0.7', changefreq: 'daily' },
  { loc: '/category/feeder-series', priority: '0.7', changefreq: 'daily' },
  { loc: '/category/f1-academy', priority: '0.7', changefreq: 'daily' },
]

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function toIsoDate(ts) {
  if (!ts) return new Date().toISOString().slice(0, 10)
  const d = new Date(typeof ts === 'number' ? ts : Date.parse(ts))
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

const urls = [
  ...staticPages.map((p) => ({
    loc: `${BASE}${p.loc}`,
    lastmod: toIsoDate(Date.now()),
    changefreq: p.changefreq,
    priority: p.priority,
  })),
  ...articles
    .filter((a) => a?.slug && a.status !== 'draft')
    .map((a) => ({
      loc: `${BASE}/article/${encodeURIComponent(a.slug)}`,
      lastmod: toIsoDate(a.updatedAt || a.publishedAt || a.createdAt),
      changefreq: 'weekly',
      priority: '0.7',
    })),
]

const body = urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

fs.writeFileSync(outPath, xml)
console.log(`Wrote ${urls.length} URLs to ${outPath}`)

#!/usr/bin/env node
/**
 * Fetches all posts from the WordPress REST API at thefastestsector.com
 * and writes them as a JSON file that the site can import into Firebase.
 */

const WP_BASE = 'https://thefastestsector.com/wp-json/wp/v2'
const PER_PAGE = 100

// Map WP category IDs → our internal Category slugs
const WP_CAT_MAP = {
  12353: 'formula-1',      // Formula One
  785511861: 'formula-1',  // F1 2026 Season
  785511860: 'formula-1',  // F1 2026 Season (dup)
  777162877: 'formula-1',  // F1 2025 Season
  767874899: 'formula-1',  // F1 2024 Season
  759111547: 'formula-1',  // F1 2023 Season
  728561263: 'formula-1',  // F1 2022 Season
  715653152: 'formula-1',  // F1 2021 season
  45741: 'formula-1',      // Technical Posts
  524553: 'formula-1',     // Flashback Friday
  236093130: 'formula-1',  // Memorable Races
  380841736: 'formula-1',  // Track Check
  785511902: 'formula-1',  // Sector Sweep
  11895676: 'feeder-series', // F1 Feeder Series
  22892848: 'formula-e',   // Formula E
  110333: 'indycar',       // Indycar
  712746814: 'other',      // Other Motorsport Categories
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
}

function resolveCategory(wpCatIds) {
  // Priority: most specific non-F1 category wins if present
  for (const id of wpCatIds) {
    const mapped = WP_CAT_MAP[id]
    if (mapped && mapped !== 'formula-1') return mapped
  }
  for (const id of wpCatIds) {
    const mapped = WP_CAT_MAP[id]
    if (mapped) return mapped
  }
  return 'other'
}

function guessContentType(title, excerpt, categories) {
  const t = (title + ' ' + excerpt).toLowerCase()
  if (t.includes('recap') || t.includes('race result') || t.includes('grand prix:') ||
      t.includes('wins') || t.includes('victory') || t.includes('triumphs') ||
      t.includes('takes') || t.includes('claims') || t.includes('dominates') ||
      t.includes('storms to') || t.includes('sprint') || t.includes('e-prix')) {
    return 'results'
  }
  if (t.includes('opinion') || t.includes('ranking') || t.includes('predict') ||
      t.includes('expect') || t.includes('bold') || t.includes('should') ||
      t.includes('strongest') || t.includes('right choice') || t.includes('dying') ||
      t.includes('curse') || t.includes('review') || t.includes('why you should')) {
    return 'opinion'
  }
  return 'news'
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function fetchAllPosts() {
  const allPosts = []
  let page = 1
  while (true) {
    const url = `${WP_BASE}/posts?per_page=${PER_PAGE}&page=${page}&_fields=id,title,slug,date,content,excerpt,categories,featured_media,link`
    console.log(`  Fetching page ${page}...`)
    try {
      const posts = await fetchJson(url)
      if (!posts.length) break
      allPosts.push(...posts)
      page++
    } catch (e) {
      if (e.message.includes('400')) break // no more pages
      throw e
    }
  }
  return allPosts
}

async function fetchMediaUrl(mediaId) {
  if (!mediaId) return ''
  try {
    const media = await fetchJson(`${WP_BASE}/media/${mediaId}?_fields=source_url`)
    return media.source_url || ''
  } catch {
    return ''
  }
}

async function fetchAuthors() {
  try {
    const authors = await fetchJson(`${WP_BASE}/users?per_page=100&_fields=id,name,slug,description,avatar_urls`)
    return authors
  } catch {
    return []
  }
}

async function fetchAuthorForPost(postId) {
  try {
    const post = await fetchJson(`${WP_BASE}/posts/${postId}?_fields=author`)
    if (!post.author) return null
    const author = await fetchJson(`${WP_BASE}/users/${post.author}?_fields=id,name,slug,description,avatar_urls`)
    return author
  } catch {
    return null
  }
}

async function main() {
  console.log('=== The Fastest Sector — WordPress Import ===\n')

  console.log('1. Fetching all posts...')
  const posts = await fetchAllPosts()
  console.log(`   Found ${posts.length} posts\n`)

  console.log('2. Fetching WP authors...')
  const wpAuthors = await fetchAuthors()
  console.log(`   Found ${wpAuthors.length} authors\n`)

  console.log('3. Fetching featured images (this may take a minute)...')
  const mediaIds = [...new Set(posts.map(p => p.featured_media).filter(Boolean))]
  console.log(`   ${mediaIds.length} unique media items to fetch`)

  const mediaMap = {}
  const BATCH = 10
  for (let i = 0; i < mediaIds.length; i += BATCH) {
    const batch = mediaIds.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(id => fetchMediaUrl(id)))
    batch.forEach((id, j) => { mediaMap[id] = results[j] })
    if (i % 50 === 0 && i > 0) console.log(`   ... ${i}/${mediaIds.length}`)
  }
  console.log(`   Done fetching media\n`)

  console.log('4. Fetching author per post...')
  const postAuthorMap = {}
  for (let i = 0; i < posts.length; i += BATCH) {
    const batch = posts.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(p => fetchAuthorForPost(p.id)))
    batch.forEach((p, j) => { postAuthorMap[p.id] = results[j] })
    if (i % 50 === 0 && i > 0) console.log(`   ... ${i}/${posts.length}`)
  }
  console.log(`   Done\n`)

  console.log('5. Building import data...')
  const authorSet = new Map()
  const articles = []

  for (const post of posts) {
    const title = stripHtml(post.title.rendered)
    const excerpt = stripHtml(post.excerpt.rendered)
    const content = post.content.rendered
    const category = resolveCategory(post.categories || [])
    const contentType = guessContentType(title, excerpt, post.categories)
    const dateMs = new Date(post.date).getTime()
    const featuredImage = mediaMap[post.featured_media] || ''

    const wpAuthor = postAuthorMap[post.id]
    let authorName = 'TFS Team'
    let authorId = 'tfs-team'
    if (wpAuthor) {
      authorName = wpAuthor.name
      authorId = wpAuthor.slug || wpAuthor.name.toLowerCase().replace(/\s+/g, '-')
      if (!authorSet.has(authorId)) {
        authorSet.set(authorId, {
          id: authorId,
          name: wpAuthor.name,
          bio: wpAuthor.description || '',
          avatar: wpAuthor.avatar_urls?.['96'] || '',
          twitter: '',
          instagram: '',
          linkedin: '',
        })
      }
    }

    articles.push({
      id: `wp-${post.id}`,
      title,
      slug: post.slug,
      excerpt,
      content,
      featuredImage,
      category,
      contentType,
      tags: [],
      author: authorName,
      authorId,
      status: 'published',
      featured: false,
      scheduledAt: null,
      createdAt: dateMs,
      updatedAt: dateMs,
      publishedAt: dateMs,
    })
  }

  // Mark the most recent article as featured
  if (articles.length > 0) {
    articles[0].featured = true
  }

  const importData = {
    articles,
    authors: [...authorSet.values()],
    importedAt: new Date().toISOString(),
    source: 'https://thefastestsector.com',
    totalArticles: articles.length,
    totalAuthors: authorSet.size,
  }

  const fs = await import('fs')
  const outPath = new URL('../src/data/wp-import.json', import.meta.url).pathname
  const dir = outPath.substring(0, outPath.lastIndexOf('/'))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(importData, null, 2))

  console.log(`\n✅ Import complete!`)
  console.log(`   Articles: ${articles.length}`)
  console.log(`   Authors:  ${authorSet.size}`)
  console.log(`   Saved to: ${outPath}`)

  // Category breakdown
  const catCounts = {}
  for (const a of articles) {
    catCounts[a.category] = (catCounts[a.category] || 0) + 1
  }
  console.log('\n   Category breakdown:')
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat}: ${count}`)
  }
}

main().catch(e => { console.error('Error:', e); process.exit(1) })

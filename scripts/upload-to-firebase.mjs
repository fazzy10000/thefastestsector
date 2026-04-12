#!/usr/bin/env node
/**
 * Uploads imported WordPress articles and authors to Firebase Firestore.
 * Run: node scripts/upload-to-firebase.mjs
 *
 * Requires: FIREBASE_PROJECT_ID, FIREBASE_API_KEY in .env
 * Uses the REST API directly so no Firebase Admin SDK is needed.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read .env file
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID
const API_KEY = env.VITE_FIREBASE_API_KEY

if (!PROJECT_ID || !API_KEY) {
  console.error('Missing VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_API_KEY in .env')
  process.exit(1)
}

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const importPath = path.join(__dirname, '..', 'src', 'data', 'wp-import.json')
const importData = JSON.parse(fs.readFileSync(importPath, 'utf-8'))

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number') return { integerValue: String(val) }
  if (typeof val === 'string') return { stringValue: val }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } }
  }
  if (typeof val === 'object') {
    const fields = {}
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(val) }
}

function toFirestoreDoc(obj) {
  const fields = {}
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'id') continue // document ID is separate
    fields[key] = toFirestoreValue(val)
  }
  return { fields }
}

async function upsertDoc(collection, docId, data) {
  const url = `${FIRESTORE_URL}/${collection}/${docId}?key=${API_KEY}`
  const body = JSON.stringify(toFirestoreDoc(data))
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to upsert ${collection}/${docId}: ${res.status} ${err}`)
  }
}

async function main() {
  console.log(`=== Upload to Firebase (${PROJECT_ID}) ===\n`)
  console.log(`Articles: ${importData.articles.length}`)
  console.log(`Authors:  ${importData.authors.length}\n`)

  // Upload authors first
  console.log('Uploading authors...')
  for (const author of importData.authors) {
    try {
      await upsertDoc('authors', author.id, author)
      process.stdout.write('.')
    } catch (e) {
      console.error(`\n  Error: ${e.message}`)
    }
  }
  console.log(` Done (${importData.authors.length})\n`)

  // Upload articles in batches
  console.log('Uploading articles...')
  let success = 0
  let errors = 0
  for (let i = 0; i < importData.articles.length; i++) {
    const article = importData.articles[i]
    try {
      await upsertDoc('articles', article.id, article)
      success++
      if (success % 10 === 0) process.stdout.write('.')
      if (success % 100 === 0) console.log(` ${success}/${importData.articles.length}`)
    } catch (e) {
      errors++
      console.error(`\n  Error uploading "${article.title}": ${e.message}`)
    }
  }

  console.log(`\n\n✅ Upload complete!`)
  console.log(`   Success: ${success}`)
  console.log(`   Errors:  ${errors}`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })

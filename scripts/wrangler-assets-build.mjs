/**
 * Runs the Vite/frontend build when Wrangler is deploying, so assets.directory
 * (./dist) exists. Skipped for `wrangler dev` — local UI is served by Vite.
 */
import { spawnSync } from 'node:child_process'

const cmd = process.env.WRANGLER_COMMAND || ''
if (cmd === 'dev') {
  process.exit(0)
}

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
})

process.exit(result.status === null ? 1 : result.status)

import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { spawn } from 'child_process'

const mcpPath = join(homedir(), '.cursor', 'mcp.json')
const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
const envFromConfig = mcp?.mcpServers?.['google-docs']?.env || {}

if (!envFromConfig.GOOGLE_CLIENT_ID || !envFromConfig.GOOGLE_CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in ~/.cursor/mcp.json')
  process.exit(1)
}

const child = spawn(
  'npx',
  ['-y', '@a-bonus/google-docs-mcp', 'auth'],
  {
    env: { ...process.env, ...envFromConfig },
    stdio: 'inherit',
    shell: true,
  },
)

child.on('exit', (code) => process.exit(code ?? 1))

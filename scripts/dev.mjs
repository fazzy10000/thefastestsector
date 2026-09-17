import { spawn } from 'node:child_process'

const kids = [
  spawn('npx', ['vite'], { stdio: 'inherit', shell: true }),
  spawn('npx', ['wrangler', 'dev', '--port', '8787'], { stdio: 'inherit', shell: true }),
]

function shutDown(code = 0) {
  for (const kid of kids) {
    if (!kid.killed) kid.kill()
  }
  process.exit(code)
}

for (const kid of kids) {
  kid.on('exit', (code, signal) => {
    if (signal) shutDown(1)
    else shutDown(code ?? 0)
  })
  kid.on('error', (err) => {
    console.error(err)
    shutDown(1)
  })
}

process.on('SIGINT', () => shutDown(0))
process.on('SIGTERM', () => shutDown(0))

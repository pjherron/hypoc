#!/usr/bin/env node
/**
 * Enterprise AI Developer Platform installer.
 * Wires up hypoc (CLI), hypoc-face (browser UI), skills, agents, and model router.
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '../../')

function run(cmd, label) {
  console.log(`\n→ ${label}`)
  try {
    execSync(cmd, { stdio: 'inherit', cwd: ROOT })
  } catch (e) {
    console.error(`  FAILED: ${label}`)
    process.exit(1)
  }
}

function check(path, label) {
  if (!existsSync(resolve(ROOT, path))) {
    console.warn(`  WARNING: ${label} not found at ${path}`)
    return false
  }
  return true
}

console.log('Enterprise AI Developer Platform — Installer')
console.log('============================================\n')

// 1. Verify structure
check('hypoc/.opencode.json', 'hypoc OpenCode config')
check('hypoc-face/hypoc-face-core/requirements.txt', 'hypoc-face-core backend')
check('hypoc-face/hypoc-face-router/requirements.txt', 'hypoc-face-router')
check('skills/bootstrap/SKILL.md', 'bootstrap skill')

// 2. Python deps for hypoc-face-core
if (check('hypoc-face/hypoc-face-core/requirements.txt', 'hypoc-face-core')) {
  run('pip install -r hypoc-face/hypoc-face-core/requirements.txt --quiet', 'Installing hypoc-face-core dependencies')
}

// 3. Python deps for router
if (check('hypoc-face/hypoc-face-router/requirements.txt', 'router')) {
  run('pip install -r hypoc-face/hypoc-face-router/requirements.txt --quiet', 'Installing router dependencies')
}

// 4. Start services via docker-compose if available
if (check('hypoc/docker-compose.yml', 'docker-compose')) {
  run('docker compose -f hypoc/docker-compose.yml up -d', 'Starting hypoc services (Docker)')
}

console.log('\n✓ Installation complete.')
console.log('\nNext steps:')
console.log('  1. Start the browser UI:  cd hypoc-face && uvicorn hypoc-face-core.main:app --reload')
console.log('  2. Open the terminal env: cd hypoc && opencode')
console.log('  3. Or open browser UI at: http://localhost:8000')
console.log('\nOn first session, just describe what you want to do in plain English.')

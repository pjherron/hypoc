#!/usr/bin/env node
/**
 * Enterprise AI Developer Platform installer.
 * Supports: macOS, Linux, WSL.
 * OpenCode: sst/opencode (cross-platform) — https://opencode.ai
 */

import { execSync, spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '../../')
const PLATFORM = os.platform()        // 'darwin' | 'linux' | 'win32'
const IS_WSL = PLATFORM === 'linux' && existsSync('/proc/version') &&
  (() => { try { return require('fs').readFileSync('/proc/version','utf8').toLowerCase().includes('microsoft') } catch { return false } })()

function run(cmd, label, opts = {}) {
  console.log(`\n→ ${label}`)
  try {
    execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })
  } catch {
    console.error(`  FAILED: ${label}`)
    if (!opts.optional) process.exit(1)
  }
}

function check(path, label) {
  if (!existsSync(resolve(ROOT, path))) {
    console.warn(`  WARNING: ${label} not found at ${path}`)
    return false
  }
  return true
}

function has(cmd) {
  return spawnSync('which', [cmd], { stdio: 'pipe' }).status === 0
}

console.log('Enterprise AI Developer Platform — Installer')
console.log('============================================')
console.log(`Platform: ${IS_WSL ? 'WSL (Linux)' : PLATFORM}\n`)

// ── 1. OpenCode (sst/opencode — cross-platform) ───────────────────────────
console.log('→ Checking OpenCode...')
if (has('opencode')) {
  const v = spawnSync('opencode', ['--version'], { stdio: 'pipe' })
  console.log(`  opencode found: ${v.stdout?.toString().trim() || 'version unknown'}`)
  console.log('  To upgrade: see https://opencode.ai/docs/getting-started/installation')
} else {
  console.log('  opencode not found — installing via sst/opencode installer...')
  if (PLATFORM === 'darwin') {
    // macOS: use the sst install script (not anomalyco brew tap)
    run('curl -fsSL https://opencode.ai/install | sh', 'Install opencode (macOS)', { optional: true })
  } else if (PLATFORM === 'linux') {
    // Linux / WSL
    run('curl -fsSL https://opencode.ai/install | sh', 'Install opencode (Linux/WSL)', { optional: true })
  } else {
    console.warn('  Windows native not supported — use WSL.')
  }
}

// ── 2. Verify structure ───────────────────────────────────────────────────
check('hypoc/.opencode.json', 'hypoc OpenCode config')
check('hypoc-face/hypoc-face-core/requirements.txt', 'hypoc-face-core backend')
check('hypoc-face/hypoc-face-router/requirements.txt', 'hypoc-face-router')
check('hypoc-face/hypoc-face-ui/package.json', 'hypoc-face-ui')
check('skills/bootstrap/SKILL.md', 'bootstrap skill')

// ── 3. Python deps ────────────────────────────────────────────────────────
const pip = has('pip3') ? 'pip3' : 'pip'
if (check('hypoc-face/hypoc-face-core/requirements.txt', 'hypoc-face-core')) {
  run(`${pip} install -r hypoc-face/hypoc-face-core/requirements.txt --quiet`, 'hypoc-face-core Python deps')
}
if (check('hypoc-face/hypoc-face-router/requirements.txt', 'router')) {
  run(`${pip} install -r hypoc-face/hypoc-face-router/requirements.txt --quiet`, 'router Python deps')
}

// ── 4. UI deps ────────────────────────────────────────────────────────────
if (check('hypoc-face/hypoc-face-ui/package.json', 'UI')) {
  run('npm install --prefix hypoc-face/hypoc-face-ui --silent', 'hypoc-face-ui npm deps')
}

// ── 5. OpenCode plugin deps ───────────────────────────────────────────────
if (check('hypoc/.opencode/package.json', 'opencode plugin')) {
  run('npm install --prefix hypoc/.opencode --silent', 'OpenCode plugin deps (@opencode-ai/plugin)')
}

// ── 6. Docker services ────────────────────────────────────────────────────
if (has('docker')) {
  run('docker compose up -d', 'Starting services (PostgreSQL, Redis, hypoc-face-core, router, UI)')
} else {
  console.warn('\n  WARNING: docker not found — start services manually (see docker-compose.yml)')
}

console.log('\n✓ Installation complete.\n')
console.log('Next steps:')
console.log('  cp hypoc-face/hypoc-face-router/.env.example hypoc-face/hypoc-face-router/.env')
console.log('  # Fill in ANTHROPIC_API_KEY and any LLM credentials in the .env file')
console.log()
if (PLATFORM === 'darwin') {
  console.log('  NOTE: If migrating from anomalyco opencode → sst/opencode:')
  console.log('    brew unlink anomalyco/tap/opencode && brew install sst/opencode/opencode')
  console.log('    (your .opencode.json config transfers unchanged)')
  console.log()
}
console.log('  Start the CLI:         cd hypoc && opencode')
console.log('  Open the browser UI:   http://localhost:3000')
console.log('  On first session, describe what you want in plain English.')

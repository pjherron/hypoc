/**
 * Context-Aware Skill Discovery Plugin for OpenCode
 *
 * Analyzes project structure and user prompts to suggest relevant skills.
 * Does NOT auto-inject - only suggests via the system prompt.
 *
 * Features:
 * - Project type detection (React, Next.js, Python, Go, etc.)
 * - Keyword-based skill matching on user prompts
 * - Session memory of suggested skills (avoid re-suggesting)
 * - Token budget awareness
 *
 * Notes on the opencode plugin API (opencode >= 1.18):
 * - export default must be a function factory: (ctx: PluginInput) => Promise<Hooks>,
 *   not a plain object. See plugins/opencode-model-router/src/index.ts for the
 *   reference implementation this plugin now matches.
 * - There is no "session.created" / "message.user" / "skill.loaded" hook. The real
 *   hook order is chat.message -> experimental.chat.system.transform -> chat.params.
 *   User message text is only available in chat.message's `output`; system-prompt
 *   injection only happens via output.system.push(...) inside
 *   experimental.chat.system.transform.
 */

import type { Plugin, PluginInput } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"

const require = createRequire(import.meta.url)

// Skill catalog with triggers
interface SkillMetadata {
  name: string
  path: string | null
  triggers: {
    filePatterns?: string[]        // e.g. ["package.json", "*.tsx"]
    keywords?: string[]             // e.g. ["test", "tdd", "coverage"]
    dependencies?: string[]         // e.g. ["react", "next"]
  }
  category: "frontend" | "backend" | "testing" | "devops" | "research" | "framework-specific"
  estimatedTokens: number
}

/**
 * Resolve the installed location of a globally-fetched skill package.
 *
 * Tries Node's own module resolution first (works regardless of platform or
 * package manager - npm on Windows, Homebrew on macOS/Linuxbrew, apt, etc.),
 * then falls back to a short list of common global-install locations. Returns
 * null (not a hardcoded guess) if the package genuinely isn't installed, so
 * callers can skip those skills instead of pointing at a dead path.
 */
function resolveSkillsDir(pkgName: string): string | null {
  try {
    const pkgJsonPath = require.resolve(`${pkgName}/package.json`)
    return join(dirname(pkgJsonPath), "skills")
  } catch {
    // Not resolvable as a normal Node module from here - fall through to
    // known global-install locations below.
  }

  // Ask npm directly where it puts global packages. This is the most
  // reliable cross-platform answer (works with nvm, custom prefixes, corp
  // installs, etc.) and is exactly where `npm install -g` (used by
  // bin/install) actually places the package - not just a guess.
  try {
    const globalRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf-8" }).trim()
    if (globalRoot) {
      const candidate = join(globalRoot, pkgName, "skills")
      if (existsSync(candidate)) return candidate
    }
  } catch {
    // npm not on PATH or the call failed - fall through to hardcoded guesses.
  }

  const candidates: string[] = []
  if (process.platform === "darwin") {
    candidates.push(
      `/opt/homebrew/lib/node_modules/${pkgName}/skills`,
      `/usr/local/lib/node_modules/${pkgName}/skills`,
    )
  } else if (process.platform === "linux") {
    candidates.push(
      `/home/linuxbrew/.linuxbrew/lib/node_modules/${pkgName}/skills`,
      `/usr/lib/node_modules/${pkgName}/skills`,
      `/usr/local/lib/node_modules/${pkgName}/skills`,
    )
  } else if (process.platform === "win32" && process.env.APPDATA) {
    candidates.push(join(process.env.APPDATA, "npm", "node_modules", pkgName, "skills"))
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

const ECC_SKILLS_DIR = resolveSkillsDir("ecc-universal")

function skillPath(name: string): string | null {
  return ECC_SKILLS_DIR ? join(ECC_SKILLS_DIR, name, "SKILL.md") : null
}

const SKILL_CATALOG: SkillMetadata[] = [
  {
    name: "frontend-patterns",
    path: skillPath("frontend-patterns"),
    triggers: {
      filePatterns: ["*.tsx", "*.jsx", "package.json"],
      keywords: ["react", "component", "hook", "state", "render"],
      dependencies: ["react", "next"]
    },
    category: "frontend",
    estimatedTokens: 4500
  },
  {
    name: "backend-patterns",
    path: skillPath("backend-patterns"),
    triggers: {
      filePatterns: ["*/api/*", "*/routes/*", "*.service.ts"],
      keywords: ["api", "endpoint", "database", "cache", "repository"],
      dependencies: ["express", "fastify", "nestjs"]
    },
    category: "backend",
    estimatedTokens: 4200
  },
  {
    name: "api-design",
    path: skillPath("api-design"),
    triggers: {
      keywords: ["rest", "graphql", "endpoint", "pagination", "rate limit"],
      filePatterns: ["*/api/*", "openapi.yaml", "swagger.json"]
    },
    category: "backend",
    estimatedTokens: 3800
  },
  {
    name: "e2e-testing",
    path: skillPath("e2e-testing"),
    triggers: {
      keywords: ["e2e", "playwright", "selenium", "integration test", "user flow"],
      filePatterns: ["playwright.config.*", "*/e2e/*", "*.spec.ts"]
    },
    category: "testing",
    estimatedTokens: 3500
  },
  {
    name: "python-patterns",
    path: skillPath("python-patterns"),
    triggers: {
      filePatterns: ["*.py", "requirements.txt", "pyproject.toml"],
      keywords: ["python", "pandas", "numpy", "fastapi"]
    },
    category: "backend",
    estimatedTokens: 3200
  },
  {
    name: "golang-patterns",
    path: skillPath("golang-patterns"),
    triggers: {
      filePatterns: ["*.go", "go.mod", "go.sum"],
      keywords: ["golang", "goroutine", "channel", "interface"]
    },
    category: "backend",
    estimatedTokens: 3400
  },
  {
    name: "pytorch-patterns",
    path: skillPath("pytorch-patterns"),
    triggers: {
      keywords: ["pytorch", "tensor", "model", "training", "neural network"],
      dependencies: ["torch", "pytorch"]
    },
    category: "research",
    estimatedTokens: 4000
  },
  {
    name: "docker-patterns",
    path: skillPath("docker-patterns"),
    triggers: {
      filePatterns: ["Dockerfile", "docker-compose.yml", ".dockerignore"],
      keywords: ["docker", "container", "kubernetes", "deployment"]
    },
    category: "devops",
    estimatedTokens: 2800
  },
  {
    name: "verification-loop",
    path: skillPath("verification-loop"),
    triggers: {
      keywords: ["verify", "build", "test", "lint", "quality gate"]
    },
    category: "testing",
    estimatedTokens: 2500
  },
  {
    name: "strategic-compact",
    path: skillPath("strategic-compact"),
    triggers: {
      keywords: ["context", "token", "compact", "memory"]
    },
    category: "research",
    estimatedTokens: 2200
  }
]

interface ProjectContext {
  type: "web-fullstack" | "backend-api" | "python-ml" | "golang-service" | "mixed"
  frameworks: string[]
  hasTests: boolean
  hasDocker: boolean
}

/** A skill is only suggestible if its package resolved AND the SKILL.md actually exists. */
function isAvailable(skill: SkillMetadata): boolean {
  return !!skill.path && existsSync(skill.path)
}

/**
 * Detect project type from file structure
 */
function detectProjectContext(workdir: string): ProjectContext {
  const frameworks: string[] = []
  let hasTests = false
  let hasDocker = false

  // Check package.json for Node.js projects
  const packageJsonPath = join(workdir, "package.json")
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }

      if (deps.react) frameworks.push("react")
      if (deps.next) frameworks.push("next")
      if (deps.express) frameworks.push("express")
      if (deps.fastify) frameworks.push("fastify")
      if (deps["@nestjs/core"]) frameworks.push("nestjs")
      if (deps.playwright || deps["@playwright/test"]) hasTests = true
    } catch {}
  }

  // Check for Python
  if (existsSync(join(workdir, "requirements.txt")) || existsSync(join(workdir, "pyproject.toml"))) {
    frameworks.push("python")
  }

  // Check for Go
  if (existsSync(join(workdir, "go.mod"))) {
    frameworks.push("golang")
  }

  // Check for Docker
  if (existsSync(join(workdir, "Dockerfile"))) {
    hasDocker = true
  }

  // Check for test directories
  if (existsSync(join(workdir, "tests")) || existsSync(join(workdir, "test"))) {
    hasTests = true
  }

  // Determine project type
  let type: ProjectContext["type"] = "mixed"
  if (frameworks.includes("react") || frameworks.includes("next")) {
    type = "web-fullstack"
  } else if (frameworks.includes("python")) {
    type = "python-ml"
  } else if (frameworks.includes("golang")) {
    type = "golang-service"
  } else if (frameworks.includes("express") || frameworks.includes("fastify")) {
    type = "backend-api"
  }

  return { type, frameworks, hasTests, hasDocker }
}

/**
 * Match skills based on user prompt keywords
 */
function matchSkillsByKeywords(prompt: string, alreadySuggested: Set<string>): SkillMetadata[] {
  const lowercasePrompt = prompt.toLowerCase()
  const matches: SkillMetadata[] = []

  for (const skill of SKILL_CATALOG) {
    if (alreadySuggested.has(skill.name) || !isAvailable(skill)) continue

    if (skill.triggers.keywords) {
      for (const keyword of skill.triggers.keywords) {
        if (lowercasePrompt.includes(keyword.toLowerCase())) {
          matches.push(skill)
          break
        }
      }
    }
  }

  return matches
}

/**
 * Match skills based on project context
 */
function matchSkillsByProject(context: ProjectContext, alreadySuggested: Set<string>): SkillMetadata[] {
  const matches: SkillMetadata[] = []

  for (const skill of SKILL_CATALOG) {
    if (alreadySuggested.has(skill.name) || !isAvailable(skill)) continue

    // Match by framework
    if (skill.triggers.dependencies) {
      for (const dep of skill.triggers.dependencies) {
        if (context.frameworks.includes(dep)) {
          matches.push(skill)
          break
        }
      }
    }
  }

  return matches
}

/**
 * Generate suggestion message
 */
function generateSuggestion(skills: SkillMetadata[], tokenBudget: number): string {
  if (skills.length === 0) return ""

  const totalTokens = skills.reduce((sum, s) => sum + s.estimatedTokens, 0)
  const remaining = tokenBudget - 80000 // Assume 80K baseline usage

  if (totalTokens > remaining) {
    skills = skills.slice(0, Math.max(0, Math.floor(remaining / 4000)))
  }

  if (skills.length === 0) return ""

  const skillList = skills.map(s => `- ${s.name} (~${s.estimatedTokens} tokens)`).join("\n")

  return `
[SKILL DISCOVERY]
Detected relevant skills for this context:

${skillList}

To load a skill:
  Use skill tool: \`skill.load("${skills[0].name}")\`
  Or ask me: "Load the ${skills[0].name} skill"

Token impact: ~${totalTokens.toLocaleString()} tokens total
`.trim()
}

const TOKEN_BUDGET = 200000 // Default OpenCode budget

/**
 * Plugin factory - opencode >= 1.18 requires export default to be a function
 * that returns hooks, not a plain object of hooks.
 */
const SkillDiscoveryPlugin: Plugin = async (ctx: PluginInput) => {
  const workdir = ctx.directory ?? process.cwd()
  const projectContext = detectProjectContext(workdir)

  // Per-plugin-instance session state, keyed by sessionID (an instance can see
  // hooks fire for more than one session, mirroring opencode-model-router's
  // sessionStore pattern).
  const lastUserText = new Map<string, string>()
  const suggestedThisSession = new Map<string, Set<string>>()
  const projectSuggestedFor = new Set<string>()

  function suggestedSetFor(sessionID: string): Set<string> {
    let set = suggestedThisSession.get(sessionID)
    if (!set) {
      set = new Set()
      suggestedThisSession.set(sessionID, set)
    }
    return set
  }

  return {
    // Capture the latest user message text. Mirrors opencode-model-router's
    // documented hook order: chat.message fires before
    // experimental.chat.system.transform, so this must run first to have
    // anything to match against.
    "chat.message": async (input: any, output: any) => {
      const sessionID = input?.sessionID
      if (!sessionID) return
      const parts = (output?.parts as unknown[]) ?? []
      const chunks: string[] = []
      for (const p of parts) {
        if (typeof p === "string") chunks.push(p)
        else if (p && typeof p === "object") {
          const rec = p as Record<string, unknown>
          if (typeof rec.text === "string") chunks.push(rec.text)
          else if (typeof rec.content === "string") chunks.push(rec.content)
        }
      }
      if (chunks.length === 0) {
        const content = (output?.message as Record<string, unknown> | undefined)?.content
        if (typeof content === "string") chunks.push(content)
      }
      if (chunks.length > 0) lastUserText.set(sessionID, chunks.join("\n"))
    },

    // Only place system-prompt text can actually be injected.
    "experimental.chat.system.transform": async (input: any, output: any) => {
      try {
        const sessionID = input?.sessionID
        const suggested = sessionID ? suggestedSetFor(sessionID) : new Set<string>()
        const messages: string[] = []

        if (!projectSuggestedFor.has(sessionID ?? "")) {
          if (sessionID) projectSuggestedFor.add(sessionID)
          const projectMatches = matchSkillsByProject(projectContext, suggested).slice(0, 3)
          if (projectMatches.length > 0) {
            messages.push(generateSuggestion(projectMatches, TOKEN_BUDGET))
            for (const s of projectMatches) suggested.add(s.name)
          }
        }

        const text = sessionID ? lastUserText.get(sessionID) : undefined
        if (text) {
          const keywordMatches = matchSkillsByKeywords(text, suggested).slice(0, 2)
          if (keywordMatches.length > 0) {
            messages.push(generateSuggestion(keywordMatches, TOKEN_BUDGET))
            for (const s of keywordMatches) suggested.add(s.name)
          }
        }

        if (messages.length > 0) {
          output.system.push(messages.join("\n\n"))
        }
      } catch {
        // best-effort: a skill suggestion must never crash a real session
      }
    },
  }
}

export default SkillDiscoveryPlugin

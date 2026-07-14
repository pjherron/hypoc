/**
 * Context-Aware Skill Discovery Plugin for OpenCode
 * 
 * Analyzes project structure and user prompts to suggest relevant skills.
 * Does NOT auto-inject - only suggests via system messages.
 * 
 * Features:
 * - Project type detection (React, Next.js, Python, Go, etc.)
 * - Keyword-based skill matching on user prompts
 * - Session memory of loaded skills (avoid re-suggesting)
 * - Token budget awareness
 */

import { existsSync, readFileSync } from "fs"
import { join } from "path"

// OpenCode plugin types
type OnEvent = Record<string, (context: any) => Promise<void | { metadata?: any }>>

// Skill catalog with triggers
interface SkillMetadata {
  name: string
  path: string
  triggers: {
    filePatterns?: string[]        // e.g. ["package.json", "*.tsx"]
    keywords?: string[]             // e.g. ["test", "tdd", "coverage"]
    dependencies?: string[]         // e.g. ["react", "next"]
  }
  category: "frontend" | "backend" | "testing" | "devops" | "research" | "framework-specific"
  estimatedTokens: number
}

const SKILL_CATALOG: SkillMetadata[] = [
  {
    name: "frontend-patterns",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/frontend-patterns/SKILL.md",
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
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/backend-patterns/SKILL.md",
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
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/api-design/SKILL.md",
    triggers: {
      keywords: ["rest", "graphql", "endpoint", "pagination", "rate limit"],
      filePatterns: ["*/api/*", "openapi.yaml", "swagger.json"]
    },
    category: "backend",
    estimatedTokens: 3800
  },
  {
    name: "e2e-testing",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/e2e-testing/SKILL.md",
    triggers: {
      keywords: ["e2e", "playwright", "selenium", "integration test", "user flow"],
      filePatterns: ["playwright.config.*", "*/e2e/*", "*.spec.ts"]
    },
    category: "testing",
    estimatedTokens: 3500
  },
  {
    name: "python-patterns",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/python-patterns/SKILL.md",
    triggers: {
      filePatterns: ["*.py", "requirements.txt", "pyproject.toml"],
      keywords: ["python", "pandas", "numpy", "fastapi"]
    },
    category: "backend",
    estimatedTokens: 3200
  },
  {
    name: "golang-patterns",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/golang-patterns/SKILL.md",
    triggers: {
      filePatterns: ["*.go", "go.mod", "go.sum"],
      keywords: ["golang", "goroutine", "channel", "interface"]
    },
    category: "backend",
    estimatedTokens: 3400
  },
  {
    name: "pytorch-patterns",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/pytorch-patterns/SKILL.md",
    triggers: {
      keywords: ["pytorch", "tensor", "model", "training", "neural network"],
      dependencies: ["torch", "pytorch"]
    },
    category: "research",
    estimatedTokens: 4000
  },
  {
    name: "docker-patterns",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/docker-patterns/SKILL.md",
    triggers: {
      filePatterns: ["Dockerfile", "docker-compose.yml", ".dockerignore"],
      keywords: ["docker", "container", "kubernetes", "deployment"]
    },
    category: "devops",
    estimatedTokens: 2800
  },
  {
    name: "verification-loop",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/verification-loop/SKILL.md",
    triggers: {
      keywords: ["verify", "build", "test", "lint", "quality gate"]
    },
    category: "testing",
    estimatedTokens: 2500
  },
  {
    name: "strategic-compact",
    path: "/opt/homebrew/lib/node_modules/ecc-universal/skills/strategic-compact/SKILL.md",
    triggers: {
      keywords: ["context", "token", "compact", "memory"]
    },
    category: "research",
    estimatedTokens: 2200
  }
]

// Session state
let loadedSkills = new Set<string>()
let projectContext: ProjectContext | null = null
let tokenBudget = 200000 // Default OpenCode budget

interface ProjectContext {
  type: "web-fullstack" | "backend-api" | "python-ml" | "golang-service" | "mixed"
  frameworks: string[]
  hasTests: boolean
  hasDocker: boolean
}

/**
 * Detect project type from file structure
 */
async function detectProjectContext(workdir: string): Promise<ProjectContext> {
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
function matchSkillsByKeywords(prompt: string): SkillMetadata[] {
  const lowercasePrompt = prompt.toLowerCase()
  const matches: SkillMetadata[] = []
  
  for (const skill of SKILL_CATALOG) {
    if (loadedSkills.has(skill.name)) continue // Skip already loaded
    
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
function matchSkillsByProject(context: ProjectContext): SkillMetadata[] {
  const matches: SkillMetadata[] = []
  
  for (const skill of SKILL_CATALOG) {
    if (loadedSkills.has(skill.name)) continue
    
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
function generateSuggestion(skills: SkillMetadata[]): string {
  if (skills.length === 0) return ""
  
  const totalTokens = skills.reduce((sum, s) => sum + s.estimatedTokens, 0)
  const remaining = tokenBudget - 80000 // Assume 80K baseline usage
  
  if (totalTokens > remaining) {
    skills = skills.slice(0, Math.floor(remaining / 4000))
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

/**
 * Plugin hooks
 */
export const skillDiscovery: OnEvent = {
  // Detect project context when session starts
  "session.created": async (context: any) => {
    const workdir = context?.workdir
    projectContext = await detectProjectContext(workdir || process.cwd())
    console.log(`[Skill Discovery] Detected project: ${projectContext.type}`)
    console.log(`[Skill Discovery] Frameworks: ${projectContext.frameworks.join(", ")}`)
    
    // Suggest initial skills based on project
    const suggestions = matchSkillsByProject(projectContext)
    if (suggestions.length > 0) {
      return {
        metadata: {
          suggestions: generateSuggestion(suggestions.slice(0, 3))
        }
      }
    }
  },
  
  // Analyze user prompt for skill keywords
  "message.user": async (context: any) => {
    const content = context?.content
    if (!content || typeof content !== "string") return
    
    const suggestions = matchSkillsByKeywords(content)
    if (suggestions.length > 0) {
      return {
        metadata: {
          suggestions: generateSuggestion(suggestions.slice(0, 2))
        }
      }
    }
  },
  
  // Track when skills are loaded (via skill tool or instructions)
  "skill.loaded": async (context: any) => {
    const skill = context?.skill
    loadedSkills.add(skill)
    console.log(`[Skill Discovery] Loaded: ${skill}`)
  }
}

export default skillDiscovery

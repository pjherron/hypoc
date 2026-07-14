#!/usr/bin/env node
/**
 * Context-Driven Memory Manager
 * 
 * Automatically captures important events with dates and context.
 * Appends to MEMORY.md when significant work happens.
 * 
 * Triggers:
 * - File changes (Write/Edit)
 * - Git commits
 * - Session milestones
 * - Explicit user requests
 */

import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const MEMORY_FILE = join(PROJECT_ROOT, 'MEMORY.md');

// Date formatting
const now = new Date();
const dateStr = now.toISOString().split('T')[0]; // 2026-04-17
const timeStr = now.toTimeString().split(' ')[0].slice(0, 5); // 14:30
const timestamp = `${dateStr} ${timeStr}`;

/**
 * Detect what type of work happened based on context
 */
function detectContext(args) {
  const context = {
    type: 'unknown',
    files: [],
    summary: '',
    tags: []
  };

  // Parse command line args
  const action = args[2]; // e.g., 'capture', 'milestone', 'commit'
  const detail = args.slice(3).join(' ');

  switch (action) {
    case 'capture':
      // Explicit capture with user-provided detail
      context.type = 'manual';
      context.summary = detail;
      break;

    case 'milestone':
      // Major milestone reached
      context.type = 'milestone';
      context.summary = detail;
      context.tags.push('milestone');
      break;

    case 'commit':
      // Git commit - extract message
      try {
        const lastCommit = execSync('git log -1 --pretty=%B', { cwd: PROJECT_ROOT })
          .toString()
          .trim();
        context.type = 'commit';
        context.summary = lastCommit;
        context.tags.push('git');
      } catch {
        // Not a git repo or no commits
      }
      break;

    case 'files-changed':
      // Detect from git status
      try {
        const changed = execSync('git diff --name-only HEAD', { cwd: PROJECT_ROOT })
          .toString()
          .trim()
          .split('\n')
          .filter(Boolean);
        
        context.type = 'development';
        context.files = changed;
        context.summary = inferSummaryFromFiles(changed);
        context.tags.push('development');
      } catch {
        // No git or no changes
      }
      break;

    case 'skill-added':
      // New skill was loaded/created
      context.type = 'configuration';
      context.summary = detail;
      context.tags.push('skills', 'configuration');
      break;

    case 'deployment':
      // Deployment happened
      context.type = 'deployment';
      context.summary = detail;
      context.tags.push('deployment', 'production');
      break;

    case 'debug':
      // Bug fixed
      context.type = 'debugging';
      context.summary = detail;
      context.tags.push('debugging', 'fix');
      break;
  }

  return context;
}

/**
 * Infer summary from changed files
 */
function inferSummaryFromFiles(files) {
  const categories = {
    config: files.filter(f => f.includes('config') || f.includes('.json') || f.includes('.yaml')),
    skills: files.filter(f => f.includes('skills/') || f.includes('SKILL.md')),
    code: files.filter(f => f.match(/\.(ts|js|py|go|java)$/)),
    docs: files.filter(f => f.match(/\.(md|txt)$/)),
    infra: files.filter(f => f.includes('Dockerfile') || f.includes('kubernetes') || f.includes('terraform'))
  };

  const summaries = [];
  if (categories.config.length) summaries.push(`Updated config (${categories.config.length} files)`);
  if (categories.skills.length) summaries.push(`Modified skills (${categories.skills.length})`);
  if (categories.code.length) summaries.push(`Code changes (${categories.code.length} files)`);
  if (categories.docs.length) summaries.push(`Documentation updates (${categories.docs.length})`);
  if (categories.infra.length) summaries.push(`Infrastructure changes (${categories.infra.length})`);

  return summaries.join(', ') || `Changed ${files.length} files`;
}

/**
 * Format memory entry
 */
function formatEntry(context) {
  const lines = [
    '',
    `### ${timestamp}`,
    `**Type:** ${context.type}`,
    `**Summary:** ${context.summary}`,
  ];

  if (context.files.length > 0) {
    lines.push(`**Files:** ${context.files.slice(0, 5).join(', ')}${context.files.length > 5 ? ` (+${context.files.length - 5} more)` : ''}`);
  }

  if (context.tags.length > 0) {
    lines.push(`**Tags:** ${context.tags.join(', ')}`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Append to MEMORY.md with date-based organization
 */
function appendToMemory(context) {
  // Ensure MEMORY.md exists
  if (!existsSync(MEMORY_FILE)) {
    const template = `# Project Memory

This file captures important events, decisions, and milestones with dates.

## Timeline

`;
    writeFileSync(MEMORY_FILE, template);
  }

  const content = readFileSync(MEMORY_FILE, 'utf-8');
  
  // Check if "## Timeline" section exists
  if (!content.includes('## Timeline')) {
    appendFileSync(MEMORY_FILE, '\n## Timeline\n');
  }

  // Append the entry
  const entry = formatEntry(context);
  appendFileSync(MEMORY_FILE, entry);

  console.log(`✓ Memory captured: ${context.summary}`);
  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Type: ${context.type}`);
  if (context.tags.length) {
    console.log(`  Tags: ${context.tags.join(', ')}`);
  }
}

/**
 * Search memory by date or keyword
 */
function searchMemory(query) {
  if (!existsSync(MEMORY_FILE)) {
    console.log('No memory file found.');
    return;
  }

  const content = readFileSync(MEMORY_FILE, 'utf-8');
  const lines = content.split('\n');
  
  const matches = [];
  let currentEntry = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect entry start (date heading)
    if (line.startsWith('### ')) {
      if (currentEntry) {
        matches.push(currentEntry);
      }
      currentEntry = { date: line.slice(4), lines: [line] };
    } else if (currentEntry) {
      currentEntry.lines.push(line);
    }
  }

  if (currentEntry) {
    matches.push(currentEntry);
  }

  // Filter by query
  const filtered = matches.filter(entry => {
    const entryText = entry.lines.join('\n').toLowerCase();
    return entryText.includes(query.toLowerCase());
  });

  console.log(`\nFound ${filtered.length} matching entries:\n`);
  filtered.forEach(entry => {
    console.log(entry.lines.join('\n'));
    console.log('---');
  });
}

/**
 * Show recent entries
 */
function showRecent(count = 5) {
  if (!existsSync(MEMORY_FILE)) {
    console.log('No memory file found.');
    return;
  }

  const content = readFileSync(MEMORY_FILE, 'utf-8');
  const entries = content.split(/### \d{4}-\d{2}-\d{2}/).filter(Boolean);
  
  const recent = entries.slice(-count);
  console.log(`\nShowing ${recent.length} most recent entries:\n`);
  recent.forEach(entry => {
    console.log('### ' + entry.trim());
    console.log('---');
  });
}

// Main execution
const action = process.argv[2];

switch (action) {
  case 'capture':
  case 'milestone':
  case 'commit':
  case 'files-changed':
  case 'skill-added':
  case 'deployment':
  case 'debug':
    const context = detectContext(process.argv);
    if (context.summary) {
      appendToMemory(context);
    } else {
      console.log('No context detected. Usage: memory-manager.mjs <action> <detail>');
    }
    break;

  case 'search':
    const query = process.argv[3];
    if (!query) {
      console.log('Usage: memory-manager.mjs search <query>');
    } else {
      searchMemory(query);
    }
    break;

  case 'recent':
    const count = parseInt(process.argv[3]) || 5;
    showRecent(count);
    break;

  case 'help':
  default:
    console.log(`
Context-Driven Memory Manager

Usage:
  node memory-manager.mjs capture <summary>        - Capture custom event
  node memory-manager.mjs milestone <description>  - Record milestone
  node memory-manager.mjs commit                   - Capture git commit
  node memory-manager.mjs files-changed            - Detect changed files
  node memory-manager.mjs skill-added <name>       - Record skill addition
  node memory-manager.mjs deployment <details>     - Record deployment
  node memory-manager.mjs debug <fix-description>  - Record bug fix
  
  node memory-manager.mjs search <query>           - Search memory
  node memory-manager.mjs recent [count]           - Show recent entries
  node memory-manager.mjs help                     - Show this help

Examples:
  node memory-manager.mjs capture "Added AWS infrastructure skills"
  node memory-manager.mjs milestone "Completed v1.0 feature set"
  node memory-manager.mjs deployment "Deployed ML API to ECS Fargate"
  node memory-manager.mjs search "kubernetes"
  node memory-manager.mjs recent 10
    `);
}

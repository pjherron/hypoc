<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# FizzBuzz Session Recorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a containerized web app that generates FizzBuzz sequences and records user sessions with visual replay capability.

**Architecture:** Two-container Docker setup (Node.js + Express + Vue frontend, PostgreSQL database). Vue app uses rrweb for session recording, stores to PostgreSQL, and replays via rrweb-player.

**Tech Stack:** Node.js 22, Express 4.x, Vue 3, rrweb, rrweb-player, PostgreSQL 16, Docker, docker-compose

---

## File Structure

```
fizzbuzz-recorder/
├── docker-compose.yml          # Orchestrates app + db containers
├── Dockerfile                  # Multi-stage build for Node.js app
├── .dockerignore              # Exclude from Docker build
├── .gitignore                 # Exclude from git
├── package.json               # Node.js dependencies
├── package-lock.json          # Lock file (generated)
├── README.md                  # Setup and usage instructions
├── .env.example               # Environment variable template
└── src/
    ├── server.js              # Express app entry point
    ├── routes/
    │   ├── fizzbuzz.js        # POST /api/fizzbuzz endpoint
    │   └── sessions.js        # Session CRUD endpoints
    ├── db/
    │   ├── index.js           # PostgreSQL connection pool
    │   └── schema.sql         # Database initialization
    └── public/
        ├── index.html         # Vue app HTML shell
        ├── app.js             # Vue app + rrweb integration
        └── styles.css         # Basic styling
```

**Responsibilities:**
- `server.js`: HTTP server, middleware, route registration, health check
- `routes/fizzbuzz.js`: Input validation, FizzBuzz generation logic
- `routes/sessions.js`: Save/retrieve sessions and events, transaction handling
- `db/index.js`: PostgreSQL connection pool, query helpers, error handling
- `db/schema.sql`: Table creation, indexes
- `public/index.html`: Vue app mount point, CDN links
- `public/app.js`: Vue components (FizzBuzz form, session viewer), rrweb integration
- `public/styles.css`: Layout and basic styling

---

## Task 1: Project Initialization

**Files:**
- Create: `fizzbuzz-recorder/package.json`
- Create: `fizzbuzz-recorder/.gitignore`
- Create: `fizzbuzz-recorder/.dockerignore`
- Create: `fizzbuzz-recorder/.env.example`
- Create: `fizzbuzz-recorder/README.md`

- [ ] **Step 1: Create project directory**

```bash
cd ${PROJECT_DIR}
mkdir fizzbuzz-recorder
cd fizzbuzz-recorder
```

- [ ] **Step 2: Initialize npm project**

```bash
npm init -y
```

Expected: `package.json` created with default values

- [ ] **Step 3: Install dependencies**

```bash
npm install express@^4.18.0 pg@^8.11.0 dotenv@^16.3.0 cors@^2.8.5
```

Expected: `node_modules/` created, `package-lock.json` generated

- [ ] **Step 4: Create .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
npm-debug.log
.env
.env.*
!.env.example
.DS_Store
*.log
EOF
```

- [ ] **Step 5: Create .dockerignore**

```bash
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
README.md
.DS_Store
docs/
*.md
EOF
```

- [ ] **Step 6: Create .env.example**

```bash
cat > .env.example << 'EOF'
DATABASE_URL=postgresql://fizzbuzz:fizzbuzzpass@db:5432/fizzbuzz
NODE_ENV=production
PORT=8999
EOF
```

- [ ] **Step 7: Create README.md**

```bash
cat > README.md << 'EOF'
# FizzBuzz Session Recorder

Interactive FizzBuzz generator with session recording and replay.

## Features

- Generate FizzBuzz sequences for custom ranges
- Automatic session recording (rrweb)
- Visual session replay
- PostgreSQL persistence
- Dockerized deployment

## Quick Start

```bash
# Start containers
docker-compose up --build

# Access app
http://localhost:8999
```

## Development

```bash
# View logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Reset database
docker-compose down -v
```

## Testing

1. Navigate to http://localhost:8999
2. Enter start/end range (e.g., 1-20)
3. Click "Generate FizzBuzz"
4. Click "View Sessions" to see recordings
5. Click a session to replay

## Health Check

```bash
curl http://localhost:8999/health
```
EOF
```

- [ ] **Step 8: Create src directory structure**

```bash
mkdir -p src/{routes,db,public}
```

- [ ] **Step 9: Commit initialization**

```bash
git init
git add .
git commit -m "chore: initialize FizzBuzz session recorder project"
```

---

## Task 2: Database Schema

**Files:**
- Create: `src/db/schema.sql`

- [ ] **Step 1: Create schema.sql**

```bash
cat > src/db/schema.sql << 'EOF'
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  duration_ms INTEGER NOT NULL,
  event_count INTEGER NOT NULL
);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- Session events table
CREATE TABLE IF NOT EXISTS session_events (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  event_data JSONB NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_timestamp ON session_events(session_id, timestamp);
EOF
```

- [ ] **Step 2: Verify file created**

```bash
cat src/db/schema.sql
```

Expected: SQL schema displayed

- [ ] **Step 3: Commit schema**

```bash
git add src/db/schema.sql
git commit -m "feat: add database schema for sessions and events"
```

---

## Task 3: Database Connection Pool

**Files:**
- Create: `src/db/index.js`

- [ ] **Step 1: Create db/index.js with connection pool**

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Query helper
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', { text, params, error: error.message });
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
async function healthCheck() {
  try {
    const result = await query('SELECT NOW()');
    return { healthy: true, timestamp: result.rows[0].now };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

// Graceful shutdown
async function close() {
  await pool.end();
  console.log('Database pool closed');
}

module.exports = {
  query,
  transaction,
  healthCheck,
  close,
};
```

Write to `src/db/index.js`

- [ ] **Step 2: Verify file syntax**

```bash
node -c src/db/index.js
```

Expected: No output (syntax OK)

- [ ] **Step 3: Commit database layer**

```bash
git add src/db/index.js
git commit -m "feat: add PostgreSQL connection pool and query helpers"
```

---

## Task 4: FizzBuzz Route

**Files:**
- Create: `src/routes/fizzbuzz.js`

- [ ] **Step 1: Create routes/fizzbuzz.js**

```javascript
const express = require('express');
const router = express.Router();

// Generate FizzBuzz sequence
function generateFizzBuzz(start, end) {
  const results = [];
  for (let i = start; i <= end; i++) {
    if (i % 15 === 0) {
      results.push('FizzBuzz');
    } else if (i % 3 === 0) {
      results.push('Fizz');
    } else if (i % 5 === 0) {
      results.push('Buzz');
    } else {
      results.push(String(i));
    }
  }
  return results;
}

// POST /api/fizzbuzz
router.post('/', (req, res) => {
  const { start, end } = req.body;

  // Validate input
  if (typeof start !== 'number' || typeof end !== 'number') {
    return res.status(400).json({ error: 'Start and end must be numbers' });
  }

  if (start < 1 || end < 1) {
    return res.status(400).json({ error: 'Start and end must be positive integers' });
  }

  if (end < start) {
    return res.status(400).json({ error: 'End must be greater than or equal to start' });
  }

  const rangeSize = end - start + 1;
  if (rangeSize > 1000) {
    return res.status(400).json({ error: 'Range cannot exceed 1000 numbers' });
  }

  // Generate FizzBuzz
  try {
    const results = generateFizzBuzz(start, end);
    res.json({ results });
  } catch (error) {
    console.error('FizzBuzz generation error:', error);
    res.status(500).json({ error: 'Failed to generate FizzBuzz sequence' });
  }
});

module.exports = router;
```

Write to `src/routes/fizzbuzz.js`

- [ ] **Step 2: Verify file syntax**

```bash
node -c src/routes/fizzbuzz.js
```

Expected: No output (syntax OK)

- [ ] **Step 3: Commit FizzBuzz route**

```bash
git add src/routes/fizzbuzz.js
git commit -m "feat: add FizzBuzz generation endpoint with validation"
```

---

## Task 5: Sessions Route

**Files:**
- Create: `src/routes/sessions.js`

- [ ] **Step 1: Create routes/sessions.js**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/sessions - Save recorded session
router.post('/', async (req, res) => {
  const { events, duration_ms, event_count } = req.body;

  // Validate input
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Events array is required' });
  }

  if (typeof duration_ms !== 'number' || typeof event_count !== 'number') {
    return res.status(400).json({ error: 'duration_ms and event_count must be numbers' });
  }

  try {
    // Use transaction to ensure atomicity
    const result = await db.transaction(async (client) => {
      // Insert session metadata
      const sessionResult = await client.query(
        'INSERT INTO sessions (duration_ms, event_count) VALUES ($1, $2) RETURNING id, created_at',
        [duration_ms, event_count]
      );
      const session = sessionResult.rows[0];

      // Batch insert events
      const eventValues = events.map((event, index) => {
        return `(${session.id}, ${event.timestamp}, '${JSON.stringify(event).replace(/'/g, "''")}'::jsonb)`;
      }).join(',');

      await client.query(
        `INSERT INTO session_events (session_id, timestamp, event_data) VALUES ${eventValues}`
      );

      return session;
    });

    res.status(201).json({ session: result });
  } catch (error) {
    console.error('Save session error:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions - List all sessions
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, created_at, duration_ms, event_count FROM sessions ORDER BY created_at DESC'
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// GET /api/sessions/:id - Get session with events
router.get('/:id', async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);

  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    // Get session metadata
    const sessionResult = await db.query(
      'SELECT id, created_at, duration_ms, event_count FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Get session events
    const eventsResult = await db.query(
      'SELECT timestamp, event_data FROM session_events WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );

    const events = eventsResult.rows.map(row => row.event_data);

    res.json({ session, events });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

module.exports = router;
```

Write to `src/routes/sessions.js`

- [ ] **Step 2: Verify file syntax**

```bash
node -c src/routes/sessions.js
```

Expected: No output (syntax OK)

- [ ] **Step 3: Commit sessions route**

```bash
git add src/routes/sessions.js
git commit -m "feat: add session CRUD endpoints with transaction support"
```

---

## Task 6: Express Server

**Files:**
- Create: `src/server.js`

- [ ] **Step 1: Create server.js**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const fizzbuzzRouter = require('./routes/fizzbuzz');
const sessionsRouter = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 8999;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large limit for session events
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await db.healthCheck();
  
  if (dbHealth.healthy) {
    res.json({ status: 'ok', database: dbHealth });
  } else {
    res.status(503).json({ status: 'unhealthy', database: dbHealth });
  }
});

// API routes
app.use('/api/fizzbuzz', fizzbuzzRouter);
app.use('/api/sessions', sessionsRouter);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await db.close();
  process.exit(0);
});
```

Write to `src/server.js`

- [ ] **Step 2: Verify file syntax**

```bash
node -c src/server.js
```

Expected: No output (syntax OK)

- [ ] **Step 3: Commit Express server**

```bash
git add src/server.js
git commit -m "feat: add Express server with routes and health check"
```

---

## Task 7: Frontend HTML Shell

**Files:**
- Create: `src/public/index.html`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FizzBuzz Session Recorder</title>
  <link rel="stylesheet" href="styles.css">
  <!-- Vue 3 from CDN -->
  <script src="https://unpkg.com/vue@3.3.4/dist/vue.global.prod.js"></script>
  <!-- rrweb from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>
  <!-- rrweb-player from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/index.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/style.css">
</head>
<body>
  <div id="app">
    <header>
      <h1>FizzBuzz Session Recorder</h1>
    </header>

    <!-- FizzBuzz View -->
    <div v-if="currentView === 'fizzbuzz'" class="fizzbuzz-view">
      <div class="input-section">
        <h2>Generate FizzBuzz</h2>
        <div class="form-group">
          <label for="start">Start:</label>
          <input 
            type="number" 
            id="start" 
            v-model.number="start" 
            min="1" 
            placeholder="1"
          >
        </div>
        <div class="form-group">
          <label for="end">End:</label>
          <input 
            type="number" 
            id="end" 
            v-model.number="end" 
            min="1" 
            placeholder="100"
          >
        </div>
        <button @click="generateFizzBuzz" :disabled="!isValidInput">
          Generate FizzBuzz
        </button>
        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div v-if="results.length > 0" class="results-section">
        <h3>Results ({{ start }} - {{ end }}):</h3>
        <div class="results-grid">
          <div v-for="(result, index) in results" :key="index" class="result-item">
            {{ result }}
          </div>
        </div>
      </div>

      <button @click="switchToSessions" class="view-toggle">
        View Sessions
      </button>
    </div>

    <!-- Sessions View -->
    <div v-if="currentView === 'sessions'" class="sessions-view">
      <h2>Recorded Sessions</h2>
      
      <div v-if="!selectedSession" class="sessions-list">
        <div v-if="sessions.length === 0" class="empty-state">
          No sessions recorded yet. Use the FizzBuzz generator to create one!
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>ID</th>
              <th>Created</th>
              <th>Duration</th>
              <th>Events</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id">
              <td>{{ session.id }}</td>
              <td>{{ formatDate(session.created_at) }}</td>
              <td>{{ formatDuration(session.duration_ms) }}</td>
              <td>{{ session.event_count }}</td>
              <td>
                <button @click="loadSession(session.id)">Replay</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selectedSession" class="session-player">
        <h3>Replaying Session #{{ selectedSession.id }}</h3>
        <div id="player-container"></div>
        <button @click="closePlayer">Close Player</button>
      </div>

      <button @click="switchToFizzBuzz" class="view-toggle">
        Back to FizzBuzz
      </button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

Write to `src/public/index.html`

- [ ] **Step 2: Verify file created**

```bash
cat src/public/index.html | head -20
```

Expected: HTML header displayed

- [ ] **Step 3: Commit HTML shell**

```bash
git add src/public/index.html
git commit -m "feat: add HTML shell with Vue app structure"
```

---

## Task 8: Frontend Vue App

**Files:**
- Create: `src/public/app.js`

- [ ] **Step 1: Create app.js with Vue app**

```javascript
const { createApp } = Vue;

createApp({
  data() {
    return {
      currentView: 'fizzbuzz', // 'fizzbuzz' or 'sessions'
      start: 1,
      end: 100,
      results: [],
      error: null,
      sessions: [],
      selectedSession: null,
      recordingStartTime: null,
      recordedEvents: [],
      stopRecordingFn: null,
    };
  },
  computed: {
    isValidInput() {
      return (
        typeof this.start === 'number' &&
        typeof this.end === 'number' &&
        this.start >= 1 &&
        this.end >= 1 &&
        this.end >= this.start &&
        (this.end - this.start + 1) <= 1000
      );
    },
  },
  methods: {
    // FizzBuzz generation
    async generateFizzBuzz() {
      this.error = null;
      
      if (!this.isValidInput) {
        this.error = 'Invalid input. Check start/end values.';
        return;
      }

      try {
        const response = await fetch('/api/fizzbuzz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: this.start, end: this.end }),
        });

        if (!response.ok) {
          const data = await response.json();
          this.error = data.error || 'Failed to generate FizzBuzz';
          return;
        }

        const data = await response.json();
        this.results = data.results;
      } catch (err) {
        console.error('FizzBuzz error:', err);
        this.error = 'Network error. Please try again.';
      }
    },

    // View switching
    async switchToSessions() {
      this.currentView = 'sessions';
      await this.loadSessions();
    },

    switchToFizzBuzz() {
      this.currentView = 'fizzbuzz';
      this.selectedSession = null;
    },

    // Session management
    async loadSessions() {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) throw new Error('Failed to load sessions');
        
        const data = await response.json();
        this.sessions = data.sessions;
      } catch (err) {
        console.error('Load sessions error:', err);
        this.error = 'Failed to load sessions';
      }
    },

    async loadSession(sessionId) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) throw new Error('Failed to load session');
        
        const data = await response.json();
        this.selectedSession = data.session;
        
        // Initialize rrweb player
        this.$nextTick(() => {
          const container = document.getElementById('player-container');
          container.innerHTML = ''; // Clear previous player
          
          new rrwebPlayer({
            target: container,
            props: {
              events: data.events,
              width: 800,
              height: 600,
            },
          });
        });
      } catch (err) {
        console.error('Load session error:', err);
        this.error = 'Failed to load session replay';
      }
    },

    closePlayer() {
      this.selectedSession = null;
    },

    // Utility
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    formatDuration(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return minutes > 0 
        ? `${minutes}m ${remainingSeconds}s` 
        : `${seconds}s`;
    },

    // Session recording
    startRecording() {
      this.recordingStartTime = Date.now();
      this.recordedEvents = [];

      this.stopRecordingFn = rrweb.record({
        emit: (event) => {
          this.recordedEvents.push(event);
        },
      });

      console.log('Session recording started');

      // Auto-save every 10 seconds
      this.saveInterval = setInterval(() => {
        this.saveSession();
      }, 10000);
    },

    async saveSession() {
      if (this.recordedEvents.length === 0) return;

      const duration_ms = Date.now() - this.recordingStartTime;
      const event_count = this.recordedEvents.length;

      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: this.recordedEvents,
            duration_ms,
            event_count,
          }),
        });

        if (response.ok) {
          console.log('Session saved successfully');
          // Reset for next batch
          this.recordedEvents = [];
          this.recordingStartTime = Date.now();
        }
      } catch (err) {
        console.error('Save session error:', err);
      }
    },

    stopRecording() {
      if (this.stopRecordingFn) {
        this.stopRecordingFn();
        this.stopRecordingFn = null;
      }
      if (this.saveInterval) {
        clearInterval(this.saveInterval);
        this.saveInterval = null;
      }
      // Save remaining events
      this.saveSession();
      console.log('Session recording stopped');
    },
  },
  mounted() {
    // Start recording on page load
    this.startRecording();

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.stopRecording();
    });
  },
}).mount('#app');
```

Write to `src/public/app.js`

- [ ] **Step 2: Verify file syntax**

```bash
node -c src/public/app.js
```

Expected: No output (syntax OK)

- [ ] **Step 3: Commit Vue app**

```bash
git add src/public/app.js
git commit -m "feat: add Vue app with FizzBuzz and session replay"
```

---

## Task 9: Frontend Styles

**Files:**
- Create: `src/public/styles.css`

- [ ] **Step 1: Create styles.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
  color: #333;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

header h1 {
  color: white;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

#app {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 30px;
  min-height: 600px;
}

.input-section {
  margin-bottom: 30px;
}

.input-section h2 {
  margin-bottom: 20px;
  color: #667eea;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: inline-block;
  width: 60px;
  font-weight: 600;
  color: #555;
}

.form-group input {
  padding: 10px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  width: 200px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: #667eea;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s, transform 0.1s;
}

button:hover {
  background: #5568d3;
}

button:active {
  transform: scale(0.98);
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.view-toggle {
  margin-top: 30px;
  background: #764ba2;
}

.view-toggle:hover {
  background: #653a8a;
}

.error {
  margin-top: 15px;
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
  font-weight: 600;
}

.results-section {
  margin-top: 30px;
}

.results-section h3 {
  margin-bottom: 15px;
  color: #667eea;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.result-item {
  padding: 15px;
  background: white;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sessions-view h2 {
  margin-bottom: 20px;
  color: #667eea;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

table th {
  background: #667eea;
  color: white;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

table tr:hover {
  background: #f9f9f9;
}

table button {
  padding: 6px 12px;
  font-size: 14px;
}

.session-player {
  margin-top: 20px;
}

.session-player h3 {
  margin-bottom: 15px;
  color: #667eea;
}

#player-container {
  margin: 20px 0;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}
```

Write to `src/public/styles.css`

- [ ] **Step 2: Verify file created**

```bash
wc -l src/public/styles.css
```

Expected: Line count displayed

- [ ] **Step 3: Commit styles**

```bash
git add src/public/styles.css
git commit -m "feat: add frontend styles with gradient background"
```

---

## Task 10: Docker Configuration

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Stage 2: Production
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup ./src ./src
COPY --chown=appuser:appgroup package.json ./

# Environment
ENV NODE_ENV=production
ENV PORT=8999

EXPOSE 8999

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8999/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/server.js"]
```

Write to `Dockerfile`

- [ ] **Step 2: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: fizzbuzz-app
    ports:
      - "8999:8999"
    environment:
      - DATABASE_URL=postgresql://fizzbuzz:fizzbuzzpass@db:5432/fizzbuzz
      - NODE_ENV=production
      - PORT=8999
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - fizzbuzz-network

  db:
    image: postgres:16-alpine
    container_name: fizzbuzz-db
    environment:
      - POSTGRES_USER=fizzbuzz
      - POSTGRES_PASSWORD=fizzbuzzpass
      - POSTGRES_DB=fizzbuzz
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fizzbuzz"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - fizzbuzz-network

volumes:
  postgres_data:
    driver: local

networks:
  fizzbuzz-network:
    driver: bridge
```

Write to `docker-compose.yml`

- [ ] **Step 3: Verify Docker files syntax**

```bash
docker-compose config
```

Expected: Parsed YAML output (validates syntax)

- [ ] **Step 4: Commit Docker configuration**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: add Docker configuration for multi-container deployment"
```

---

## Task 11: Build and Test

**Files:**
- Test: All components integrated

- [ ] **Step 1: Build Docker containers**

```bash
docker-compose build
```

Expected: Both images built successfully (fizzbuzz-app, postgres:16-alpine)

- [ ] **Step 2: Start containers**

```bash
docker-compose up -d
```

Expected: Two containers running (fizzbuzz-app, fizzbuzz-db)

- [ ] **Step 3: Check container status**

```bash
docker-compose ps
```

Expected: Both containers in "Up" state

- [ ] **Step 4: View app logs**

```bash
docker-compose logs app
```

Expected: "Server running on http://localhost:8999"

- [ ] **Step 5: Test health check endpoint**

```bash
curl http://localhost:8999/health
```

Expected: `{"status":"ok","database":{"healthy":true,"timestamp":"..."}}`

- [ ] **Step 6: Test in browser**

Open browser to `http://localhost:8999`

Expected: FizzBuzz form displayed with purple gradient background

- [ ] **Step 7: Test FizzBuzz generation**

In browser:
1. Enter start=1, end=15
2. Click "Generate FizzBuzz"

Expected: Results displayed: 1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz

- [ ] **Step 8: Test session recording**

In browser:
1. Perform various actions (type, click, scroll)
2. Wait 10 seconds (auto-save trigger)
3. Click "View Sessions"

Expected: At least one session listed

- [ ] **Step 9: Test session replay**

In browser:
1. Click "Replay" on a session
2. Observe rrweb player

Expected: Visual replay of interactions in player

- [ ] **Step 10: Test input validation**

In browser:
1. Enter start=100, end=50
2. Click "Generate FizzBuzz"

Expected: Error message "End must be greater than or equal to start"

- [ ] **Step 11: Test database persistence**

```bash
# Stop containers
docker-compose down

# Start again
docker-compose up -d

# Open browser to http://localhost:8999
# Click "View Sessions"
```

Expected: Previously recorded sessions still exist

- [ ] **Step 12: Check database directly**

```bash
docker exec -it fizzbuzz-db psql -U fizzbuzz -d fizzbuzz -c "SELECT COUNT(*) FROM sessions;"
```

Expected: Count of sessions > 0

- [ ] **Step 13: Stop containers**

```bash
docker-compose down
```

Expected: Containers stopped and removed

---

## Task 12: Documentation and Final Commit

**Files:**
- Update: `README.md`

- [ ] **Step 1: Update README with complete instructions**

```bash
cat > README.md << 'EOF'
# FizzBuzz Session Recorder

Interactive FizzBuzz generator with automatic session recording and visual replay capabilities.

## Features

✅ Generate FizzBuzz sequences for custom ranges (1-1000)
✅ Automatic session recording using rrweb
✅ Visual session replay with playback controls
✅ PostgreSQL persistence across container restarts
✅ Simple toggle interface between FizzBuzz and Sessions view
✅ Dockerized deployment with docker-compose

## Architecture

- **Frontend**: Vue 3 (CDN), rrweb, rrweb-player
- **Backend**: Node.js 22, Express 4.x
- **Database**: PostgreSQL 16 (alpine)
- **Infrastructure**: Docker, docker-compose

## Quick Start

### Prerequisites

- Docker 20+
- docker-compose v2

### Setup

```bash
# Clone or navigate to project
cd fizzbuzz-recorder

# Build and start containers
docker-compose up --build

# Access application
http://localhost:8999
```

## Usage

### Generate FizzBuzz

1. Navigate to http://localhost:8999
2. Enter start and end numbers (e.g., 1 to 20)
3. Click "Generate FizzBuzz"
4. View results in the grid

### View Recorded Sessions

1. Click "View Sessions" button
2. See list of all recorded sessions
3. Click "Replay" on any session
4. Watch visual replay with controls

### Input Validation

- Start and end must be positive integers
- End must be >= start
- Range limited to 1000 numbers max
- Helpful error messages for invalid input

## Development

### View Logs

```bash
# App logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# All logs
docker-compose logs -f
```

### Restart Containers

```bash
docker-compose restart app
```

### Stop Containers

```bash
docker-compose down
```

### Reset Database

```bash
# Warning: Deletes all sessions
docker-compose down -v
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

## Testing

### Health Check

```bash
curl http://localhost:8999/health
```

Expected: `{"status":"ok","database":{"healthy":true,...}}`

### Manual Testing Checklist

1. **FizzBuzz Generation**
   - Generate sequence 1-15
   - Verify correct output (1, 2, Fizz, 4, Buzz, Fizz, ...)

2. **Input Validation**
   - Try end < start → error
   - Try range > 1000 → error
   - Try negative numbers → error

3. **Session Recording**
   - Perform various actions
   - Wait 10 seconds
   - Check browser console for save confirmation

4. **Session Replay**
   - Switch to Sessions view
   - Click "Replay" on a session
   - Verify visual reconstruction

5. **Persistence**
   - Record sessions
   - Stop containers: `docker-compose down`
   - Start containers: `docker-compose up`
   - Verify sessions still exist

### Database Access (Debugging)

```bash
# Connect to PostgreSQL
docker exec -it fizzbuzz-db psql -U fizzbuzz -d fizzbuzz

# View sessions
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10;

# View events for a session
SELECT COUNT(*) FROM session_events WHERE session_id = 1;

# Exit psql
\q
```

## Project Structure

```
fizzbuzz-recorder/
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # Multi-stage Node.js build
├── package.json               # Dependencies
├── README.md                  # This file
└── src/
    ├── server.js              # Express server
    ├── routes/
    │   ├── fizzbuzz.js        # FizzBuzz endpoint
    │   └── sessions.js        # Session CRUD
    ├── db/
    │   ├── index.js           # PostgreSQL pool
    │   └── schema.sql         # Database schema
    └── public/
        ├── index.html         # Vue app shell
        ├── app.js             # Vue logic + rrweb
        └── styles.css         # Styling
```

## API Endpoints

### POST /api/fizzbuzz

Generate FizzBuzz sequence.

**Request:**
```json
{
  "start": 1,
  "end": 100
}
```

**Response:**
```json
{
  "results": ["1", "2", "Fizz", "4", "Buzz", ...]
}
```

### GET /api/sessions

List all recorded sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": 1,
      "created_at": "2026-04-17T10:30:00Z",
      "duration_ms": 45000,
      "event_count": 120
    }
  ]
}
```

### GET /api/sessions/:id

Get session details and events for replay.

**Response:**
```json
{
  "session": {
    "id": 1,
    "created_at": "2026-04-17T10:30:00Z",
    "duration_ms": 45000,
    "event_count": 120
  },
  "events": [...]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "database": {
    "healthy": true,
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

## Troubleshooting

### Port 8999 already in use

Change port in `docker-compose.yml`:
```yaml
ports:
  - "9000:8999"  # Host:Container
```

### Containers won't start

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Database connection error

```bash
# Verify database is healthy
docker-compose ps

# Check database logs
docker-compose logs db
```

### Sessions not persisting

Ensure volume is properly mounted:
```bash
docker volume ls | grep fizzbuzz
```

## Contributing

This is a demo project. Feel free to fork and extend!

## License

MIT
EOF
```

- [ ] **Step 2: Final commit**

```bash
git add README.md
git commit -m "docs: update README with complete setup and usage instructions"
```

- [ ] **Step 3: Create final tag**

```bash
git tag -a v1.0.0 -m "Initial release: FizzBuzz Session Recorder"
```

- [ ] **Step 4: Verify all files committed**

```bash
git status
```

Expected: "working tree clean"

---

## Self-Review

### Spec Coverage Check

✅ **Interactive FizzBuzz generator** - Task 4, 7, 8 (routes/fizzbuzz.js, HTML form, Vue methods)
✅ **Custom range input** - Task 7, 8 (input fields with validation)
✅ **Automatic session recording** - Task 8 (rrweb integration in app.js)
✅ **Visual replay** - Task 7, 8 (rrweb-player in sessions view)
✅ **Containerized deployment** - Task 10 (Dockerfile, docker-compose.yml)
✅ **PostgreSQL persistence** - Task 2, 3, 5 (schema, connection, routes)
✅ **Toggle interface** - Task 7, 8 (View switching buttons and logic)
✅ **Port 8999** - Task 10 (docker-compose.yml, server.js)
✅ **Health check endpoint** - Task 6 (server.js /health route)
✅ **Input validation** - Task 4, 8 (server-side and client-side)
✅ **Error handling** - Task 4, 5, 6, 8 (validation, try-catch, error responses)
✅ **Database schema** - Task 2 (sessions, session_events tables)
✅ **Transaction support** - Task 5 (db.transaction for session saves)

### Placeholder Scan

No placeholders found:
- All code blocks contain complete implementations
- No "TBD", "TODO", "implement later" text
- All error handling explicitly defined
- All test steps include expected output
- All file paths are exact and complete

### Type Consistency Check

✅ `start`, `end` - consistent as numbers throughout
✅ `duration_ms`, `event_count` - consistent as integers
✅ `events` - consistent as array of objects
✅ `currentView` - consistent as 'fizzbuzz' | 'sessions'
✅ API response structures match across frontend/backend
✅ Database column names match query parameters

**All checks passed. Plan is complete and ready for execution.**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-17-fizzbuzz-session-recorder.md`. 

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

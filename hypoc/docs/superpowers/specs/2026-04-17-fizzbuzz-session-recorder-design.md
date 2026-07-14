# FizzBuzz Web App with Session Recorder - Design Document

**Date:** 2026-04-17  
**Author:** OpenCode AI  
**Status:** Approved for Implementation

## Overview

A containerized web application that generates FizzBuzz sequences for user-specified ranges and records all user sessions with visual replay capability. Runs locally in Docker with no authentication required.

## Goals

- Interactive FizzBuzz generator with custom range input
- Automatic session recording of all user interactions
- Visual replay of recorded sessions (DOM reconstruction)
- Containerized deployment with docker-compose
- PostgreSQL persistence across container restarts
- Simple toggle interface between FizzBuzz and session viewer

## Non-Goals

- Authentication/authorization
- Multi-user session isolation
- Production deployment configuration
- Session sharing or export features
- Real-time collaboration

## Architecture

### System Overview

**Two-container setup via docker-compose:**

1. **App Container**
   - Node.js 22 + Express backend
   - Vue 3 frontend (single-page app)
   - rrweb session recording library
   - Serves static assets and API endpoints
   - Exposed on host port 8999

2. **Database Container**
   - PostgreSQL 16 (alpine)
   - Internal Docker network only (no host exposure)
   - Persistent volume for data
   - Stores session metadata and recorded events

**Network Communication:**
- App → DB: Internal Docker network (`db:5432`)
- User → App: `http://localhost:8999`
- No external database dependencies

### Technology Stack

**Frontend:**
- Vue 3 (Composition API)
- rrweb (session recording)
- rrweb-player (session replay)
- Vanilla CSS (minimal styling)

**Backend:**
- Node.js 22 (alpine base image)
- Express 4.x
- pg (node-postgres client)
- dotenv (environment configuration)

**Database:**
- PostgreSQL 16 (alpine)
- JSONB for event storage
- Indexed queries for performance

**Infrastructure:**
- Docker 20+
- docker-compose v2

## Component Design

### Frontend Components

#### 1. Main App Component (`app.js`)

**Responsibilities:**
- Top-level Vue app initialization
- View mode state management (FizzBuzz vs Sessions)
- rrweb recording initialization and lifecycle
- API communication layer

**State:**
```javascript
{
  currentView: 'fizzbuzz' | 'sessions',
  isRecording: boolean,
  sessionId: number | null,
  recordedEvents: array
}
```

**Methods:**
- `startRecording()` - Initialize rrweb on page load
- `stopRecording()` - End recording, send to backend
- `toggleView()` - Switch between FizzBuzz and Sessions
- `sendSessionData()` - POST events to API

#### 2. FizzBuzz Component

**UI Elements:**
- Input: Start number (number input, min=1)
- Input: End number (number input, min=1, max=10000)
- Button: "Generate FizzBuzz"
- Display: Results area (scrollable list)
- Button: "View Sessions" (switches to replay viewer)

**Validation:**
- Start and end must be positive integers
- End must be >= start
- Range limited to 1000 numbers maximum
- Display validation errors inline

**API Call:**
```javascript
POST /api/fizzbuzz
Body: { start: 1, end: 100 }
Response: { results: ["1", "2", "Fizz", "4", "Buzz", ...] }
```

#### 3. Session Replay Viewer Component

**UI Elements:**
- Session list (table/cards):
  - Session ID
  - Timestamp (created_at)
  - Duration
  - Event count
- Click to select session for replay
- Replay player area (rrweb-player component)
- Playback controls (play/pause, speed, progress bar)
- Button: "Back to FizzBuzz"

**API Calls:**
```javascript
GET /api/sessions
Response: { sessions: [{ id, created_at, duration_ms, event_count }] }

GET /api/sessions/:id
Response: { session: { id, created_at }, events: [...rrweb events] }
```

### Backend Components

#### 1. Express Server (`server.js`)

**Responsibilities:**
- HTTP server initialization
- Middleware setup (JSON parser, CORS, static files)
- Route registration
- Database connection management
- Health check endpoint

**Middleware Stack:**
```javascript
express.json()              // Parse JSON bodies
express.static('public')    // Serve Vue app
cors()                      // Allow cross-origin (dev)
errorHandler               // Centralized error handling
```

**Endpoints:**
```
GET  /                    -> Serve index.html
GET  /health             -> Health check
POST /api/fizzbuzz       -> Generate FizzBuzz
POST /api/sessions       -> Save session recording
GET  /api/sessions       -> List all sessions
GET  /api/sessions/:id   -> Get session details + events
```

#### 2. FizzBuzz Route (`routes/fizzbuzz.js`)

**Input Validation:**
```javascript
{
  start: integer, min: 1, required
  end: integer, min: 1, max: 10000, required
  constraint: end >= start
  constraint: (end - start + 1) <= 1000
}
```

**Business Logic:**
```javascript
function generateFizzBuzz(start, end) {
  const results = [];
  for (let i = start; i <= end; i++) {
    if (i % 15 === 0) results.push('FizzBuzz');
    else if (i % 3 === 0) results.push('Fizz');
    else if (i % 5 === 0) results.push('Buzz');
    else results.push(String(i));
  }
  return results;
}
```

**Error Responses:**
- 400: Invalid input (missing fields, wrong types)
- 400: Range too large (> 1000 numbers)
- 400: End < start
- 500: Server error

#### 3. Sessions Route (`routes/sessions.js`)

**POST /api/sessions** - Save recorded session

**Input:**
```javascript
{
  events: array of rrweb events,
  duration_ms: integer,
  event_count: integer
}
```

**Process:**
1. Begin database transaction
2. Insert into `sessions` table (created_at, duration_ms, event_count)
3. Batch insert events into `session_events` table
4. Commit transaction
5. Return session ID

**GET /api/sessions** - List all sessions

**Response:**
```javascript
{
  sessions: [
    {
      id: 1,
      created_at: "2026-04-17T10:30:00Z",
      duration_ms: 45000,
      event_count: 120
    }
  ]
}
```

**GET /api/sessions/:id** - Get session with events

**Response:**
```javascript
{
  session: {
    id: 1,
    created_at: "2026-04-17T10:30:00Z",
    duration_ms: 45000,
    event_count: 120
  },
  events: [
    { timestamp: 1234567890, type: 2, data: {...} },
    // ... all rrweb events
  ]
}
```

#### 4. Database Layer (`db/index.js`)

**PostgreSQL Connection Pool:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**Query Functions:**
- `query(sql, params)` - Execute parameterized query
- `transaction(callback)` - Execute in transaction
- `healthCheck()` - Verify database connectivity

**Error Handling:**
- Connection failures logged and re-thrown
- Query errors include context (SQL, params)
- Automatic connection retry on transient failures

## Database Schema

### Tables

**sessions**
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  duration_ms INTEGER NOT NULL,
  event_count INTEGER NOT NULL
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
```

**session_events**
```sql
CREATE TABLE session_events (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  event_data JSONB NOT NULL
);

CREATE INDEX idx_session_events_session_id ON session_events(session_id);
CREATE INDEX idx_session_events_timestamp ON session_events(session_id, timestamp);
```

### Initialization

Schema automatically applied via `docker-entrypoint-initdb.d/schema.sql` on first container start.

## Data Flow

### FizzBuzz Generation Flow

1. User enters start=1, end=20 in form
2. Frontend validates input (client-side)
3. POST /api/fizzbuzz with `{ start: 1, end: 20 }`
4. Backend validates input (server-side)
5. Generate FizzBuzz sequence (array of 20 strings)
6. Return `{ results: [...] }`
7. Frontend renders results in scrollable list

### Session Recording Flow

**Recording Phase:**

1. Page loads → rrweb.record() starts automatically
2. rrweb captures:
   - Initial DOM snapshot (full page state)
   - All mutations (text changes, DOM updates)
   - User interactions (mouse clicks, keyboard input, form submissions)
   - Scroll events
   - Viewport changes
3. Events buffered in memory (array)
4. Every 10 seconds OR on page unload:
   - Calculate duration_ms and event_count
   - POST /api/sessions with buffered events
   - Backend saves to database
   - Clear buffer, continue recording

**Replay Phase:**

1. User clicks "View Sessions"
2. Frontend switches to Sessions view
3. Fetch GET /api/sessions → display list
4. User clicks a session row
5. Fetch GET /api/sessions/:id → retrieve events
6. Initialize rrweb-player with events
7. Player reconstructs DOM and replays interactions
8. User controls playback (play/pause, speed, seek)

## Error Handling

### Input Validation Errors

**Client-side:**
- Inline form validation (red borders, error text)
- Disable submit button until valid

**Server-side:**
- 400 Bad Request with descriptive message
- Example: `{ error: "End must be greater than or equal to start" }`

### Session Recording Errors

**Recording failure:**
- Log error to console
- Display non-blocking notification to user
- Continue normal app functionality (recording optional)

**Save failure:**
- Retry once after 2 seconds
- If still fails, log error and discard
- Don't block user experience

**Fetch failure (replay):**
- Display friendly error message
- "Unable to load session. Please try again."
- Provide "Retry" button

### Database Errors

**Connection failure:**
- Health check returns 503 Service Unavailable
- Log full error details server-side
- Return generic error to client

**Query failure:**
- Rollback transaction if in progress
- Log error with query context
- Return 500 Internal Server Error

**Missing data:**
- Return 404 Not Found for invalid session ID
- Empty array for no sessions

## Docker Configuration

### docker-compose.yml

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

volumes:
  postgres_data:
    driver: local
```

### Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Stage 2: Build (if needed for bundling)
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No build step needed (Vue served as static files)

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup ./src ./src
COPY --chown=appuser:appgroup package.json ./

ENV NODE_ENV=production
ENV PORT=8999

EXPOSE 8999

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8999/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/server.js"]
```

### .dockerignore

```
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
```

## Project Structure

```
fizzbuzz-recorder/
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── .env.example
└── src/
    ├── server.js                 # Express app entry point
    ├── routes/
    │   ├── fizzbuzz.js           # POST /api/fizzbuzz
    │   └── sessions.js           # Session CRUD endpoints
    ├── db/
    │   ├── index.js              # PostgreSQL connection pool
    │   └── schema.sql            # Database initialization
    └── public/
        ├── index.html            # Vue app HTML shell
        ├── app.js                # Vue app + rrweb integration
        └── styles.css            # Basic styling
```

## Development Workflow

### Initial Setup

```bash
# Clone or create project directory
mkdir fizzbuzz-recorder && cd fizzbuzz-recorder

# Initialize npm project
npm init -y

# Install dependencies
npm install express pg dotenv cors

# Create directory structure
mkdir -p src/{routes,db,public}

# Build and start containers
docker-compose up --build
```

### Development Commands

```bash
# Start containers (foreground)
docker-compose up

# Start containers (background)
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f db

# Restart app container
docker-compose restart app

# Stop containers
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build
```

### Testing the Application

**Manual Testing Checklist:**

1. **FizzBuzz Generation:**
   - [ ] Navigate to `http://localhost:8999`
   - [ ] Enter start=1, end=15
   - [ ] Click "Generate FizzBuzz"
   - [ ] Verify correct output: 1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz

2. **Input Validation:**
   - [ ] Try end < start → error message
   - [ ] Try range > 1000 → error message
   - [ ] Try negative numbers → error message
   - [ ] Try non-numeric input → error message

3. **Session Recording:**
   - [ ] Perform actions (type, click, scroll)
   - [ ] Check browser console for rrweb activity
   - [ ] Verify no errors in recording

4. **Session Replay:**
   - [ ] Click "View Sessions" button
   - [ ] Verify session list displays
   - [ ] Click a session to replay
   - [ ] Verify visual replay reconstructs interactions
   - [ ] Test playback controls (play/pause, speed)
   - [ ] Click "Back to FizzBuzz"

5. **Container Restart:**
   - [ ] Generate FizzBuzz, record session
   - [ ] Stop containers: `docker-compose down`
   - [ ] Start containers: `docker-compose up`
   - [ ] Verify session persists in database

6. **Health Check:**
   - [ ] Visit `http://localhost:8999/health`
   - [ ] Verify `{ status: "ok" }` response

### Database Access (Debugging)

```bash
# Connect to PostgreSQL container
docker exec -it fizzbuzz-db psql -U fizzbuzz -d fizzbuzz

# View sessions
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10;

# View events for session
SELECT COUNT(*) FROM session_events WHERE session_id = 1;

# Exit psql
\q
```

## Success Criteria

### Functional Requirements

✅ User can enter a start/end range and generate FizzBuzz sequence  
✅ FizzBuzz logic correctly handles multiples of 3, 5, and 15  
✅ Input validation prevents invalid ranges  
✅ All user interactions are recorded automatically via rrweb  
✅ Sessions are saved to PostgreSQL with metadata and events  
✅ User can view a list of all recorded sessions  
✅ User can replay any session with visual DOM reconstruction  
✅ Toggle button switches between FizzBuzz and Sessions view  

### Technical Requirements

✅ Application runs in Docker containers via docker-compose  
✅ App exposed on port 8999 (verified available)  
✅ PostgreSQL runs in separate container (internal network only)  
✅ Database persists data across container restarts (volume mounted)  
✅ Health check endpoint returns 200 OK  
✅ No authentication required (open access)  
✅ Clean project structure with separation of concerns  

### Non-Functional Requirements

✅ Simple one-command startup: `docker-compose up`  
✅ Graceful error handling (no crashes on invalid input)  
✅ Responsive UI (forms, buttons work intuitively)  
✅ Minimal dependencies (no unnecessary libraries)  
✅ Clear README with setup instructions  

## Future Enhancements (Out of Scope)

- User authentication and session isolation
- Session sharing via links
- Export sessions as video or JSON
- Real-time collaboration (multiple users)
- Advanced analytics (session heatmaps, interaction patterns)
- Production deployment (Kubernetes, cloud hosting)
- Automated testing (Jest, Playwright)
- Session search and filtering
- Configurable FizzBuzz rules (custom words/multiples)

---

**End of Design Document**

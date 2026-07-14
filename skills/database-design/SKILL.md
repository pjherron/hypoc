---
name: "Database Design"
description: "Comprehensive database design patterns for relational, document, and hybrid architectures. Covers ER diagrams, normalization, indexing, partitioning, and schema migrations. Use when designing schemas, optimizing queries, planning data models, or choosing between SQL/NoSQL architectures."
---

# Database Design

## What This Skill Does

Provides production-ready database design patterns including ER modeling, normalization strategies, index optimization, multi-database architectures, and schema evolution. Covers relational (Postgres/MySQL), document (MongoDB), time-series, and graph data models.

## Prerequisites

- Understanding of relational database concepts
- Familiarity with at least one database system (Postgres, MySQL, MongoDB)
- Knowledge of SQL or NoSQL query languages

---

## Quick Start

### Choose Your Database Type

```
Structured, relational data → Postgres/MySQL
Flexible schemas, nested docs → MongoDB
Time-series metrics → TimescaleDB/InfluxDB
Graph relationships → Neo4j
Multi-model needs → Postgres + Redis + ElasticSearch
```

### Basic Design Workflow

1. **Identify entities** → Users, Orders, Products
2. **Define relationships** → One-to-many, many-to-many
3. **Normalize to 3NF** → Remove redundancy
4. **Add indexes** → For common queries
5. **Plan migrations** → Version schema changes

---

## ER Diagram Design

### Entity-Relationship Fundamentals

**Entities**: Nouns in your domain (User, Order, Product)
**Attributes**: Properties of entities (name, email, price)
**Relationships**: Associations between entities (User places Order)

### Relationship Types

#### One-to-Many (1:N)

```
User ──< Order
 1       N

User (1)               Order (N)
────────              ──────────
id (PK)               id (PK)
email                 user_id (FK)
name                  total
                      created_at
```

**Implementation**:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
```

#### Many-to-Many (N:M)

```
Student ──>< Course
   N         M

Student          Enrollment         Course
────────        ────────────        ────────
id (PK)         student_id (FK)     id (PK)
name            course_id (FK)      name
                grade               credits
                enrolled_at
```

**Implementation**:
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  credits INTEGER NOT NULL
);

-- Junction/join table
CREATE TABLE enrollments (
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  grade VARCHAR(2),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
```

#### One-to-One (1:1)

```
User ── UserProfile
 1        1

User                 UserProfile
────────            ──────────────
id (PK)             user_id (PK, FK)
email               bio
                    avatar_url
                    preferences
```

**When to Use**: Separate sensitive data, optional extensions, performance optimization.

**Implementation**:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(500),
  preferences JSONB
);
```

### Self-Referencing Relationships

**Use Case**: Hierarchies, trees, graphs

```
Employee ──< Employee (manager)

Employee
────────────────
id (PK)
name
manager_id (FK) → employees(id)
```

**Implementation**:
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  manager_id INTEGER REFERENCES employees(id),
  CONSTRAINT no_self_reference CHECK (id != manager_id)
);

CREATE INDEX idx_employees_manager ON employees(manager_id);

-- Query: Find all direct reports
SELECT * FROM employees WHERE manager_id = 5;

-- Query: Find entire reporting chain (recursive CTE)
WITH RECURSIVE reporting_chain AS (
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE id = 5
  
  UNION ALL
  
  SELECT e.id, e.name, e.manager_id, rc.level + 1
  FROM employees e
  JOIN reporting_chain rc ON e.manager_id = rc.id
)
SELECT * FROM reporting_chain ORDER BY level;
```

---

## Database Normalization

### First Normal Form (1NF)

**Rule**: Eliminate repeating groups, ensure atomic values.

```
❌ BAD: Non-atomic values
User
─────────────────────────
id | name  | phone_numbers
─────────────────────────
1  | Alice | 555-1234, 555-5678

✅ GOOD: Atomic values, separate table
User                     Phone
────────────────        ────────────────────
id | name               user_id | number
────────────────        ────────────────────
1  | Alice              1       | 555-1234
                        1       | 555-5678
```

### Second Normal Form (2NF)

**Rule**: Meet 1NF + no partial dependencies (all non-key attributes depend on entire primary key).

```
❌ BAD: Partial dependency
OrderItem (composite key: order_id, product_id)
─────────────────────────────────────────────
order_id | product_id | product_name | quantity
─────────────────────────────────────────────
1        | 10         | Widget       | 5
1        | 20         | Gadget       | 3

product_name depends only on product_id (partial dependency)

✅ GOOD: Remove partial dependencies
OrderItem                        Product
────────────────────────        ─────────────────
order_id | product_id | qty     id | name
────────────────────────        ─────────────────
1        | 10         | 5       10 | Widget
1        | 20         | 3       20 | Gadget
```

### Third Normal Form (3NF)

**Rule**: Meet 2NF + no transitive dependencies.

```
❌ BAD: Transitive dependency
Employee
────────────────────────────────────────────
id | name  | dept_id | dept_name | dept_location
────────────────────────────────────────────
1  | Alice | 5       | Sales     | New York
2  | Bob   | 5       | Sales     | New York

dept_name and dept_location depend on dept_id (transitive)

✅ GOOD: Remove transitive dependencies
Employee                    Department
─────────────────          ────────────────────────
id | name  | dept_id       id | name  | location
─────────────────          ────────────────────────
1  | Alice | 5             5  | Sales | New York
2  | Bob   | 5
```

### Boyce-Codd Normal Form (BCNF)

**Rule**: Meet 3NF + every determinant is a candidate key.

```
❌ BAD: Violates BCNF
CourseProfessor
────────────────────────────────
student_id | course | professor
────────────────────────────────
1          | Math   | Dr. Smith
2          | Math   | Dr. Smith

Assumption: Each course has only one professor.
professor → course (professor determines course)
But professor is not a candidate key.

✅ GOOD: Split into two tables
StudentCourse              CourseProfessor
───────────────           ──────────────────
student_id | course       course | professor
───────────────           ──────────────────
1          | Math         Math   | Dr. Smith
2          | Math
```

---

## When to Denormalize

### Performance Tradeoffs

**Normalize When**:
- Write-heavy workloads (avoid update anomalies)
- Storage is expensive
- Data integrity is critical
- Schema is stable

**Denormalize When**:
- Read-heavy workloads (reduce joins)
- Query performance is critical
- Aggregations are frequent
- Data is mostly immutable

### Common Denormalization Patterns

#### Pattern 1: Aggregate Caching

```sql
-- Normalized
SELECT COUNT(*) FROM orders WHERE user_id = 123;

-- Denormalized: Cache count in users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  order_count INTEGER DEFAULT 0  -- Cached aggregate
);

-- Update via trigger
CREATE OR REPLACE FUNCTION update_order_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET order_count = (SELECT COUNT(*) FROM orders WHERE user_id = NEW.user_id)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_count
AFTER INSERT OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION update_order_count();
```

#### Pattern 2: Flattening Joins

```sql
-- Normalized: Requires join
SELECT o.id, o.total, u.name, u.email
FROM orders o
JOIN users u ON o.user_id = u.id;

-- Denormalized: Embed user info
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(100),    -- Denormalized
  user_email VARCHAR(255),   -- Denormalized
  total DECIMAL(10,2)
);

-- Trade-off: Faster reads, slower writes, potential inconsistency
```

#### Pattern 3: Materialized Views

```sql
-- Create pre-computed view
CREATE MATERIALIZED VIEW order_summaries AS
SELECT
  user_id,
  COUNT(*) AS order_count,
  SUM(total) AS lifetime_value,
  MAX(created_at) AS last_order_date
FROM orders
GROUP BY user_id;

CREATE INDEX idx_order_summaries_user ON order_summaries(user_id);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY order_summaries;
```

---

## Index Design Strategies

### Index Types

#### B-Tree Index (Default)

**Use For**: Equality, range queries, sorting

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Efficient queries
SELECT * FROM users WHERE email = 'alice@example.com';
SELECT * FROM orders WHERE created_at >= '2025-01-01';
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

#### Unique Index

```sql
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Enforces uniqueness, faster than CHECK constraint
```

#### Partial Index

**Use For**: Indexing subset of rows

```sql
-- Index only active orders (reduces index size)
CREATE INDEX idx_orders_active ON orders(user_id)
WHERE status = 'active';

-- Efficient for: WHERE user_id = X AND status = 'active'
-- Ignored for: WHERE user_id = X AND status = 'completed'
```

#### Composite Index

**Rule**: Order matters! Most selective columns first.

```sql
-- Good for: WHERE user_id = X AND status = Y
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Also good for: WHERE user_id = X (left prefix)
-- NOT good for: WHERE status = Y (right side only)

-- Order by selectivity
CREATE INDEX idx_orders_composite ON orders(
  user_id,         -- Most selective
  status,          -- Medium selective
  created_at       -- Least selective
);
```

#### Full-Text Search Index (Postgres)

```sql
-- GIN index for full-text search
CREATE INDEX idx_products_search ON products
USING GIN(to_tsvector('english', name || ' ' || description));

-- Query
SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description) @@ to_tsquery('wireless & headphones');
```

#### JSONB Index (Postgres)

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  data JSONB
);

-- Index entire JSONB column
CREATE INDEX idx_events_data ON events USING GIN(data);

-- Index specific path
CREATE INDEX idx_events_user_id ON events((data->>'user_id'));

-- Query
SELECT * FROM events WHERE data->>'user_id' = '123';
SELECT * FROM events WHERE data @> '{"type": "click"}';
```

### Index Monitoring

```sql
-- Postgres: Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS scans,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Postgres: Find missing indexes (slow queries)
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_rows_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;
```

---

## Data Types Selection

### Postgres/MySQL

| Data Type | Use For | Example |
|-----------|---------|---------|
| `SERIAL` / `BIGSERIAL` | Auto-increment IDs | Primary keys |
| `VARCHAR(n)` | Variable-length text | Names, emails (use appropriate length) |
| `TEXT` | Unlimited text | Descriptions, content |
| `INTEGER` / `BIGINT` | Whole numbers | Counts, IDs |
| `DECIMAL(p,s)` | Exact decimals | Money, prices |
| `FLOAT` / `DOUBLE` | Approximate decimals | Scientific data (avoid for money) |
| `BOOLEAN` | True/false | Flags, status |
| `DATE` | Calendar date | Birth dates |
| `TIMESTAMP` | Date + time | Created/updated timestamps |
| `TIMESTAMPTZ` | Date + time + timezone | Global app timestamps (use this!) |
| `JSONB` (Postgres) | Structured data | Settings, metadata |
| `UUID` | Globally unique IDs | Distributed systems |
| `ENUM` | Fixed set of values | Status: ('pending', 'active', 'closed') |

### Best Practices

```sql
-- ✅ GOOD: Use appropriate types
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,                    -- Big enough for scale
  email VARCHAR(255) NOT NULL UNIQUE,          -- Bounded length
  password_hash VARCHAR(255) NOT NULL,         -- Fixed hash length
  bhypocce DECIMAL(10,2) DEFAULT 0,             -- Exact decimals for money
  is_active BOOLEAN DEFAULT true,              -- Boolean for flags
  metadata JSONB,                              -- Flexible metadata
  created_at TIMESTAMPTZ DEFAULT NOW()         -- Timezone-aware
);

-- ❌ BAD: Poor type choices
CREATE TABLE users (
  id INTEGER,                                  -- Too small (max 2B)
  email TEXT,                                  -- Unbounded
  bhypocce FLOAT,                               -- Inexact for money!
  is_active INTEGER,                           -- Use BOOLEAN
  created_at TIMESTAMP                         -- No timezone
);
```

### MongoDB Data Types

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),  // Auto-generated ID
  name: "Alice",                               // String
  age: 30,                                     // Number (Int32/Int64/Double)
  email: "alice@example.com",                  // String
  tags: ["admin", "premium"],                  // Array
  address: {                                   // Embedded document
    street: "123 Main St",
    city: "New York"
  },
  created_at: ISODate("2025-01-15T10:30:00Z"), // Date
  metadata: {},                                // Object
  is_active: true                              // Boolean
}
```

---

## Multi-Database Patterns

### Postgres + Redis + ElasticSearch

```
                    Application
                         |
         ┌───────────────┼───────────────┐
         |               |               |
    Postgres          Redis       ElasticSearch
   (Source of       (Cache)         (Search)
     truth)
```

#### Postgres: Persistent Storage

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Redis: Caching Layer

```javascript
// Cache product by ID (5 min TTL)
await redis.setex(`product:${id}`, 300, JSON.stringify(product));

// Get from cache
const cached = await redis.get(`product:${id}`);
if (cached) return JSON.parse(cached);

// Cache miss - fetch from Postgres
const product = await db.query('SELECT * FROM products WHERE id = $1', [id]);
await redis.setex(`product:${id}`, 300, JSON.stringify(product));
return product;
```

#### ElasticSearch: Full-Text Search

```javascript
// Index product in ElasticSearch
await esClient.index({
  index: 'products',
  id: product.id,
  body: {
    name: product.name,
    description: product.description,
    price: product.price
  }
});

// Search
const results = await esClient.search({
  index: 'products',
  body: {
    query: {
      multi_match: {
        query: 'wireless headphones',
        fields: ['name^2', 'description']  // Boost name field
      }
    }
  }
});
```

### Write-Through Pattern

```javascript
async function updateProduct(id, updates) {
  // 1. Update Postgres (source of truth)
  await db.query('UPDATE products SET name = $1 WHERE id = $2', [updates.name, id]);
  
  // 2. Invalidate cache
  await redis.del(`product:${id}`);
  
  // 3. Update search index
  await esClient.update({
    index: 'products',
    id: id,
    body: { doc: updates }
  });
}
```

---

## Schema Migration Strategies

### Migration Tools

**Postgres/MySQL**:
- Flyway (Java)
- Liquibase (Java)
- node-pg-migrate (Node.js)
- Alembic (Python)
- golang-migrate (Go)

**MongoDB**:
- migrate-mongo (Node.js)
- Application-level migrations

### Migration Best Practices

#### Versioned Migrations

```
migrations/
├── V001__create_users_table.sql
├── V002__add_email_index.sql
├── V003__add_orders_table.sql
└── V004__add_order_status_enum.sql
```

#### Reversible Migrations

```sql
-- V005__add_user_bio.sql (UP)
ALTER TABLE users ADD COLUMN bio TEXT;

-- V005__add_user_bio_rollback.sql (DOWN)
ALTER TABLE users DROP COLUMN bio;
```

#### Safe Schema Changes

```sql
-- ❌ BAD: Blocks table during migration
ALTER TABLE orders ADD COLUMN notes TEXT NOT NULL;

-- ✅ GOOD: Add as nullable first, then backfill, then enforce
ALTER TABLE orders ADD COLUMN notes TEXT;  -- Non-blocking
UPDATE orders SET notes = '' WHERE notes IS NULL;  -- Backfill
ALTER TABLE orders ALTER COLUMN notes SET NOT NULL;  -- Enforce

-- ✅ GOOD: Use default to avoid backfill
ALTER TABLE orders ADD COLUMN notes TEXT NOT NULL DEFAULT '';
```

### Zero-Downtime Migrations

**Pattern**: Expand → Migrate → Contract

```sql
-- Step 1: EXPAND - Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(200);

-- Application code writes to BOTH first_name and full_name

-- Step 2: MIGRATE - Backfill data
UPDATE users SET full_name = first_name || ' ' || last_name WHERE full_name IS NULL;

-- Step 3: CONTRACT - Remove old columns
-- (After all app instances updated)
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

---

## Partitioning and Sharding

### Table Partitioning (Postgres)

#### Range Partitioning (By Date)

```sql
-- Parent table
CREATE TABLE orders (
  id BIGSERIAL,
  user_id INTEGER,
  total DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partitions
CREATE TABLE orders_2025_01 PARTITION OF orders
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE orders_2025_02 PARTITION OF orders
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Indexes on partitions
CREATE INDEX idx_orders_2025_01_user ON orders_2025_01(user_id);
CREATE INDEX idx_orders_2025_02_user ON orders_2025_02(user_id);

-- Query (Postgres automatically prunes partitions)
SELECT * FROM orders
WHERE created_at >= '2025-01-15' AND created_at < '2025-01-20';
-- Only queries orders_2025_01 partition
```

#### List Partitioning (By Value)

```sql
CREATE TABLE users (
  id BIGSERIAL,
  email VARCHAR(255),
  region VARCHAR(10) NOT NULL,
  PRIMARY KEY (id, region)
) PARTITION BY LIST (region);

CREATE TABLE users_us PARTITION OF users FOR VALUES IN ('US');
CREATE TABLE users_eu PARTITION OF users FOR VALUES IN ('EU', 'UK');
CREATE TABLE users_asia PARTITION OF users FOR VALUES IN ('JP', 'CN', 'IN');
```

### Sharding (Application-Level)

```
Application
     |
     v
Shard Router
     |
     ├── Shard 1 (user_id % 4 = 0)
     ├── Shard 2 (user_id % 4 = 1)
     ├── Shard 3 (user_id % 4 = 2)
     └── Shard 4 (user_id % 4 = 3)
```

```javascript
// Shard routing logic
function getShardForUser(userId) {
  const shardCount = 4;
  const shardId = userId % shardCount;
  return shardConnections[shardId];
}

// Query specific shard
async function getUser(userId) {
  const db = getShardForUser(userId);
  return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
}

// Cross-shard query (expensive!)
async function getAllActiveUsers() {
  const results = await Promise.all(
    shardConnections.map(db =>
      db.query('SELECT * FROM users WHERE is_active = true')
    )
  );
  return results.flat();
}
```

---

## Soft Deletes vs Hard Deletes

### Hard Delete

```sql
DELETE FROM users WHERE id = 123;
-- Data permanently removed
```

**Pros**: Simple, saves storage, enforces constraints
**Cons**: No recovery, breaks referential integrity, no audit trail

### Soft Delete

```sql
-- Add deleted_at column
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- Soft delete
UPDATE users SET deleted_at = NOW() WHERE id = 123;

-- Query active users
SELECT * FROM users WHERE deleted_at IS NULL;

-- Restore
UPDATE users SET deleted_at = NULL WHERE id = 123;
```

**Pros**: Recoverable, audit trail, referential integrity preserved
**Cons**: Requires updated queries, uses storage, unique constraints tricky

### Handling Unique Constraints with Soft Deletes

```sql
-- ❌ PROBLEM: Unique constraint blocks re-creation after soft delete
CREATE UNIQUE INDEX idx_users_email ON users(email);
-- Soft-deleted user with email "alice@example.com" blocks new user with same email

-- ✅ SOLUTION 1: Partial unique index
CREATE UNIQUE INDEX idx_users_email_active ON users(email)
WHERE deleted_at IS NULL;
-- Only active users must have unique emails

-- ✅ SOLUTION 2: Composite unique index
CREATE UNIQUE INDEX idx_users_email_deleted ON users(email, deleted_at);
-- Allows same email if deleted_at differs
```

---

## Audit Trail Patterns

### Audit Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users_audit (
  audit_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email VARCHAR(255),
  name VARCHAR(100),
  operation VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
  changed_by INTEGER,               -- User who made change
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to log changes
CREATE OR REPLACE FUNCTION audit_users()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO users_audit(user_id, email, name, operation)
    VALUES (OLD.id, OLD.email, OLD.name, 'DELETE');
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO users_audit(user_id, email, name, operation)
    VALUES (NEW.id, NEW.email, NEW.name, 'UPDATE');
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO users_audit(user_id, email, name, operation)
    VALUES (NEW.id, NEW.email, NEW.name, 'INSERT');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_users();
```

### Temporal Tables (Postgres)

```sql
-- System-versioned temporal table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(100),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT 'infinity'
);

-- Query current state
SELECT * FROM users WHERE valid_to = 'infinity';

-- Query historical state (as of specific time)
SELECT * FROM users
WHERE valid_from <= '2025-01-01' AND valid_to > '2025-01-01';
```

---

## Time-Series Data Patterns

### TimescaleDB (Postgres Extension)

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  device_id INTEGER NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2)
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('metrics', 'time');

-- Continuous aggregate (materialized view)
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  device_id,
  AVG(temperature) AS avg_temp,
  MAX(temperature) AS max_temp,
  MIN(temperature) AS min_temp
FROM metrics
GROUP BY hour, device_id;

-- Automatic retention policy (delete old data)
SELECT add_retention_policy('metrics', INTERVAL '90 days');
```

---

## Graph Relationships

### Adjacency List (Postgres)

```sql
-- Social graph: users follow users
CREATE TABLE follows (
  follower_id INTEGER REFERENCES users(id),
  followee_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followee ON follows(followee_id);

-- Query: Who does Alice follow?
SELECT u.* FROM users u
JOIN follows f ON u.id = f.followee_id
WHERE f.follower_id = (SELECT id FROM users WHERE email = 'alice@example.com');

-- Query: Who follows Alice?
SELECT u.* FROM users u
JOIN follows f ON u.id = f.follower_id
WHERE f.followee_id = (SELECT id FROM users WHERE email = 'alice@example.com');

-- Query: Mutual follows (friends)
SELECT u.* FROM users u
WHERE EXISTS (
  SELECT 1 FROM follows f1
  WHERE f1.follower_id = 123 AND f1.followee_id = u.id
)
AND EXISTS (
  SELECT 1 FROM follows f2
  WHERE f2.follower_id = u.id AND f2.followee_id = 123
);
```

---

## Document Design (MongoDB)

### Embedding vs Referencing

#### Embedding (Denormalized)

```javascript
// One-to-few relationship: Embed addresses
{
  _id: ObjectId("..."),
  name: "Alice",
  email: "alice@example.com",
  addresses: [
    { type: "home", street: "123 Main St", city: "NYC" },
    { type: "work", street: "456 Office Blvd", city: "NYC" }
  ]
}
```

**Pros**: Single query, atomic updates
**Cons**: Document size limits (16MB), data duplication

#### Referencing (Normalized)

```javascript
// One-to-many relationship: Reference orders
// User document
{
  _id: ObjectId("user1"),
  name: "Alice",
  email: "alice@example.com"
}

// Order documents
{
  _id: ObjectId("order1"),
  user_id: ObjectId("user1"),  // Reference
  total: 100.00,
  items: [...]
}
```

**Pros**: No duplication, smaller documents
**Cons**: Multiple queries, no joins (requires $lookup)

### Schema Design Rules

1. **Embed** if:
   - Data accessed together
   - One-to-few relationship
   - Data doesn't change frequently

2. **Reference** if:
   - Data accessed independently
   - One-to-many or many-to-many
   - Data changes frequently
   - Document size would exceed 16MB

---

## Anti-Patterns to Avoid

```
❌ No indexes on foreign keys
❌ Using TEXT for all strings (use VARCHAR with length)
❌ Using FLOAT for money (use DECIMAL)
❌ Not using transactions for multi-step operations
❌ Selecting * instead of specific columns
❌ Not partitioning large tables (>10M rows)
❌ Ignoring query performance (no EXPLAIN)
❌ Using ORMs without understanding generated SQL
❌ Not planning for schema evolution
❌ Premature optimization (normalize first, denormalize for performance)
```

---

## Related Skills

- `backend-patterns` - Service layer and repository patterns
- `api-design` - REST API conventions
- `fastapi-patterns` - FastAPI database integration
- `deployment-patterns` - Database deployment strategies

---

**Created**: 2025-05-07
**Category**: Backend
**Difficulty**: Intermediate to Advanced
**Estimated Time**: 30-60 minutes per pattern

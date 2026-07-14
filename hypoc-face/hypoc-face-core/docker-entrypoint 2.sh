#!/bin/bash
# Startup script for hypoc-face-core container
# Runs migrations and starts the FastAPI server

set -e

echo "=== Hypoc-Face Core Startup ==="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "✓ PostgreSQL is ready"

# Run Alembic migrations
echo "Running database migrations..."
cd /app
alembic upgrade head
echo "✓ Migrations complete"

# Seed database if not already seeded
echo "Checking if database needs seeding..."
python -c "
from app.core.database import SessionLocal
from app.models.role import Role
db = SessionLocal()
role_count = db.query(Role).count()
db.close()
if role_count == 0:
    print('Seeding database...')
    import subprocess
    subprocess.run(['python', 'scripts/seed_db.py'], check=True)
else:
    print('✓ Database already seeded')
"

# Start the FastAPI server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

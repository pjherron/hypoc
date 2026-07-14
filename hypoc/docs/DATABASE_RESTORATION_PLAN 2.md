# Database Restoration Plan

**Date:** May 6, 2026  
**Status:** Ready to Execute  
**Critical Rule:** NEVER work on the original - ALWAYS work on a COPY

## Problem Statement

During the merge of two OpenCode installations, the global session database at `~/.local/share/opencode/opencode.db` was accidentally modified in place. All 84 sessions now show timestamp "2026-05-06 10:10 AM" instead of their original timestamps.

## Evidence Available

Two screenshots taken before corruption:
- `~/Desktop/Screenshot 2026-05-06 at 10.17.56 AM.png` - Session list page 1
- `~/Desktop/Screenshot 2026-05-06 at 10.18.23 AM.png` - Session list page 2

These screenshots contain the original session titles and timestamps that need to be restored.

## Critical Principle

**The original corrupted database at `~/.local/share/opencode/opencode.db` stays COMPLETELY UNTOUCHED.**

We are creating a NEW database for the merged installation at `~/dev/code/opencode/` - this is NOT a backup scenario, this is a merge scenario. The merged installation gets its own restored database.

## Working Copy Location

**`~/dev/code/opencode/.local/opencode.db`** - The working copy for the merged installation

## Restoration Steps

### Step 1: Create Working Copy Directory

```bash
mkdir -p ~/dev/code/opencode/.local
```

### Step 2: Copy Corrupted Database to Working Location

```bash
cp ~/.local/share/opencode/opencode.db ~/dev/code/opencode/.local/opencode.db
```

**Verification:**
```bash
ls -lh ~/dev/code/opencode/.local/opencode.db
# Should show ~93M file
```

### Step 3: Inspect Database Schema

```bash
sqlite3 ~/dev/code/opencode/.local/opencode.db << 'EOF'
.schema sessions
.headers on
.mode column
SELECT id, title, time_updated FROM sessions LIMIT 5;
EOF
```

**Expected output:** All `time_updated` values should be "2026-05-06 10:10 AM"

### Step 4: Extract Timestamps from Screenshots Using Tesseract

```bash
# Process first screenshot
tesseract ~/Desktop/Screenshot\ 2026-05-06\ at\ 10.17.56\ AM.png \
  ~/dev/code/opencode/.local/screenshot1.txt

# Process second screenshot  
tesseract ~/Desktop/Screenshot\ 2026-05-06\ at\ 10.18.23\ AM.png \
  ~/dev/code/opencode/.local/screenshot2.txt
```

**Verification:**
```bash
head -20 ~/dev/code/opencode/.local/screenshot1.txt
head -20 ~/dev/code/opencode/.local/screenshot2.txt
```

### Step 5: Parse Extracted Text into Structured Data

Create a parser script to extract session title and timestamp pairs:

```bash
cat > ~/dev/code/opencode/.local/parse_timestamps.sh << 'EOF'
#!/bin/bash
# Parse OCR output to extract session title and timestamp pairs
# Expected format in screenshots:
# [Session Title] [Timestamp]

# Combine both files
cat screenshot1.txt screenshot2.txt | \
  # Filter lines that look like session entries
  grep -E "[0-9]{1,2}:[0-9]{2} (AM|PM)" | \
  # Output as CSV: "title","timestamp"
  sed 's/\(.*\)\s\+\([0-9]\{1,2\}:[0-9]\{2\} [AP]M\)/"\1","\2"/' \
  > session_timestamps.csv

echo "Extracted $(wc -l < session_timestamps.csv) session timestamps"
EOF

chmod +x ~/dev/code/opencode/.local/parse_timestamps.sh
cd ~/dev/code/opencode/.local && ./parse_timestamps.sh
```

**Verification:**
```bash
head -10 ~/dev/code/opencode/.local/session_timestamps.csv
wc -l ~/dev/code/opencode/.local/session_timestamps.csv
# Should show ~84 lines (one per session)
```

### Step 6: Generate SQL Restoration Script

Create a script to generate SQL UPDATE statements:

```bash
cat > ~/dev/code/opencode/.local/generate_sql.py << 'EOF'
#!/usr/bin/env python3
import csv
import sqlite3
from datetime import datetime

# Read extracted timestamps
sessions = {}
with open('session_timestamps.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) == 2:
            title, timestamp = row
            sessions[title.strip()] = timestamp.strip()

# Connect to database
conn = sqlite3.connect('opencode.db')
cursor = conn.cursor()

# Get all sessions from database
cursor.execute("SELECT id, title FROM sessions")
db_sessions = cursor.fetchall()

# Generate UPDATE statements
sql_updates = []
matched_count = 0

for session_id, db_title in db_sessions:
    db_title_clean = db_title.strip()
    
    # Try to match with extracted data
    if db_title_clean in sessions:
        timestamp_str = sessions[db_title_clean]
        
        # Convert "10:17 AM" format to ISO timestamp
        # Note: This is approximate - we only have time, not date
        # Reconstruct from original screenshot date: 2026-05-06
        try:
            time_obj = datetime.strptime(timestamp_str, "%I:%M %p")
            iso_timestamp = f"2026-05-06 {time_obj.strftime('%H:%M:%S')}"
            
            sql_updates.append(
                f"UPDATE sessions SET time_updated = '{iso_timestamp}' WHERE id = {session_id};"
            )
            matched_count += 1
        except ValueError:
            print(f"Warning: Could not parse timestamp '{timestamp_str}' for session '{db_title_clean}'")

conn.close()

# Write SQL file
with open('restore_timestamps.sql', 'w') as f:
    f.write("BEGIN TRANSACTION;\n\n")
    f.write(f"-- Restoring {matched_count} session timestamps\n\n")
    for sql in sql_updates:
        f.write(sql + "\n")
    f.write("\nCOMMIT;\n")

print(f"Generated SQL for {matched_count}/{len(db_sessions)} sessions")
print(f"Output: restore_timestamps.sql")
EOF

chmod +x ~/dev/code/opencode/.local/generate_sql.py
cd ~/dev/code/opencode/.local && python3 generate_sql.py
```

**Verification:**
```bash
head -20 ~/dev/code/opencode/.local/restore_timestamps.sql
wc -l ~/dev/code/opencode/.local/restore_timestamps.sql
```

### Step 7: Review SQL Before Applying

**CRITICAL: Human review required before proceeding**

```bash
less ~/dev/code/opencode/.local/restore_timestamps.sql
```

Review a sample of UPDATE statements to ensure:
- Session titles match correctly
- Timestamps look reasonable
- SQL syntax is correct

### Step 8: Apply SQL to Working Copy

```bash
sqlite3 ~/dev/code/opencode/.local/opencode.db < ~/dev/code/opencode/.local/restore_timestamps.sql
```

### Step 9: Verify Restoration

```bash
sqlite3 ~/dev/code/opencode/.local/opencode.db << 'EOF'
.headers on
.mode column
SELECT id, title, time_updated FROM sessions ORDER BY time_updated DESC LIMIT 20;
EOF
```

**Expected:** Timestamps should now vary (not all "2026-05-06 10:10 AM")

### Step 10: Sample Verification Against Screenshots

Manually verify 5-10 sessions by comparing:
- Open the screenshots
- Find specific session titles
- Check the timestamp in the screenshot matches the database

### Step 11: Configure Merged Installation

Create configuration to tell OpenCode to use the project-local database:

```bash
# TODO: Determine OpenCode's configuration method for custom database path
# Options:
# 1. Environment variable (e.g., OPENCODE_DB_PATH)
# 2. Config file setting
# 3. Symlink approach
```

**Research needed:** How does OpenCode allow specifying a custom database location?

## Success Criteria

- [ ] Working copy created at `~/dev/code/opencode/.local/opencode.db`
- [ ] Original database at `~/.local/share/opencode/opencode.db` UNTOUCHED
- [ ] Timestamps extracted from screenshots using Tesseract OCR
- [ ] Session titles matched to database records
- [ ] SQL restoration script generated and reviewed
- [ ] SQL applied to working copy ONLY
- [ ] Sample verification confirms correct timestamps
- [ ] Merged installation configured to use working copy database
- [ ] All changes committed to git repository

## Rollback Plan

Since we're working on a COPY, rollback is simple:

```bash
# Delete the working copy and start over
rm ~/dev/code/opencode/.local/opencode.db
# Re-run from Step 2
```

The original database remains unchanged, so no data loss is possible.

## Notes

- OCR accuracy may not be 100% - manual verification of extracted data is critical
- Time parsing assumes all sessions are from 2026-05-06 (date from screenshot filename)
- Session titles must match exactly for SQL updates to work
- If fuzzy matching is needed, implement Levenshtein distance comparison

## Files Generated

- `~/dev/code/opencode/.local/opencode.db` - Working copy database
- `~/dev/code/opencode/.local/screenshot1.txt` - OCR output from screenshot 1
- `~/dev/code/opencode/.local/screenshot2.txt` - OCR output from screenshot 2
- `~/dev/code/opencode/.local/session_timestamps.csv` - Parsed timestamps
- `~/dev/code/opencode/.local/restore_timestamps.sql` - SQL restoration script
- `~/dev/code/opencode/.local/parse_timestamps.sh` - Parser script
- `~/dev/code/opencode/.local/generate_sql.py` - SQL generator script

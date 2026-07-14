<!-- Configuration variables referenced in this document:
  WORKSPACE_DIR             Local workspace root directory  (e.g. /Users/pherron6/dev/code/opencode)
-->

# OpenCode Session Database Restoration Plan

**Date:** May 6, 2026  
**Problem:** Corrupted `time_updated` timestamps in global session database  
**Cause:** In-place UPDATE operations modified all 84 sessions to show "10:10 AM" today  
**Solution:** Restore correct timestamps using screenshot data

## Prerequisites

**Original Database (DO NOT TOUCH):**
- `~/.local/share/opencode/opencode.db` (92MB)
- `~/.local/share/opencode/opencode.db-wal`
- `~/.local/share/opencode/opencode.db-shm`

**Screenshot Data:** 
- `~/Desktop/Screenshot 2026-05-06 at 10.17.56 AM.png`
- `~/Desktop/Screenshot 2026-05-06 at 10.18.23 AM.png`

## Step 1: Create Backups

```bash
# Backup original database to Desktop (safe location)
cp ~/.local/share/opencode/opencode.db ~/Desktop/opencode.db.ORIGINAL.BACKUP
cp ~/.local/share/opencode/opencode.db-wal ~/Desktop/opencode.db-wal.ORIGINAL.BACKUP
cp ~/.local/share/opencode/opencode.db-shm ~/Desktop/opencode.db-shm.ORIGINAL.BACKUP

# Verify backup
ls -lh ~/Desktop/opencode.db.ORIGINAL.BACKUP
```

## Step 2: Create Working Copy

```bash
# Create working copy in /tmp
cp ~/.local/share/opencode/opencode.db /tmp/opencode.db.WORKING

# Verify working copy
ls -lh /tmp/opencode.db.WORKING
```

## Step 3: Session Timestamp Data from Screenshots

From OCR of screenshots, extracted session titles with their ISO timestamps:

```
Merge opencodes → 2026-05-05T13:59:02.393Z
New session (HRbot) → 2026-05-05T14:01:20.149Z
OpenWebui deploy + bup → 2026-04-21T17:48:50.661Z
OI-WWGPT-Doc+Announce → 2026-04-20T18:59:42.197Z
Bedrock Endpoint Config Info → 2026-04-20T16:44:43.907Z
OpenCode mem mgmt → 2026-04-16T15:06:04.641Z
Searching OC Sessions → 2026-04-07T13:57:49.918Z
WWGPT deploy readme → 2026-04-03T18:18:20.911Z
Sharing project knowledge → 2026-04-20T13:49:46.557Z
DataGPT Exp4 → 2026-04-06T23:05:53.786Z
Looking for DGTP → 2026-04-29T15:35:03.650Z
New session → 2026-04-29T18:07:26.352Z
DONE WWGPT Release Comms & Doc → 2026-04-22T16:32:18.525Z
OpenCode Upgrade Test+Val → 2026-04-20T13:48:51.208Z
Hypoc-Face OC Desktop → 2026-04-17T18:16:19.849Z
OC FizzBuzz demo for Ira → 2026-04-17T16:29:49.452Z
FastRunner → 2026-04-17T16:24:55.847Z
Orig WWGPT SSO fix → 2026-04-15T22:30:17.082Z
Misc chrome and spider2.0 → 2026-04-15T20:09:33.492Z
OpenCode Framework ECC SP Integration → 2026-04-15T19:12:17.219Z
FastRunners & CI/CD problems → 2026-03-31T21:18:31.086Z
```

## Step 4: Convert Timestamps to Unix Epoch

ISO timestamps need to be converted to Unix epoch milliseconds for the `time_updated` field.

Python conversion script:

```python
from datetime import datetime

timestamps = {
    'Merge opencodes - 2026-05-05T13:59:02.393Z': '2026-05-05T13:59:02.393Z',
    'New session - 2026-05-05T14:01:20.149Z': '2026-05-05T14:01:20.149Z',
    'OpenWebui deploy + bup - 2026-04-21T17:48:50.661Z': '2026-04-21T17:48:50.661Z',
    'OI-WWGPT-Doc+Announce - 2026-04-20T18:59:42.197Z': '2026-04-20T18:59:42.197Z',
    'Bedrock Endpoint Config Info - 2026-04-20T16:44:43.907Z': '2026-04-20T16:44:43.907Z',
    'OpenCode mem mgmt - 2026-04-16T15:06:04.641Z': '2026-04-16T15:06:04.641Z',
    'Searching OC Sessions - 2026-04-07T13:57:49.918Z': '2026-04-07T13:57:49.918Z',
    'WWGPT deploy readme - 2026-04-03T18:18:20.911Z': '2026-04-03T18:18:20.911Z',
    'Sharing project knowledge - 2026-04-20T13:49:46.557Z': '2026-04-20T13:49:46.557Z',
    'DataGPT Exp4 - 2026-04-06T23:05:53.786Z': '2026-04-06T23:05:53.786Z',
    'Looking for DGTP - 2026-04-29T15:35:03.650Z': '2026-04-29T15:35:03.650Z',
    'New session - 2026-04-29T18:07:26.352Z': '2026-04-29T18:07:26.352Z',
    'DONE WWGPT Release Comms & Doc - 2026-04-22T16:32:18.525Z': '2026-04-22T16:32:18.525Z',
    'OpenCode Upgrade Test+Val - 2026-04-20T13:48:51.208Z': '2026-04-20T13:48:51.208Z',
    'Hypoc-Face OC Desktop - 2026-04-17T18:16:19.849Z': '2026-04-17T18:16:19.849Z',
    'OC FizzBuzz demo for Ira - 2026-04-17T16:29:49.452Z': '2026-04-17T16:29:49.452Z',
    'FastRunner - 2026-04-17T16:24:55.847Z': '2026-04-17T16:24:55.847Z',
    'Orig WWGPT SSO fix - 2026-04-15T22:30:17.082Z': '2026-04-15T22:30:17.082Z',
    'Misc chrome and spider2.0 - 2026-04-15T20:09:33.492Z': '2026-04-15T20:09:33.492Z',
    'OpenCode Framework ECC SP Integration - 2026-04-15T19:12:17.219Z': '2026-04-15T19:12:17.219Z',
    'FastRunners & CI/CD problems - 2026-03-31T21:18:31.086Z': '2026-03-31T21:18:31.086Z',
}

for title, iso_ts in timestamps.items():
    dt = datetime.fromisoformat(iso_ts.replace('Z', '+00:00'))
    epoch_ms = int(dt.timestamp() * 1000)
    print(f"UPDATE session SET time_updated = {epoch_ms} WHERE title = '{title}';")
```

## Step 5: Generate SQL Restoration Script

The SQL script will be generated and saved as `restoration_script.sql`.

Example format:

```sql
-- Restoration script for OpenCode session database
-- Work on COPY only: /tmp/opencode.db.WORKING

UPDATE session SET time_updated = 1746450742393 WHERE title = 'Merge opencodes - 2026-05-05T13:59:02.393Z';
UPDATE session SET time_updated = 1746450880149 WHERE title = 'New session - 2026-05-05T14:01:20.149Z';
UPDATE session SET time_updated = 1745241530661 WHERE title = 'OpenWebui deploy + bup - 2026-04-21T17:48:50.661Z';
-- ... continue for all sessions
```

## Step 6: Apply Restoration to Working Copy

```bash
# Apply SQL updates to WORKING copy ONLY (NOT the original)
sqlite3 /tmp/opencode.db.WORKING < ~/Desktop/restoration_script.sql

# Verify changes
sqlite3 /tmp/opencode.db.WORKING "SELECT title, datetime(time_updated/1000, 'unixepoch') as updated FROM session ORDER BY time_updated DESC LIMIT 10;"
```

## Step 7: Verify Restoration

```bash
# Compare restored timestamps with screenshots
sqlite3 /tmp/opencode.db.WORKING "SELECT title, time_updated FROM session ORDER BY time_updated DESC;"

# Check session count (should be 84)
sqlite3 /tmp/opencode.db.WORKING "SELECT COUNT(*) FROM session;"

# Verify no sessions show "today" timestamp
sqlite3 /tmp/opencode.db.WORKING "SELECT COUNT(*) FROM session WHERE date(time_updated/1000, 'unixepoch') = date('now');"
```

## Step 8: Decision Point

**After verification, choose ONE option:**

### Option A: Replace Original with Restored Copy

```bash
# CRITICAL: Backup corrupted original first
cp ~/.local/share/opencode/opencode.db ~/.local/share/opencode/opencode.db.CORRUPTED
cp ~/.local/share/opencode/opencode.db-wal ~/.local/share/opencode/opencode.db-wal.CORRUPTED
cp ~/.local/share/opencode/opencode.db-shm ~/.local/share/opencode/opencode.db-shm.CORRUPTED

# Replace with restored version
cp /tmp/opencode.db.WORKING ~/.local/share/opencode/opencode.db

# Remove WAL/SHM files to force fresh start
rm ~/.local/share/opencode/opencode.db-wal
rm ~/.local/share/opencode/opencode.db-shm

# Test
cd ~/dev/code/opencode
opencode session list
```

### Option B: Use Restored Copy for Merged Installation Only

```bash
# Create database directory in merged install
mkdir -p ~/dev/code/opencode/.local/share/opencode

# Copy restored database
cp /tmp/opencode.db.WORKING ~/dev/code/opencode/.local/share/opencode/opencode.db

# Note: May need to configure OpenCode to use local database instead of global
# Check OpenCode documentation for database path configuration
```

### Option C: Keep Both Databases

- Leave original corrupted database at `~/.local/share/opencode/opencode.db`
- Keep restored copy at `/tmp/opencode.db.WORKING` or move to permanent location
- Use environment variables or configuration to select which database to use

### Option D: Abort Restoration

```bash
# Delete working copy
rm /tmp/opencode.db.WORKING

# Keep original backups at ~/Desktop/opencode.db.ORIGINAL.BACKUP
# Accept timestamp loss for sessions not in screenshots
```

## Step 9: Post-Restoration Verification

```bash
# Open OpenCode and check session list
cd ~/dev/code/opencode
opencode

# Press Ctrl+P → "switch sessions"
# Verify timestamps match screenshot data
# Verify all 84 sessions are present
```

## Validation Checklist

Before replacing original database:

- [ ] Working copy created at `/tmp/opencode.db.WORKING`
- [ ] Working copy has 84 sessions (same as original)
- [ ] Timestamps match screenshot data for 21 known sessions
- [ ] No sessions show corrupted "10:10 AM" today timestamp (for restored sessions)
- [ ] Original backup exists at `~/Desktop/opencode.db.ORIGINAL.BACKUP`
- [ ] SQL restoration script generated and verified
- [ ] Test queries on working copy show correct results

## Rollback Plan

If restoration fails or causes issues:

```bash
# Restore from original backup
cp ~/Desktop/opencode.db.ORIGINAL.BACKUP ~/.local/share/opencode/opencode.db
cp ~/Desktop/opencode.db-wal.ORIGINAL.BACKUP ~/.local/share/opencode/opencode.db-wal
cp ~/Desktop/opencode.db-shm.ORIGINAL.BACKUP ~/.local/share/opencode/opencode.db-shm

# Verify rollback
opencode session list
```

## Important Notes

1. **All operations performed on COPIES only** - Original database at `~/.local/share/opencode/` remains untouched until explicit replacement decision
2. **Screenshot data covers ~21 of 84 sessions** - Remaining 63 sessions will retain corrupted "today" timestamps unless additional data sources found
3. **Database directory paths** - Sessions are currently set to `${WORKSPACE_DIR}` after my earlier mistake. This restoration fixes timestamps only, not directory paths.
4. **Testing required** - After restoration, thoroughly test session switching, session loading, and data integrity before considering original database replacement

## Known Limitations

- Only 21 sessions have confirmed original timestamps from screenshots
- Remaining 63 sessions will show corrupted timestamps unless:
  - Additional screenshots or backups found
  - Timestamps reconstructed from message data (complex, may not be accurate)
  - User accepts timestamp loss for these sessions

## Files Created by This Process

- `~/Desktop/RESTORATION_PLAN.md` - This file
- `~/Desktop/opencode.db.ORIGINAL.BACKUP` - Backup of original corrupted database
- `~/Desktop/restoration_script.sql` - SQL script with UPDATE statements
- `/tmp/opencode.db.WORKING` - Working copy where restoration is performed

---

**Execution Status:** Plan documented, awaiting execution approval

**Next Steps:**
1. Review this plan
2. Execute Step 1 (create backups)
3. Execute Step 2 (create working copy)
4. Execute Step 4-6 (generate and apply restoration)
5. Execute Step 7 (verify)
6. Make decision (Step 8)

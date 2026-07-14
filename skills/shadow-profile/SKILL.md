---
name: shadow-profile
description: View or update your personal skill and agent profile. Shows which skills you use most, which you decline, and what the platform has learned about your work patterns. Invoke when you want to understand or adjust your personalized configuration.
origin: Platform
---

# Shadow Profile

Your shadow profile is built automatically by observing what you accept, review, revise, and decline. It shapes what gets recruited and suggested in future sessions.

## View Your Profile

The profile is stored in PostgreSQL (`user_shadow_profile` table). To view:

```sql
SELECT skill_name, invocation_count, decline_count, last_used_at, avg_complexity
FROM user_shadow_profile
WHERE user_id = '${USER_ID}'
ORDER BY invocation_count DESC;
```

This surfaces:
- Which skills you use most
- Which you consistently decline (candidates for removal from recruitment)
- What task complexity you typically work at
- Project-scoped vs. global patterns

## What Gets Learned

Every time you interact with the skill consent prompt:
- **Accept** → `invocation_count` incremented
- **Decline** → `decline_count` incremented
- **Revise + Accept** → `invocation_count` incremented, revision noted

After enough data, the recruitment algorithm weights:
- High-accept skills → surfaced first
- High-decline skills → surfaced less (eventually suppressed)
- Project-scoped patterns → only active in that project context

## Reset

To clear your profile and start fresh:
```sql
DELETE FROM user_shadow_profile WHERE user_id = '${USER_ID}';
```

## Privacy

Profile data lives in your PostgreSQL instance. It does not leave your infrastructure.

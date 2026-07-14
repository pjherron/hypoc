# Project Hypoc-Face - RBAC Permission System

**Date:** 2025-01-20  
**Approach:** Granular permissions grouped into categories, conventional roles as defaults  
**Flexibility:** Admin can create custom roles by selecting permissions  

---

## Permission Groups

### 1. Authentication & User Management
```
user.read.self              - View own profile
user.update.self            - Update own profile
user.read.all               - View all users
user.update.all             - Update any user
user.create                 - Create new users
user.delete                 - Delete users
user.role.assign            - Assign roles to users
user.role.revoke            - Revoke roles from users
```

### 2. Workspace Management
```
workspace.create            - Create new workspaces
workspace.read.own          - View own workspaces
workspace.read.all          - View all workspaces
workspace.update.own        - Modify own workspaces
workspace.update.all        - Modify any workspace
workspace.delete.own        - Delete own workspaces
workspace.delete.all        - Delete any workspace
workspace.share             - Share workspaces with others
```

### 3. AI Model Access
```
model.use.mini              - Use mini/cheap models (gpt-4o-mini, haiku)
model.use.standard          - Use standard models (gpt-4o, sonnet)
model.use.premium           - Use premium models (opus, o1)
model.use.bedrock.gov       - Use AWS Bedrock Gov Cloud
model.use.azure.gov         - Use Azure OpenAI Gov Cloud
model.use.anthropic         - Use Anthropic models
model.use.openai            - Use OpenAI models
model.use.local             - Use local Ollama models
```

### 4. RAG & Knowledge
```
rag.query.skills            - Query skill knowledge base
rag.query.agents            - Query agent definitions
rag.query.workspace         - Query own workspace content
rag.query.all               - Query all indexed content
rag.index.workspace         - Index own workspace
rag.index.all               - Index any workspace
rag.admin                   - Manage RAG collections
```

### 5. Agent Operations
```
agent.use.basic             - Use basic agents (coder, reviewer)
agent.use.advanced          - Use advanced agents (researcher, architect)
agent.use.custom            - Use custom user-defined agents
agent.create                - Create custom agents
agent.delete.own            - Delete own custom agents
agent.delete.all            - Delete any custom agent
agent.admin                 - Manage agent registry
```

### 6. Cost & Quotas
```
quota.view.own              - View own usage and quota
quota.view.team             - View team usage
quota.view.all              - View all user usage
quota.manage.own            - Manage own quota (if transferable)
quota.manage.team           - Set team member quotas
quota.manage.all            - Set any user quota
quota.unlimited             - No quota enforcement
cost.export                 - Export cost reports
```

### 7. Administration
```
admin.system.config         - Modify system configuration
admin.system.health         - View system health metrics
admin.logs.view             - View system logs
admin.logs.export           - Export logs
admin.monitoring            - Access monitoring dashboards
admin.security              - Manage security settings
admin.billing               - Manage billing settings
admin.roles.create          - Create new roles
admin.roles.update          - Update role permissions
admin.roles.delete          - Delete roles
```

### 8. Collaboration
```
collab.share.workspace      - Share workspaces
collab.share.conversation   - Share conversations
collab.share.agent          - Share custom agents
collab.view.shared          - View items shared with user
collab.comment              - Comment on shared items
```

### 9. Data & Compliance
```
data.export.own             - Export own data
data.export.team            - Export team data
data.export.all             - Export all data
data.delete.own             - Delete own data
data.delete.all             - Delete any data
compliance.audit.view       - View audit logs
compliance.audit.export     - Export audit logs
compliance.classify         - Classify data (CUI, etc.)
```

---

## Default Conventional Roles

### Super Admin
**Description:** Full system access, manages entire platform  
**Use Case:** Platform owner, [Org] IT admin  
**Quota:** Unlimited  

**Permissions:** ALL (all permission groups)

---

### Admin
**Description:** Manages organization/team, assigns roles, views costs  
**Use Case:** Team lead, project manager  
**Quota:** $5,000/month  

**Permissions:**
- **Auth & Users:** user.*, except user.delete
- **Workspaces:** workspace.read.all, workspace.delete.own
- **Models:** model.use.* (all models)
- **RAG:** rag.query.all, rag.index.workspace
- **Agents:** agent.use.*, agent.create
- **Cost:** quota.view.all, quota.manage.team, cost.export
- **Admin:** admin.system.health, admin.logs.view, admin.monitoring
- **Collaboration:** collab.*
- **Data:** data.export.team, compliance.audit.view

---

### Power User
**Description:** Advanced user with access to all models and features  
**Use Case:** Senior engineer, researcher with complex needs  
**Quota:** $2,000/month  

**Permissions:**
- **Auth & Users:** user.read.self, user.update.self
- **Workspaces:** workspace.* (all workspace perms)
- **Models:** model.use.* (all models)
- **RAG:** rag.query.all, rag.index.workspace
- **Agents:** agent.use.*, agent.create, agent.delete.own
- **Cost:** quota.view.own, cost.export
- **Collaboration:** collab.* (except admin)
- **Data:** data.export.own, data.delete.own

---

### Developer
**Description:** Standard engineering user, code-focused workflows  
**Use Case:** Software engineer, typical developer  
**Quota:** $500/month  

**Permissions:**
- **Auth & Users:** user.read.self, user.update.self
- **Workspaces:** workspace.create, workspace.*.own
- **Models:** model.use.mini, model.use.standard, model.use.bedrock.gov
- **RAG:** rag.query.skills, rag.query.agents, rag.query.workspace, rag.index.workspace
- **Agents:** agent.use.basic, agent.use.advanced
- **Cost:** quota.view.own
- **Collaboration:** collab.share.*, collab.view.shared
- **Data:** data.export.own

---

### Analyst
**Description:** Read-focused user, research and analysis workflows  
**Use Case:** Data analyst, business analyst, researcher  
**Quota:** $200/month  

**Permissions:**
- **Auth & Users:** user.read.self, user.update.self
- **Workspaces:** workspace.create, workspace.*.own
- **Models:** model.use.mini, model.use.standard
- **RAG:** rag.query.skills, rag.query.workspace
- **Agents:** agent.use.basic
- **Cost:** quota.view.own
- **Collaboration:** collab.view.shared
- **Data:** data.export.own

---

### Guest
**Description:** Limited trial access for evaluation  
**Use Case:** External collaborator, trial user  
**Quota:** $50/month  

**Permissions:**
- **Auth & Users:** user.read.self
- **Workspaces:** workspace.create (max 1), workspace.read.own
- **Models:** model.use.mini
- **RAG:** rag.query.skills
- **Agents:** agent.use.basic (limited to 10 calls/day)
- **Cost:** quota.view.own
- **Collaboration:** collab.view.shared

---

## Permission Matrix (Quick Reference)

| Permission Group | Super Admin | Admin | Power User | Developer | Analyst | Guest |
|------------------|-------------|-------|------------|-----------|---------|-------|
| User Management | ✅ Full | ✅ Most | ❌ Self only | ❌ Self only | ❌ Self only | ❌ Read only |
| Workspace Mgmt | ✅ All | ✅ View all | ✅ Full own | ✅ Full own | ✅ Own only | ⚠️ 1 workspace |
| Premium Models | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Standard Models | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mini Models | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gov Cloud Models | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Advanced Agents | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Custom Agents | ✅ | ✅ | ✅ Create | ❌ | ❌ | ❌ |
| RAG All Content | ✅ | ✅ | ✅ | ⚠️ Skills/Agents | ⚠️ Skills only | ⚠️ Skills only |
| Cost Management | ✅ All | ✅ Team | ⚠️ Own | ⚠️ Own | ⚠️ Own | ⚠️ Own |
| System Admin | ✅ | ⚠️ View only | ❌ | ❌ | ❌ | ❌ |

---

## Database Schema

### roles table
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,  -- Can't be deleted if true
    quota_monthly_usd DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### permissions table
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,  -- e.g., "model.use.premium"
    group_name VARCHAR(50) NOT NULL,     -- e.g., "model"
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### role_permissions table (many-to-many)
```sql
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### user_roles table (many-to-many)
```sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,  -- Optional time-limited roles
    PRIMARY KEY (user_id, role_id)
);
```

---

## Admin Panel UI (Conceptual)

### Role Management Screen

```
┌─────────────────────────────────────────────────────────────┐
│ Roles & Permissions                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ [+ Create New Role]                                          │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ✓ Super Admin (System)          [Edit] [View Users]   │   │
│ │ ✓ Admin (System)                [Edit] [View Users]   │   │
│ │ ✓ Power User (System)           [Edit] [View Users]   │   │
│ │ ✓ Developer (System)            [Edit] [View Users]   │   │
│ │ ✓ Analyst (System)              [Edit] [View Users]   │   │
│ │ ✓ Guest (System)                [Edit] [View Users]   │   │
│ │                                                         │   │
│ │ ✓ Research Lead (Custom)        [Edit] [Delete]       │   │
│ │ ✓ Contract Worker (Custom)      [Edit] [Delete]       │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Create/Edit Role Screen

```
┌─────────────────────────────────────────────────────────────┐
│ Edit Role: Developer                                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Role Name: [Developer                         ]              │
│ Display Name: [Developer                      ]              │
│ Description: [Standard engineering user, code workflows]     │
│ Monthly Quota: [$500                          ]              │
│                                                               │
│ ┌─── Permissions ───────────────────────────────────────┐   │
│ │                                                         │   │
│ │ ▼ Authentication & User Management                     │   │
│ │   ☑ user.read.self     - View own profile             │   │
│ │   ☑ user.update.self   - Update own profile           │   │
│ │   ☐ user.read.all      - View all users               │   │
│ │   ☐ user.create        - Create new users             │   │
│ │                                                         │   │
│ │ ▼ Workspace Management                                 │   │
│ │   ☑ workspace.create         - Create workspaces      │   │
│ │   ☑ workspace.read.own       - View own workspaces    │   │
│ │   ☑ workspace.update.own     - Modify own workspaces  │   │
│ │   ☑ workspace.delete.own     - Delete own workspaces  │   │
│ │   ☐ workspace.read.all       - View all workspaces    │   │
│ │                                                         │   │
│ │ ▼ AI Model Access                                      │   │
│ │   ☑ model.use.mini          - Mini models             │   │
│ │   ☑ model.use.standard      - Standard models         │   │
│ │   ☐ model.use.premium       - Premium models          │   │
│ │   ☑ model.use.bedrock.gov   - AWS Bedrock Gov        │   │
│ │   ☐ model.use.azure.gov     - Azure OpenAI Gov       │   │
│ │                                                         │   │
│ │ ▶ RAG & Knowledge                [Expand]              │   │
│ │ ▶ Agent Operations               [Expand]              │   │
│ │ ▶ Cost & Quotas                  [Expand]              │   │
│ │ ▶ Administration                 [Expand]              │   │
│ │ ▶ Collaboration                  [Expand]              │   │
│ │ ▶ Data & Compliance              [Expand]              │   │
│ │                                                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ [Cancel]                                        [Save Role]  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Role Management
```
GET    /api/v1/roles                      - List all roles
GET    /api/v1/roles/{id}                 - Get role details
POST   /api/v1/roles                      - Create new role
PUT    /api/v1/roles/{id}                 - Update role
DELETE /api/v1/roles/{id}                 - Delete role (custom only)

GET    /api/v1/permissions                - List all permissions
GET    /api/v1/permissions/groups         - List permission groups
```

### Role Assignment
```
GET    /api/v1/users/{id}/roles           - Get user's roles
POST   /api/v1/users/{id}/roles           - Assign role to user
DELETE /api/v1/users/{id}/roles/{role_id} - Remove role from user
```

### Permission Checking
```
POST   /api/v1/permissions/check          - Check if user has permission
Body: {"user_id": "uuid", "permission": "model.use.premium"}
Response: {"has_permission": true|false, "reason": "..."}
```

---

## Permission Enforcement (Code)

### Decorator for FastAPI Endpoints
```python
from functools import wraps
from fastapi import HTTPException, Depends

def require_permission(permission: str):
    """Decorator to enforce permission on endpoint."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user = Depends(get_current_user), **kwargs):
            if not await has_permission(current_user.id, permission):
                raise HTTPException(
                    status_code=403,
                    detail=f"Missing required permission: {permission}"
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Usage
@app.post("/api/v1/workspaces")
@require_permission("workspace.create")
async def create_workspace(data: WorkspaceCreate, current_user: User):
    # User has workspace.create permission
    workspace = await db.workspaces.create(user_id=current_user.id, **data.dict())
    return workspace
```

### Permission Check Function
```python
async def has_permission(user_id: str, permission: str) -> bool:
    """Check if user has a specific permission."""
    query = """
        SELECT EXISTS(
            SELECT 1
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = $1
              AND p.name = $2
              AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
    """
    result = await db.fetch_one(query, [user_id, permission])
    return result["exists"]
```

---

## Implementation Priority (MVP 7)

1. **Database Schema** - Create tables for roles, permissions, role_permissions, user_roles
2. **Seed Default Roles** - Insert 6 conventional roles with permissions
3. **Permission Enforcement** - `@require_permission` decorator
4. **Role Assignment API** - Endpoints for assigning roles to users
5. **Admin UI** - React components for role/permission management
6. **Permission Check API** - Endpoint to check permissions
7. **Custom Role Creation** - UI for creating custom roles
8. **Role Export/Import** - JSON format for role templates

---

**Status:** ✅ Permission system designed  
**Next:** Implement in MVP 7 (Advanced RBAC + Cost Controls)

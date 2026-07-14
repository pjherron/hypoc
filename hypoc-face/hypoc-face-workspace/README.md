# Hypoc-Face Workspace - Workspace Isolation & Management

**Status:** 🚧 Coming in Phase 4  
**Tech Stack:** FastAPI, Docker, Kubernetes, NFS/EFS  

## Purpose

The **hypoc-face-workspace** service manages isolated development environments for each user:

- 📁 **Workspace Isolation** - Each user gets isolated filesystem and processes
- 🔒 **Security Boundaries** - Prevent cross-user access
- 💾 **Persistent Storage** - User files persist across sessions
- 🎛️ **Resource Limits** - CPU, memory, disk quotas per workspace
- 🚀 **Fast Provisioning** - Spin up workspaces in < 10 seconds
- 🧹 **Automatic Cleanup** - Delete inactive workspaces after 30 days

## Architecture

```
┌──────────────────┐
│   OpenCode Web   │
│   (Per-User)     │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│ hypoc-face-workspace   │
│    FastAPI       │
├──────────────────┤
│ - Create WS      │
│ - Delete WS      │
│ - List WS        │
│ - Resource mgmt  │
└────────┬─────────┘
         │
    ┌────┴────┐
    v         v
┌────────┐ ┌──────────────┐
│Docker  │ │Kubernetes    │
│(local) │ │(production)  │
└────────┘ └──────────────┘
         │
         v
┌──────────────────┐
│ Persistent Store │
│ (NFS/EFS/PVC)    │
│                  │
│ /workspaces/     │
│   ├─ user1/      │
│   ├─ user2/      │
│   └─ user3/      │
└──────────────────┘
```

## Workspace Lifecycle

```
1. User logs in
   ↓
2. Check for existing workspace
   ↓
3. If none, create new workspace container
   ↓
4. Mount user's persistent storage
   ↓
5. Apply resource limits (CPU, memory, disk)
   ↓
6. Inject user context (git config, SSH keys)
   ↓
7. Start OpenCode web process
   ↓
8. Return workspace URL
   ↓
9. User works in isolated environment
   ↓
10. On logout, workspace persists (files saved)
    ↓
11. After 30 days inactivity, auto-delete
```

## API Endpoints (Planned)

### Workspace Management
- `POST /api/v1/workspaces` - Create new workspace
- `GET /api/v1/workspaces` - List user's workspaces
- `GET /api/v1/workspaces/{id}` - Get workspace details
- `DELETE /api/v1/workspaces/{id}` - Delete workspace
- `POST /api/v1/workspaces/{id}/start` - Start stopped workspace
- `POST /api/v1/workspaces/{id}/stop` - Stop running workspace

### Resource Management
- `GET /api/v1/workspaces/{id}/resources` - Current resource usage
- `PATCH /api/v1/workspaces/{id}/resources` - Update resource limits
- `GET /api/v1/workspaces/{id}/disk` - Disk usage breakdown

### File Operations
- `GET /api/v1/workspaces/{id}/files` - List files in workspace
- `POST /api/v1/workspaces/{id}/upload` - Upload files
- `GET /api/v1/workspaces/{id}/download` - Download workspace as zip

## Workspace Structure

```
/workspaces/{user_id}/
├── .hypoc-face/
│   ├── config.json        # Workspace metadata
│   ├── history.log        # Activity log
│   └── resources.json     # Resource usage tracking
├── projects/
│   ├── project1/
│   ├── project2/
│   └── project3/
├── .ssh/                  # User SSH keys
├── .gitconfig             # User git config
└── .opencode/
    ├── skills/            # User custom skills
    ├── agents/            # User custom agents
    └── commands/          # User custom commands
```

## Resource Limits (Per User Tier)

```python
RESOURCE_LIMITS = {
    "basic": {
        "cpu": "1.0",           # 1 CPU core
        "memory": "2Gi",        # 2 GB RAM
        "disk": "10Gi",         # 10 GB storage
        "max_workspaces": 1
    },
    "pro": {
        "cpu": "2.0",           # 2 CPU cores
        "memory": "8Gi",        # 8 GB RAM
        "disk": "50Gi",         # 50 GB storage
        "max_workspaces": 3
    },
    "unlimited": {
        "cpu": "4.0",           # 4 CPU cores
        "memory": "16Gi",       # 16 GB RAM
        "disk": "200Gi",        # 200 GB storage
        "max_workspaces": 10
    }
}
```

## Docker Implementation (Local Dev)

```yaml
# docker-compose.yml snippet
services:
  workspace-user1:
    image: hypoc-face-opencode-web:latest
    container_name: ws-user1
    volumes:
      - /workspaces/user1:/workspace:rw
    environment:
      - USER_ID=user1
      - WORKSPACE_ID=ws-abc123
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
    networks:
      - hypoc-face-network
```

## Kubernetes Implementation (Production)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: workspace-user1
  labels:
    app: hypoc-face-workspace
    user: user1
spec:
  containers:
  - name: opencode-web
    image: hypoc-face-opencode-web:latest
    resources:
      requests:
        memory: "2Gi"
        cpu: "1000m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
    volumeMounts:
    - name: workspace-storage
      mountPath: /workspace
  volumes:
  - name: workspace-storage
    persistentVolumeClaim:
      claimName: pvc-user1
  securityContext:
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
```

## Security Boundaries

### 1. Filesystem Isolation
- Each workspace mounted to unique path
- No cross-user directory access
- Read-only system directories

### 2. Network Isolation
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: workspace-isolation
spec:
  podSelector:
    matchLabels:
      app: hypoc-face-workspace
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: hypoc-face-core
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: hypoc-face-rag
  - to:
    - podSelector:
        matchLabels:
          app: hypoc-face-router
```

### 3. Process Isolation
- Each workspace runs as unique UID
- No privileged containers
- seccomp and AppArmor profiles enabled

### 4. Resource Limits
- CPU throttling enforced
- Memory limits with OOM kill
- Disk quotas with monitoring

## Cleanup Policy

```python
# Automatic cleanup rules
CLEANUP_RULES = {
    "inactive_days": 30,        # Delete after 30 days no activity
    "max_disk_usage": 0.95,     # Warn at 95% disk usage
    "soft_delete_days": 7,      # Retain in "trash" for 7 days
    "backup_before_delete": True
}

# Cleanup job (runs daily)
async def cleanup_workspaces():
    workspaces = await get_inactive_workspaces(days=30)
    for ws in workspaces:
        # Backup workspace
        await backup_workspace(ws.id)
        
        # Soft delete (move to trash)
        await soft_delete_workspace(ws.id)
        
        # Notify user
        await notify_user(ws.user_id, "workspace_cleanup", ws.id)
```

## Environment Variables

```bash
# Docker/K8s
CONTAINER_RUNTIME=kubernetes  # or docker
KUBECONFIG_PATH=/etc/kube/config

# Storage
STORAGE_BACKEND=nfs  # or efs, local, ceph
NFS_SERVER=nfs.gtri.example.edu
NFS_PATH=/exports/hypoc-face-workspaces

# Resource limits
DEFAULT_CPU_LIMIT=1.0
DEFAULT_MEMORY_LIMIT=2Gi
DEFAULT_DISK_LIMIT=10Gi

# Cleanup
CLEANUP_ENABLED=true
CLEANUP_CRON="0 2 * * *"  # 2 AM daily
INACTIVE_DAYS=30

# Application
LOG_LEVEL=info
```

## Development

```bash
# Install dependencies
cd hypoc-face-workspace
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8003

# Create workspace (local Docker)
curl -X POST http://localhost:8003/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "tier": "pro"}'

# List workspaces
curl http://localhost:8003/api/v1/workspaces?user_id=test-user

# Delete workspace
curl -X DELETE http://localhost:8003/api/v1/workspaces/{id}

# Run tests
pytest
```

## Phase 4 Implementation Tasks

- [ ] FastAPI project structure
- [ ] Docker client integration (local dev)
- [ ] Kubernetes client integration (production)
- [ ] Workspace creation/deletion logic
- [ ] Resource limit enforcement
- [ ] Persistent storage mounting (NFS/EFS)
- [ ] User context injection (git, SSH)
- [ ] Disk usage tracking
- [ ] Cleanup job scheduler
- [ ] Backup before delete
- [ ] Activity tracking
- [ ] User notification system
- [ ] Unit tests and integration tests
- [ ] Load testing (100+ concurrent workspaces)
- [ ] Dockerfile and docker-compose integration

## Dependencies (Phase 4)

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
docker==7.0.0
kubernetes==29.0.0
redis==5.0.1
psutil==5.9.8  # Resource monitoring
aiofiles==23.2.1  # Async file operations
pydantic==2.5.3
pytest==8.0.0
httpx==0.26.0
```

## Performance Targets

- **Workspace creation:** < 10 seconds
- **Workspace deletion:** < 5 seconds
- **Disk usage check:** < 1 second
- **Concurrent workspaces:** 100+ per node

## Monitoring Metrics

```python
# Prometheus metrics
workspace_creation_duration_seconds
workspace_deletion_duration_seconds
workspace_disk_usage_bytes
workspace_cpu_usage_percent
workspace_memory_usage_bytes
active_workspaces_total
inactive_workspaces_total
```

## Storage Backend Comparison

| Backend | Speed | Cost | Scalability | [Org] Fit |
|---------|-------|------|-------------|----------|
| **Local Disk** | Fast | Low | Poor | Dev only |
| **NFS** | Medium | Low | Good | ✅ [Org] standard |
| **AWS EFS** | Medium | Medium | Excellent | ☁️ If AWS |
| **Ceph** | Fast | Medium | Excellent | 🏢 Enterprise |
| **GlusterFS** | Fast | Low | Good | Alternative |

**Recommendation:** NFS for [Org] on-prem, EFS if deploying to AWS.

---

**Next Steps:** Awaiting Phase 4 kickoff after Phase 3 completes.

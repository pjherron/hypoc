---
name: kubernetes-patterns
description: Kubernetes deployment patterns, manifests, helm charts, service mesh, autoscaling, monitoring, and production-ready cluster management.
origin: Custom
---

# Kubernetes Patterns

Production-ready Kubernetes deployment and operations patterns.

## When to Activate

- Deploying applications to Kubernetes
- Writing K8s manifests or Helm charts
- Setting up ingress, services, autoscaling
- Implementing monitoring and logging
- Managing secrets and ConfigMaps
- Troubleshooting cluster issues

## Core Concepts

### Pod - Smallest Deployable Unit

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  containers:
  - name: app
    image: myapp:1.0
    ports:
    - containerPort: 8000
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: url
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"
    livenessProbe:
      httpGet:
        path: /health
        port: 8000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Deployment - Manages ReplicaSets

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1
    spec:
      containers:
      - name: app
        image: myapp:1.0
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: myapp-config
        - secretRef:
            name: myapp-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Service - Network Abstraction

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP  # Internal only
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-external
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBhypoccer  # External access
```

### Ingress - HTTP(S) Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

### ConfigMap - Configuration Data

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  API_TIMEOUT: "30"
  config.yaml: |
    database:
      pool_size: 10
      timeout: 5
```

### Secret - Sensitive Data

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
stringData:
  DB_PASSWORD: "my-secret-password"
  API_KEY: "sk-xxxxx"
---
# Reference in Pod
spec:
  containers:
  - name: app
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: myapp-secrets
          key: DB_PASSWORD
```

## Autoscaling

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

### Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: myapp-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  updatePolicy:
    updateMode: "Auto"  # or "Off" for recommendations only
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2
        memory: 2Gi
```

## Persistent Storage

### PersistentVolumeClaim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: gp3  # AWS EBS gp3
---
# Use in Pod
spec:
  containers:
  - name: postgres
    image: postgres:15
    volumeMounts:
    - name: data
      mountPath: /var/lib/postgresql/data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: postgres-data
```

## Jobs & CronJobs

### Job - Run to Completion

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-migration
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: myapp:1.0
        command: ["python", "manage.py", "migrate"]
      restartPolicy: OnFailure
  backoffLimit: 3
```

### CronJob - Scheduled Tasks

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: myapp:1.0
            command: ["python", "scripts/backup.py"]
          restartPolicy: OnFailure
```

## Monitoring & Logging

### Prometheus Annotations

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
    prometheus.io/path: "/metrics"
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8000
```

### Logging to stdout/stderr

```python
import logging
import sys

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}',
    stream=sys.stdout
)

logger = logging.getLogger(__name__)
logger.info("Application started", extra={"version": "1.0"})
```

## Security

### Pod Security Standards

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    volumeMounts:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}
```

### NetworkPolicy - Firewall Rules

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:  # Allow DNS
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

## Helm Charts

### Chart Structure

```
myapp/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl
```

### values.yaml

```yaml
replicaCount: 3

image:
  repository: myapp
  tag: "1.0"
  pullPolicy: IfNotPresent

resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com
```

### Helm Commands

```bash
# Install
helm install myapp ./myapp -f values-prod.yaml

# Upgrade
helm upgrade myapp ./myapp -f values-prod.yaml

# Rollback
helm rollback myapp 1

# List releases
helm list

# Get values
helm get values myapp
```

## kubectl Commands

```bash
# Apply manifests
kubectl apply -f deployment.yaml

# Get resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get ingress

# Describe resource
kubectl describe pod myapp-xxx

# View logs
kubectl logs myapp-xxx
kubectl logs -f myapp-xxx  # Follow
kubectl logs myapp-xxx --previous  # Previous container

# Execute command
kubectl exec -it myapp-xxx -- bash

# Port forward
kubectl port-forward svc/myapp 8000:80

# Scale deployment
kubectl scale deployment myapp --replicas=5

# Delete resources
kubectl delete -f deployment.yaml
kubectl delete pod myapp-xxx

# Namespace operations
kubectl get pods -n production
kubectl config set-context --current --namespace=production

# Resource usage
kubectl top nodes
kubectl top pods
```

## Troubleshooting

### Pod Won't Start

```bash
# Check pod status
kubectl describe pod myapp-xxx

# Common issues:
# - ImagePullBackOff: Image doesn't exist or no pull credentials
# - CrashLoopBackOff: Container exits immediately
# - Pending: Insufficient resources or scheduling constraints

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check logs
kubectl logs myapp-xxx --previous
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints myapp

# If empty, selector doesn't match pods
kubectl get pods --show-labels

# Test from another pod
kubectl run -it --rm debug --image=nicolaka/netshoot -- bash
curl myapp.default.svc.cluster.local
```

### High Resource Usage

```bash
# Check resource usage
kubectl top pods

# Describe pod for limits
kubectl describe pod myapp-xxx

# Check HPA status
kubectl get hpa
kubectl describe hpa myapp-hpa
```

## Production Best Practices

1. **Always set resource requests and limits**
2. **Use health checks** (liveness + readiness)
3. **Run multiple replicas** (min 2 for HA)
4. **Use anti-affinity** to spread pods across nodes
5. **Enable autoscaling** (HPA)
6. **Use namespaces** for isolation
7. **Apply security contexts** (non-root, read-only FS)
8. **Use NetworkPolicies** for network isolation
9. **Store secrets in external vault** (not in K8s secrets)
10. **Tag all images** (never use :latest in prod)

## Related Skills

- `docker-patterns` - Container best practices
- `deployment-patterns` - CI/CD workflows
- `aws-infrastructure` - EKS setup
- `security-review` - Security checklist

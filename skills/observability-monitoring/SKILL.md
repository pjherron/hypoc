---
name: "Observability & Monitoring"
description: "Implement structured logging, metrics, distributed tracing, and alerting for production systems. Use when adding observability to applications, debugging production issues, setting up monitoring dashboards, or implementing SLOs/SLIs."
---

# Observability & Monitoring

Comprehensive patterns for making systems observable and maintainable in production.

## When to Activate

- Adding observability to a new service
- Debugging production issues
- Setting up monitoring dashboards
- Implementing alerts and on-call rotation
- Optimizing system performance
- Meeting SLA/SLO requirements
- Preparing for production deployment

## Core Principles

### The Three Pillars

1. **Logs** - What happened and when (events)
2. **Metrics** - How much and how fast (measurements)
3. **Traces** - Where time was spent (distributed calls)

### Observability vs Monitoring

**Monitoring**: Known unknowns - "Is the system up?"
**Observability**: Unknown unknowns - "Why is it slow for users in region X?"

Good observability lets you ask questions you didn't anticipate.

---

## 1. Structured Logging

### Log Levels

```
ERROR   - System malfunction, requires immediate attention
WARN    - Degraded state, may require attention
INFO    - Normal operations, key events
DEBUG   - Detailed diagnostic info (disabled in production)
TRACE   - Very detailed (never in production)
```

### Structured Logging Pattern

```typescript
// BAD: Unstructured logging
console.log('User login failed for bob@example.com')

// GOOD: Structured logging
logger.error('user_login_failed', {
  userId: user.id,
  email: user.email,
  reason: 'invalid_password',
  ip: request.ip,
  timestamp: new Date().toISOString(),
  requestId: request.id
})
```

### Python (JSON Logging)

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name,
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add custom fields
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
            
        return json.dumps(log_data)

# Setup
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger(__name__)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usage
logger.info('User login successful', extra={
    'user_id': user.id,
    'request_id': request_id,
    'duration_ms': 234
})
```

### Node.js (Winston)

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'api-service',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})

// Usage
logger.info('Payment processed', {
  userId: user.id,
  paymentId: payment.id,
  amount: payment.amount,
  currency: payment.currency,
  duration_ms: Date.now() - startTime
})
```

### What to Log

**DO log:**
- Request/response for API calls
- Authentication events (login, logout, token refresh)
- Authorization failures
- Database queries (slow ones)
- External API calls (with duration)
- Business events (payment, order, signup)
- Errors with full context

**DON'T log:**
- Passwords, tokens, API keys
- Credit card numbers, SSNs, PII
- Full request bodies (may contain secrets)
- Binary data

---

## 2. Metrics

### Key Metrics (RED Method)

**Rate** - Requests per second
**Errors** - Error rate
**Duration** - Latency (p50, p95, p99)

### Golden Signals (Google SRE)

**Latency** - How long requests take
**Traffic** - How much demand
**Errors** - Rate of failed requests
**Saturation** - How full the system is

### Prometheus Pattern (Node.js)

```typescript
import prometheus from 'prom-client'

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5]
})

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
})

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now()
  
  activeConnections.inc()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: res.statusCode
    }, duration)
    
    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: res.statusCode
    })
    
    activeConnections.dec()
  })
  
  next()
})

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType)
  res.end(await prometheus.register.metrics())
})
```

### Custom Business Metrics

```typescript
const paymentsProcessed = new prometheus.Counter({
  name: 'payments_processed_total',
  help: 'Total payments processed',
  labelNames: ['currency', 'status']
})

const paymentAmount = new prometheus.Histogram({
  name: 'payment_amount_dollars',
  help: 'Payment amounts in USD',
  buckets: [1, 10, 50, 100, 500, 1000, 5000]
})

// Usage
paymentsProcessed.inc({ currency: 'USD', status: 'success' })
paymentAmount.observe(payment.amount)
```

### Python (Prometheus Client)

```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Define metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

active_users = Gauge(
    'active_users',
    'Number of active users'
)

# Middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    http_request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

---

## 3. Distributed Tracing

### OpenTelemetry Pattern (Node.js)

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'

const sdk = new NodeSDK({
  serviceName: 'api-service',
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start()

// Manual tracing
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('api-service')

async function processPayment(payment: Payment) {
  return await tracer.startActiveSpan('process_payment', async (span) => {
    span.setAttribute('payment.id', payment.id)
    span.setAttribute('payment.amount', payment.amount)
    
    try {
      // Validate payment
      await tracer.startActiveSpan('validate_payment', async (validateSpan) => {
        await validatePayment(payment)
        validateSpan.end()
      })
      
      // Charge card
      await tracer.startActiveSpan('charge_card', async (chargeSpan) => {
        const result = await stripeClient.charge(payment)
        chargeSpan.setAttribute('stripe.charge_id', result.id)
        chargeSpan.end()
        return result
      })
      
      span.setStatus({ code: SpanStatusCode.OK })
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}
```

### Python (OpenTelemetry)

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# Setup
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

tracer = trace.get_tracer(__name__)

# Usage
@tracer.start_as_current_span("process_order")
def process_order(order_id: str):
    span = trace.get_current_span()
    span.set_attribute("order.id", order_id)
    
    with tracer.start_as_current_span("fetch_order"):
        order = fetch_order(order_id)
    
    with tracer.start_as_current_span("validate_inventory"):
        validate_inventory(order)
    
    with tracer.start_as_current_span("charge_payment"):
        charge_payment(order)
    
    span.set_status(trace.Status(trace.StatusCode.OK))
```

---

## 4. Alerting

### Alert Design Principles

1. **Alert on symptoms, not causes** - "API is slow" not "CPU is high"
2. **Actionable alerts only** - Every alert must require action
3. **Avoid alert fatigue** - Too many alerts = ignored alerts
4. **Include context** - Runbook link, related dashboards

### Alert Thresholds

```yaml
# Prometheus AlertManager rules
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # Error rate too high
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m]) 
          / rate(http_requests_total[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate on {{ $labels.instance }}"
          description: "Error rate is {{ $value | humanizePercentage }}"
          runbook_url: "https://wiki.company.com/runbooks/high-error-rate"
      
      # Latency too high
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket[5m])
          ) > 1
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High latency on {{ $labels.instance }}"
          description: "P95 latency is {{ $value }}s"
      
      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          runbook_url: "https://wiki.company.com/runbooks/service-down"
```

### Alert Severity Levels

| Severity | Response Time | Examples |
|----------|---------------|----------|
| Critical | Immediate | Service down, data loss |
| High | 15 minutes | High error rate, severe degradation |
| Medium | 1 hour | Elevated latency, partial outage |
| Low | Next business day | Capacity warning, minor issues |

---

## 5. Dashboards

### Dashboard Design

**Four Golden Dashboard Types:**

1. **Service Dashboard** - Health of one service
2. **User Journey Dashboard** - End-to-end user experience
3. **Resource Dashboard** - Infrastructure usage
4. **Business Dashboard** - Business metrics

### Grafana Dashboard Example

```json
{
  "dashboard": {
    "title": "API Service Health",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])"
        }],
        "type": "graph",
        "alert": {
          "conditions": [{
            "evaluator": { "type": "gt", "params": [0.01] }
          }]
        }
      },
      {
        "title": "Latency (P50, P95, P99)",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P99"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## 6. SLOs & SLIs

### Service Level Indicators (SLIs)

Quantitative measure of service level:
- **Availability**: % of successful requests
- **Latency**: % of requests served faster than threshold
- **Throughput**: Requests per second
- **Correctness**: % of correct responses

### Service Level Objectives (SLOs)

Target value for an SLI:
- Availability: 99.9% (three nines)
- Latency: 95% of requests < 500ms
- Error rate: < 0.1%

### Error Budget

```
Error Budget = 100% - SLO

If SLO = 99.9%, Error Budget = 0.1%
= 43 minutes downtime per month
= 8.76 hours per year
```

### SLO Implementation

```typescript
// Calculate SLO compliance
const availability = {
  slo: 0.999,  // 99.9%
  window: '30d'
}

const query = `
  sum(rate(http_requests_total{status_code!~"5.."}[30d]))
  /
  sum(rate(http_requests_total[30d]))
`

// Alert when error budget exhausted
const errorBudgetAlert = `
  (1 - availability) > (1 - ${availability.slo}) * 0.1
`
// Alert when consumed 90% of error budget
```

---

## 7. Production Debugging

### Debug Checklist

When investigating production issues:

1. **Check dashboards** - Is this a known issue?
2. **Check recent deploys** - Did something change?
3. **Check logs** - What errors are occurring?
4. **Check traces** - Where is time spent?
5. **Check metrics** - What changed?
6. **Check alerts** - What else is firing?

### Log Aggregation Query Patterns

```
# Elasticsearch/Kibana
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "ERROR" }},
        { "range": { "@timestamp": { "gte": "now-1h" }}}
      ],
      "filter": [
        { "term": { "service": "api" }}
      ]
    }
  },
  "aggs": {
    "error_types": {
      "terms": { "field": "error.type" }
    }
  }
}
```

### Request ID Tracking

```typescript
// Middleware to add request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID()
  res.setHeader('X-Request-ID', req.id)
  next()
})

// Include in all logs
logger.info('Processing request', {
  requestId: req.id,
  method: req.method,
  path: req.path
})

// Pass to downstream services
await fetch(url, {
  headers: {
    'X-Request-ID': req.id
  }
})
```

---

## 8. Performance Profiling

### Application Performance Monitoring (APM)

```typescript
// Node.js Clinic.js
import clinic from 'clinic'

const doctor = clinic.doctor()
doctor.collect(['node', 'app.js'], (err, result) => {
  // Analyze flame graphs
})
```

### Python Profiling

```python
import cProfile
import pstats

# Profile function
profiler = cProfile.Profile()
profiler.enable()

expensive_function()

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)
```

### Memory Leak Detection

```typescript
// Node.js heap snapshots
import v8 from 'v8'
import fs from 'fs'

function takeHeapSnapshot() {
  const filename = `heap-${Date.now()}.heapsnapshot`
  const snapshot = v8.writeHeapSnapshot(filename)
  console.log(`Heap snapshot written to ${snapshot}`)
}

// Take snapshots periodically
setInterval(takeHeapSnapshot, 60000)  // Every minute
```

---

## Quick Reference

### Observability Stack Options

| Component | Options |
|-----------|---------|
| Logs | ELK Stack, Loki, CloudWatch Logs, Datadog |
| Metrics | Prometheus + Grafana, Datadog, New Relic |
| Traces | Jaeger, Zipkin, Datadog APM, AWS X-Ray |
| All-in-one | Datadog, New Relic, Dynatrace, Honeycomb |

### Checklist: Production Readiness

- [ ] Structured JSON logging in place
- [ ] Log levels appropriate (INFO in prod, not DEBUG)
- [ ] No secrets in logs
- [ ] Metrics exported (RED method minimum)
- [ ] Distributed tracing implemented
- [ ] Dashboards created (service health + business metrics)
- [ ] Alerts configured with runbooks
- [ ] SLOs defined and measured
- [ ] On-call rotation established
- [ ] Runbooks written for common issues

---

## Related Skills

- `deployment-patterns` - Safe deployment strategies
- `verification-loop` - Pre-deployment validation
- `security-review` - Security logging requirements
- `incident-response` - What to do when alerts fire

---

**Remember**: You can't fix what you can't see. Observability is not optional for production systems.

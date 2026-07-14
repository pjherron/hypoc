---
name: "API Contract Testing"
description: "Comprehensive API contract testing patterns using OpenAPI/Swagger validation, Pact consumer-driven contracts, JSON Schema, and breaking change detection. Use when building APIs, implementing contract-first development, validating API changes, or setting up consumer-driven contract testing between services."
---

# API Contract Testing

## What This Skill Does

Implements comprehensive API contract testing strategies to ensure API compatibility, catch breaking changes early, and enable safe independent service deployment through contract-first development and consumer-driven contract testing.

## Prerequisites

- Node.js 18+ or Python 3.9+
- API specification (OpenAPI/Swagger) or ability to generate one
- Test framework (Jest, Vitest, pytest)
- Basic understanding of REST APIs and JSON Schema

## Quick Start

### Node.js with OpenAPI Validation

```bash
npm install --save-dev @apidevtools/swagger-parser ajv

# Validate OpenAPI spec
npx swagger-cli validate openapi.yaml

# Run contract tests
npm test -- contract.test.ts
```

### Python with Schemathesis

```bash
pip install schemathesis pytest

# Generate and run contract tests from OpenAPI spec
schemathesis run https://api.example.com/openapi.json --checks all
```

---

## Core Concepts

### Contract Testing vs Integration Testing

| Aspect | Integration Testing | Contract Testing |
|--------|-------------------|-----------------|
| **Scope** | Full service-to-service communication | API interface contracts only |
| **Dependencies** | Requires all services running | Uses mock providers |
| **Speed** | Slower (network, databases) | Fast (in-memory mocks) |
| **Brittleness** | Breaks when any service changes | Breaks only on contract violations |
| **When** | Post-deployment verification | Pre-deployment validation |
| **Purpose** | Validate end-to-end behavior | Validate interface compatibility |

**Use contract testing for:**
- Catching breaking API changes before deployment
- Enabling independent service deployment
- Fast feedback in CI/CD pipelines
- Consumer-provider compatibility validation

**Use integration testing for:**
- Validating business logic across services
- Testing error scenarios and edge cases
- Verifying database transactions
- End-to-end workflow validation

---

## OpenAPI/Swagger Contract Validation

### Contract-First Development Workflow

```
1. Design API contract (OpenAPI spec)
2. Generate server stubs and client SDKs
3. Implement endpoints to satisfy contract
4. Run contract tests to validate compliance
5. Deploy with confidence
```

### Validating Responses Against OpenAPI Spec

#### Node.js with OpenAPI Backend Validator

```typescript
import { OpenAPIBackend } from 'openapi-backend'
import { test, expect } from '@jest/globals'

const api = new OpenAPIBackend({
  definition: './openapi.yaml',
  strict: true,
  validate: true
})

await api.init()

test('GET /users returns valid response', async () => {
  const response = await fetch('http://localhost:3000/api/users')
  const data = await response.json()

  // Validate response against OpenAPI spec
  const validation = api.validateResponse(data, {
    operation: {
      operationId: 'listUsers',
      method: 'get',
      path: '/users'
    },
    status: response.status
  })

  expect(validation.errors).toBeUndefined()
})

test('POST /users validates request body', async () => {
  const invalidUser = { email: 'not-an-email' } // Missing required fields

  const validation = api.validateRequest({
    method: 'post',
    path: '/users',
    body: invalidUser
  })

  expect(validation.errors).toBeDefined()
  expect(validation.errors).toContainEqual(
    expect.objectContaining({
      path: '.name',
      message: expect.stringContaining('required')
    })
  )
})
```

#### Python with Schemathesis

```python
import schemathesis

schema = schemathesis.from_path("openapi.yaml")

@schema.parametrize()
def test_api_contract(case):
    """
    Automatically generates tests for all endpoints.
    Validates:
    - Request parameters match schema
    - Response status codes are documented
    - Response bodies match schema
    - No undocumented errors
    """
    case.call_and_validate()

# Run specific checks
@schema.parametrize()
@schemathesis.check
def test_response_time(response, case):
    """Custom check: response time under 500ms"""
    assert response.elapsed.total_seconds() < 0.5

@schema.parametrize()
@schemathesis.check
def test_content_type(response, case):
    """Custom check: correct content type"""
    assert response.headers.get("Content-Type") == "application/json"
```

### Breaking Change Detection

```typescript
import SwaggerParser from '@apidevtools/swagger-parser'
import { diff } from 'openapi-diff'

async function detectBreakingChanges(
  oldSpec: string,
  newSpec: string
): Promise<BreakingChange[]> {
  const result = await diff(oldSpec, newSpec)

  const breakingChanges: BreakingChange[] = []

  // Breaking: Removed endpoint
  if (result.breakingDifferencesFound) {
    result.breakingDifferences.forEach(change => {
      if (change.type === 'remove' && change.action === 'delete') {
        breakingChanges.push({
          type: 'REMOVED_ENDPOINT',
          path: change.path,
          method: change.method,
          severity: 'CRITICAL'
        })
      }

      // Breaking: Removed required field
      if (change.type === 'remove' && change.property === 'required') {
        breakingChanges.push({
          type: 'REMOVED_REQUIRED_FIELD',
          path: change.path,
          field: change.field,
          severity: 'HIGH'
        })
      }

      // Breaking: Changed response type
      if (change.type === 'edit' && change.property === 'type') {
        breakingChanges.push({
          type: 'CHANGED_RESPONSE_TYPE',
          path: change.path,
          from: change.oldValue,
          to: change.newValue,
          severity: 'HIGH'
        })
      }
    })
  }

  return breakingChanges
}

// CI/CD integration
test('API has no breaking changes', async () => {
  const changes = await detectBreakingChanges(
    'specs/v1.0.0.yaml',
    'specs/v1.1.0.yaml'
  )

  const criticalChanges = changes.filter(c => c.severity === 'CRITICAL')

  expect(criticalChanges).toHaveLength(0)
})
```

---

## Pact Consumer-Driven Contract Testing

### Consumer-Provider Model

```
Consumer (Frontend/Service A)
  ↓ defines expected interactions
Pact Contract (JSON)
  ↓ shared with provider
Provider (Backend/Service B)
  ↓ verifies can satisfy contract
```

### Consumer Side (Node.js)

```typescript
import { PactV3, MatchersV3 } from '@pact-foundation/pact'
import { UserService } from './UserService'

const { like, eachLike } = MatchersV3

const provider = new PactV3({
  consumer: 'UserFrontend',
  provider: 'UserAPI',
  dir: './pacts'
})

describe('User API Contract', () => {
  test('get user by id', async () => {
    await provider
      .given('user with id 123 exists')
      .uponReceiving('a request for user 123')
      .withRequest({
        method: 'GET',
        path: '/users/123',
        headers: { Accept: 'application/json' }
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          id: '123',
          email: 'alice@example.com',
          name: 'Alice',
          created_at: '2025-01-01T00:00:00Z'
        })
      })

    await provider.executeTest(async (mockServer) => {
      const api = new UserService(mockServer.url)
      const user = await api.getUser('123')

      expect(user.id).toBe('123')
      expect(user.email).toBe('alice@example.com')
    })
  })

  test('list users with pagination', async () => {
    await provider
      .given('multiple users exist')
      .uponReceiving('a request for users list')
      .withRequest({
        method: 'GET',
        path: '/users',
        query: { page: '1', limit: '10' }
      })
      .willRespondWith({
        status: 200,
        body: {
          data: eachLike({
            id: like('abc-123'),
            email: like('user@example.com'),
            name: like('User Name')
          }),
          meta: like({
            total: 42,
            page: 1,
            limit: 10
          })
        }
      })

    await provider.executeTest(async (mockServer) => {
      const api = new UserService(mockServer.url)
      const result = await api.listUsers({ page: 1, limit: 10 })

      expect(result.data).toBeInstanceOf(Array)
      expect(result.meta.total).toBeGreaterThan(0)
    })
  })
})
```

### Provider Side (Verification)

```typescript
import { Verifier } from '@pact-foundation/pact'
import { startServer } from './server'

describe('Pact Verification', () => {
  let server: any

  beforeAll(async () => {
    server = await startServer(3001)
  })

  afterAll(async () => {
    await server.close()
  })

  test('validates pacts from consumers', async () => {
    const verifier = new Verifier({
      provider: 'UserAPI',
      providerBaseUrl: 'http://localhost:3001',
      pactUrls: ['./pacts/UserFrontend-UserAPI.json'],
      stateHandlers: {
        'user with id 123 exists': async () => {
          // Set up test data
          await db.users.create({
            id: '123',
            email: 'alice@example.com',
            name: 'Alice'
          })
        },
        'multiple users exist': async () => {
          await db.users.createMany([
            { id: '1', email: 'user1@example.com', name: 'User 1' },
            { id: '2', email: 'user2@example.com', name: 'User 2' }
          ])
        }
      }
    })

    await verifier.verifyProvider()
  })
})
```

### Python with Pact

```python
import pytest
from pact import Consumer, Provider, Like, EachLike

pact = Consumer('UserFrontend').has_pact_with(Provider('UserAPI'))

def test_get_user():
    expected = {
        'id': '123',
        'email': 'alice@example.com',
        'name': 'Alice'
    }

    (pact
     .given('user with id 123 exists')
     .upon_receiving('a request for user 123')
     .with_request('GET', '/users/123')
     .will_respond_with(200, body=Like(expected)))

    with pact:
        user = UserService(pact.uri).get_user('123')
        assert user['id'] == '123'
        assert user['email'] == 'alice@example.com'
```

---

## JSON Schema Validation

### Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "required": ["id", "email", "name"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "additionalProperties": false
}
```

### Runtime Validation (Node.js)

```typescript
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

const userSchema = require('./schemas/user.json')
const validate = ajv.compile(userSchema)

function validateUser(data: unknown): User {
  if (!validate(data)) {
    const errors = validate.errors!.map(err => ({
      field: err.instancePath.replace('/', ''),
      message: err.message,
      params: err.params
    }))

    throw new ValidationError('Invalid user data', errors)
  }

  return data as User
}

// Use in API endpoint
app.post('/users', async (req, res) => {
  try {
    const user = validateUser(req.body)
    const created = await db.users.create(user)
    return res.status(201).json(created)
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ errors: error.details })
    }
    throw error
  }
})
```

### Test Response Against Schema

```typescript
import { test, expect } from '@jest/globals'
import Ajv from 'ajv'

const ajv = new Ajv()
const userSchema = require('./schemas/user.json')

test('GET /users/:id returns valid user schema', async () => {
  const response = await fetch('http://localhost:3000/users/123')
  const user = await response.json()

  const validate = ajv.compile(userSchema)
  const valid = validate(user)

  if (!valid) {
    console.error('Schema validation errors:', validate.errors)
  }

  expect(valid).toBe(true)
})
```

---

## API Versioning Strategies

### URL Path Versioning

```
/api/v1/users
/api/v2/users

Pros: Explicit, easy to route, cacheable
Cons: URL changes between versions
Best for: Public APIs, major breaking changes
```

### Header Versioning

```
GET /api/users
Accept: application/vnd.myapp.v2+json

Pros: Clean URLs, content negotiation
Cons: Harder to test, easy to forget
Best for: Internal APIs, gradual migration
```

### Contract Testing Across Versions

```typescript
describe('API Version Compatibility', () => {
  test('v1 and v2 both satisfy their contracts', async () => {
    // Test v1 contract
    const v1Response = await fetch('/api/v1/users/123')
    const v1Data = await v1Response.json()
    expect(validateV1Contract(v1Data)).toBe(true)

    // Test v2 contract
    const v2Response = await fetch('/api/v2/users/123')
    const v2Data = await v2Response.json()
    expect(validateV2Contract(v2Data)).toBe(true)
  })

  test('v2 is backward compatible with v1 consumers', async () => {
    // V2 should support v1 Accept header
    const response = await fetch('/api/users/123', {
      headers: { Accept: 'application/vnd.myapp.v1+json' }
    })

    expect(response.status).toBe(200)
    expect(validateV1Contract(await response.json())).toBe(true)
  })
})
```

---

## Mock Service Patterns

### Mock Service Worker (MSW) for Browser/Node

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const handlers = [
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params

    return res(
      ctx.status(200),
      ctx.json({
        id,
        email: `user-${id}@example.com`,
        name: `User ${id}`
      })
    )
  }),

  rest.post('/api/users', async (req, res, ctx) => {
    const body = await req.json()

    // Validate against schema
    if (!body.email || !body.name) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Missing required fields' })
      )
    }

    return res(
      ctx.status(201),
      ctx.json({ id: 'new-id', ...body })
    )
  })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### WireMock for JVM Services

```json
{
  "request": {
    "method": "GET",
    "urlPattern": "/api/users/[a-z0-9-]+"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "id": "{{request.pathSegments.[2]}}",
      "email": "user@example.com",
      "name": "Mock User"
    }
  }
}
```

---

## Load Testing Patterns

### k6 Contract-Aware Load Testing

```javascript
import http from 'k6/http'
import { check } from 'k6'
import { Rate } from 'k6/metrics'

const contractViolations = new Rate('contract_violations')

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    contract_violations: ['rate<0.01'] // <1% contract violations
  }
}

export default function () {
  const response = http.get('http://localhost:3000/api/users')

  const validContract = check(response, {
    'status is 200': (r) => r.status === 200,
    'has data array': (r) => JSON.parse(r.body).data !== undefined,
    'has meta object': (r) => JSON.parse(r.body).meta !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500
  })

  contractViolations.add(!validContract)
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Contract Tests

on: [push, pull_request]

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Validate OpenAPI spec
        run: npx swagger-cli validate openapi.yaml

      - name: Run contract tests
        run: npm run test:contract

      - name: Check for breaking changes
        run: npm run test:breaking-changes

      - name: Publish Pact contracts
        if: github.ref == 'refs/heads/main'
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: npm run pact:publish

      - name: Can I Deploy?
        run: npx pact-broker can-i-deploy \
          --pacticipant UserAPI \
          --version ${{ github.sha }} \
          --to production
```

---

## Chaos Engineering Basics

### Simulating Contract Violations

```typescript
import { test } from '@jest/globals'

test('handles malformed response gracefully', async () => {
  // Simulate provider returning unexpected data
  mockServer.use(
    rest.get('/api/users/:id', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          // Missing required fields
          id: '123'
          // email and name missing
        })
      )
    })
  )

  await expect(api.getUser('123')).rejects.toThrow('Invalid response schema')
})

test('handles unexpected status codes', async () => {
  mockServer.use(
    rest.get('/api/users/:id', (req, res, ctx) => {
      return res(ctx.status(418)) // I'm a teapot
    })
  )

  await expect(api.getUser('123')).rejects.toThrow('Unexpected status: 418')
})
```

---

## Best Practices

1. **Contract-First Development**
   - Design OpenAPI spec before implementation
   - Generate stubs and SDKs from spec
   - Validate implementation against spec

2. **Consumer-Driven Contracts**
   - Consumers define expected interactions
   - Providers verify they can satisfy contracts
   - Enables independent deployment

3. **Breaking Change Prevention**
   - Run breaking change detection in CI
   - Block PRs with breaking changes
   - Version APIs appropriately

4. **Mock in Tests, Real in Staging**
   - Use mocks for fast feedback in CI
   - Run full integration tests in staging
   - Contract tests bridge the gap

5. **Version Compatibility**
   - Support N-1 version in production
   - Deprecate old versions gracefully
   - Communicate changes to consumers

---

## Troubleshooting

### Issue: Contract Test Passes But Integration Fails

**Cause**: Contract doesn't match real provider behavior
**Solution**:
- Verify provider state handlers set up data correctly
- Check provider verification runs against real implementation
- Ensure mock servers match production responses

### Issue: Too Many False Positives

**Cause**: Overly strict schema validation
**Solution**:
```typescript
// Use "like" matchers for flexible matching
body: like({
  id: '123',
  email: 'alice@example.com'
  // Other fields allowed but not required
})
```

### Issue: Breaking Change Detection Too Noisy

**Cause**: Detecting non-breaking changes as breaking
**Solution**:
- Configure breaking change rules
- Allow additive changes (new optional fields)
- Focus on removals and type changes

---

## Related Skills

- `api-design` - REST API design patterns
- `backend-patterns` - Service layer patterns
- `e2e-testing` - End-to-end testing strategies
- `tdd-workflow` - Test-driven development

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Pact Documentation](https://docs.pact.io/)
- [JSON Schema](https://json-schema.org/)
- [Schemathesis](https://schemathesis.readthedocs.io/)
- [k6 Load Testing](https://k6.io/docs/)

---

**Created**: 2025-01-15
**Category**: Testing
**Difficulty**: Intermediate
**Estimated Time**: 30-60 minutes

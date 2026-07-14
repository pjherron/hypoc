---
name: fastapi-patterns
description: FastAPI development patterns, async endpoints, dependency injection, Pydantic models, authentication, WebSockets, and production deployment patterns.
origin: Custom
---

# FastAPI Development Patterns

Modern async Python API development with FastAPI.

## When to Activate

- Building REST APIs with FastAPI
- Implementing async endpoints
- Using Pydantic for validation
- Adding authentication/authorization
- Working with WebSockets or Server-Sent Events
- Deploying FastAPI to production

## Basic Application Structure

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(
    title="My API",
    description="Production-ready FastAPI application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Pydantic models for validation
class UserCreate(BaseModel):
    email: str = Field(..., description="User email")
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=150)

class User(BaseModel):
    id: int
    email: str
    name: str
    age: int
    
    class Config:
        orm_mode = True  # For SQLAlchemy models

# Endpoints
@app.post("/users", response_model=User, status_code=201)
async def create_user(user: UserCreate):
    # Validation happens automatically via Pydantic
    # user.email is guaranteed to be a valid string
    new_user = await db.users.create(**user.dict())
    return new_user

@app.get("/users", response_model=List[User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False
):
    users = await db.users.find_many(skip=skip, limit=limit)
    return users

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = await db.users.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## Dependency Injection

```python
from fastapi import Depends, HTTPException, Header
from typing import Optional

# Database dependency
async def get_db():
    db = Database()
    try:
        yield db
    finally:
        await db.close()

# Authentication dependency
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    user = await verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user

# Use dependencies in endpoints
@app.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    return current_user

# Chained dependencies
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return current_user

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin)
):
    await db.users.delete(user_id)
    return {"message": "User deleted"}
```

## Async Database Operations

```python
from databases import Database
import sqlalchemy

DATABASE_URL = "postgresql://user:pass@localhost/dbname"
database = Database(DATABASE_URL)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# Async queries
@app.get("/items")
async def list_items():
    query = "SELECT * FROM items WHERE active = true"
    items = await database.fetch_all(query)
    return items

@app.post("/items")
async def create_item(item: ItemCreate):
    query = """
        INSERT INTO items (name, price) 
        VALUES (:name, :price) 
        RETURNING *
    """
    result = await database.fetch_one(query, values=item.dict())
    return result
```

## Background Tasks

```python
from fastapi import BackgroundTasks

def send_email(email: str, subject: str, body: str):
    # Expensive operation runs after response sent
    import time
    time.sleep(5)  # Simulate slow email send
    print(f"Email sent to {email}")

@app.post("/users")
async def create_user(
    user: UserCreate,
    background_tasks: BackgroundTasks
):
    new_user = await db.users.create(**user.dict())
    
    # Email sent asynchronously after response
    background_tasks.add_task(
        send_email,
        email=user.email,
        subject="Welcome!",
        body="Thanks for signing up"
    )
    
    return new_user
```

## WebSockets

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client {client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client {client_id} left")
```

## Error Handling

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# Custom exception
class BusinessLogicError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code

# Exception handlers
@app.exception_handler(BusinessLogicError)
async def business_logic_handler(request: Request, exc: BusinessLogicError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation failed",
            "details": exc.errors()
        }
    )

# Use custom exceptions
@app.post("/orders")
async def create_order(order: OrderCreate):
    if order.total < 0:
        raise BusinessLogicError("Order total cannot be negative")
    
    return await db.orders.create(**order.dict())
```

## Middleware

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import time

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"{request.method} {request.url}")
    response = await call_next(request)
    print(f"Status: {response.status_code}")
    return response
```

## File Uploads

```python
from fastapi import File, UploadFile
from typing import List

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate file
    if file.size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=413, detail="File too large")
    
    allowed_types = ["image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Save file
    contents = await file.read()
    with open(f"uploads/{file.filename}", "wb") as f:
        f.write(contents)
    
    return {"filename": file.filename, "size": len(contents)}

@app.post("/upload-multiple")
async def upload_multiple(files: List[UploadFile] = File(...)):
    filenames = []
    for file in files:
        contents = await file.read()
        with open(f"uploads/{file.filename}", "wb") as f:
            f.write(contents)
        filenames.append(file.filename)
    
    return {"filenames": filenames}
```

## Testing

```python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_create_user():
    response = client.post("/users", json={
        "email": "test@example.com",
        "name": "Test User",
        "age": 30
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

def test_get_user():
    response = client.get("/users/1")
    assert response.status_code == 200

def test_invalid_user():
    response = client.post("/users", json={
        "email": "not-an-email",  # Invalid email
        "name": "Test",
        "age": 30
    })
    assert response.status_code == 422  # Validation error
```

## Production Deployment

### With Gunicorn + Uvicorn

```bash
# Install
pip install gunicorn uvicorn[standard]

# Run
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile -
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

### Environment Configuration

```python
from pydantic import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    secret_key: str
    environment: str = "development"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Use in app
app = FastAPI(debug=settings.environment == "development")
```

## Performance Optimization

### Async Everything

```python
# GOOD: Async I/O operations
@app.get("/data")
async def get_data():
    # All I/O is async
    db_data = await database.fetch_all("SELECT * FROM items")
    api_data = await httpx.get("https://api.example.com/data")
    return {"db": db_data, "api": api_data.json()}

# BAD: Blocking calls in async function
@app.get("/data")
async def get_data():
    # Blocking! Defeats async purpose
    db_data = requests.get("http://db-api.com/data")
    return db_data.json()
```

### Response Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_computation(x: int) -> int:
    # Expensive operation cached
    return x ** 2

@app.get("/compute/{value}")
async def compute(value: int):
    result = expensive_computation(value)
    return {"result": result}
```

### Streaming Responses

```python
from fastapi.responses import StreamingResponse
import asyncio

async def generate_data():
    for i in range(100):
        yield f"data: {i}\n\n"
        await asyncio.sleep(0.1)

@app.get("/stream")
async def stream():
    return StreamingResponse(
        generate_data(),
        media_type="text/event-stream"
    )
```

## Best Practices

1. **Use Pydantic for all data validation**
2. **Always use async for I/O operations**
3. **Leverage dependency injection** for reusable logic
4. **Use background tasks** for slow operations
5. **Add comprehensive error handling**
6. **Version your API** (/api/v1/...)
7. **Use environment variables** for configuration
8. **Add OpenAPI documentation** (automatic with FastAPI)
9. **Implement health check endpoint**
10. **Use connection pooling** for databases

## Related Skills

- `python-patterns` - Python best practices
- `api-design` - REST API conventions
- `backend-patterns` - Architecture patterns
- `security-review` - Security checklist
- `docker-patterns` - Containerization

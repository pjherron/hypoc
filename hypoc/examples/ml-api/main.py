"""
AI Model Serving API with FastAPI
Production-ready async API for serving ML predictions
"""
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import asyncpg
import redis.asyncio as redis
from typing import List, Optional
import numpy as np
import json
import logging
from datetime import datetime

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="AI Model Serving API",
    description="Production ML inference endpoint",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for validation
class PredictionRequest(BaseModel):
    """Input validation for prediction requests"""
    features: List[float] = Field(..., min_items=10, max_items=10)
    model_version: str = Field(default="v1", regex="^v[0-9]+$")
    
    @validator('features')
    def validate_features(cls, v):
        """Ensure features are valid numbers"""
        if any(not isinstance(x, (int, float)) for x in v):
            raise ValueError("All features must be numeric")
        if any(np.isnan(x) or np.isinf(x) for x in v):
            raise ValueError("Features cannot be NaN or Inf")
        return v

class PredictionResponse(BaseModel):
    """Structured prediction response"""
    prediction: float
    confidence: float
    model_version: str
    latency_ms: float
    cached: bool

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    database: str
    redis: str
    timestamp: str

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None
redis_client: Optional[redis.Redis] = None

@app.on_event("startup")
async def startup():
    """Initialize database and cache connections"""
    global db_pool, redis_client
    
    # PostgreSQL connection pool
    db_pool = await asyncpg.create_pool(
        host="your-rds-endpoint.amazonaws.com",
        port=5432,
        database="mlapi",
        user="apiuser",
        password="<from-secrets-manager>",
        min_size=5,
        max_size=20,
        command_timeout=60
    )
    logger.info("Database pool created")
    
    # Redis connection
    redis_client = await redis.from_url(
        "redis://your-elasticache-endpoint:6379",
        encoding="utf-8",
        decode_responses=True
    )
    logger.info("Redis client connected")

@app.on_event("shutdown")
async def shutdown():
    """Clean up connections"""
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()
    logger.info("Connections closed")

async def get_db():
    """Database dependency"""
    async with db_pool.acquire() as connection:
        yield connection

async def log_prediction(features: List[float], prediction: float, latency: float):
    """Background task to log predictions to database"""
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO predictions (features, prediction, latency_ms, created_at)
                VALUES ($1, $2, $3, $4)
            """, json.dumps(features), prediction, latency, datetime.utcnow())
    except Exception as e:
        logger.error(f"Failed to log prediction: {e}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for load bhypoccer"""
    db_status = "healthy"
    redis_status = "healthy"
    
    # Check database
    try:
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        await redis_client.ping()
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    overall_status = "healthy" if (db_status == "healthy" and redis_status == "healthy") else "degraded"
    
    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status,
        timestamp=datetime.utcnow().isoformat()
    )

@app.get("/ready")
async def readiness_check():
    """Readiness probe for K8s/ECS"""
    # Simple check - app is ready if dependencies initialized
    if db_pool is None or redis_client is None:
        raise HTTPException(status_code=503, detail="Not ready")
    return {"status": "ready"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(
    request: PredictionRequest,
    background_tasks: BackgroundTasks
):
    """
    ML model prediction endpoint with caching
    
    - Validates input features
    - Checks Redis cache for recent predictions
    - Computes prediction if cache miss
    - Logs to database asynchronously
    """
    import time
    start_time = time.time()
    
    # Generate cache key from features
    cache_key = f"pred:{request.model_version}:{hash(tuple(request.features))}"
    
    # Check cache
    cached_result = await redis_client.get(cache_key)
    if cached_result:
        result = json.loads(cached_result)
        latency_ms = (time.time() - start_time) * 1000
        logger.info(f"Cache hit - latency: {latency_ms:.2f}ms")
        return PredictionResponse(**result, latency_ms=latency_ms, cached=True)
    
    # Cache miss - compute prediction
    # Simulate model inference (replace with actual model)
    features_array = np.array(request.features)
    prediction = float(np.mean(features_array) * 2.5)  # Dummy model
    confidence = 0.95
    
    latency_ms = (time.time() - start_time) * 1000
    
    result = {
        "prediction": prediction,
        "confidence": confidence,
        "model_version": request.model_version,
        "cached": False
    }
    
    # Cache result for 5 minutes
    await redis_client.setex(cache_key, 300, json.dumps(result))
    
    # Log prediction asynchronously
    background_tasks.add_task(log_prediction, request.features, prediction, latency_ms)
    
    logger.info(f"Prediction computed - latency: {latency_ms:.2f}ms")
    return PredictionResponse(**result, latency_ms=latency_ms)

@app.get("/metrics")
async def metrics():
    """Prometheus-compatible metrics endpoint"""
    # Query recent prediction stats
    async with db_pool.acquire() as conn:
        stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total_predictions,
                AVG(latency_ms) as avg_latency,
                MAX(latency_ms) as max_latency,
                MIN(latency_ms) as min_latency
            FROM predictions
            WHERE created_at > NOW() - INTERVAL '5 minutes'
        """)
    
    # Prometheus format
    return f"""
# HELP api_predictions_total Total number of predictions
# TYPE api_predictions_total counter
api_predictions_total {stats['total_predictions'] or 0}

# HELP api_latency_avg_ms Average prediction latency in milliseconds
# TYPE api_latency_avg_ms gauge
api_latency_avg_ms {stats['avg_latency'] or 0}

# HELP api_latency_max_ms Maximum prediction latency in milliseconds
# TYPE api_latency_max_ms gauge
api_latency_max_ms {stats['max_latency'] or 0}
""".strip()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

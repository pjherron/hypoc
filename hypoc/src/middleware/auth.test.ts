import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './auth';
import jwt from 'jsonwebtoken';

// Mock environment variable
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

describe('Auth Middleware', () => {
  describe('should validate JWT tokens', () => {
    it('accepts valid JWT tokens', async () => {
      // Arrange: Create a valid token
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
      
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Act: Call middleware
      const response = await authMiddleware(request);

      // Assert: Should allow access
      expect(response.status).toBe(200);
      expect(response.headers.get('X-User-Id')).toBe('123');
    });

    it('rejects invalid JWT tokens', async () => {
      // Arrange: Create an invalid token
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: {
          Authorization: 'Bearer invalid-token-string',
        },
      });

      // Act
      const response = await authMiddleware(request);

      // Assert: Should reject with 401
      expect(response.status).toBe(401);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('Invalid token');
    });
  });

  describe('should reject expired tokens', () => {
    it('rejects tokens that have expired', async () => {
      // Arrange: Create an expired token (expired 1 hour ago)
      const payload = { userId: '456', email: 'expired@example.com' };
      const expiredToken = jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Negative duration = already expired
      );

      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      // Act
      const response = await authMiddleware(request);

      // Assert: Should reject with 401
      expect(response.status).toBe(401);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('Token expired');
    });
  });

  describe('should handle missing tokens', () => {
    it('returns 401 when Authorization header is missing', async () => {
      // Arrange: Request without Authorization header
      const request = new NextRequest('http://localhost:3000/api/protected');

      // Act
      const response = await authMiddleware(request);

      // Assert: Should return 401, not 500
      expect(response.status).toBe(401);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('Missing authorization token');
    });

    it('returns 401 when Authorization header is malformed', async () => {
      // Arrange: Request with malformed header (no Bearer prefix)
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: {
          Authorization: 'some-token-without-bearer',
        },
      });

      // Act
      const response = await authMiddleware(request);

      // Assert: Should return 401
      expect(response.status).toBe(401);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('Invalid authorization format');
    });
  });
});

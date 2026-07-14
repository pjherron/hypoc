import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware for validating JWT tokens
 * 
 * @param request - The incoming Next.js request
 * @returns NextResponse with appropriate status code
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('Authorization');

    // Check if Authorization header exists
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    // Validate Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Invalid authorization format' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify JWT secret is configured
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify and decode token
    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Create success response with user context
      const response = NextResponse.json(
        { success: true },
        { status: 200 }
      );

      // Add user ID to response headers for downstream use
      response.headers.set('X-User-Id', decoded.userId);

      return response;
    } catch (error) {
      // Handle specific JWT errors
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        );
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Re-throw unexpected errors
      throw error;
    }
  } catch (error) {
    // Catch-all for unexpected errors
    // In production, log this error to monitoring system
    console.error('Auth middleware error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

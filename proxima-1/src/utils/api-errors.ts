import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

interface ErrorResponseOptions {
  status?: number;
  errorCode?: string;
  publicMessage?: string;
  logLevel?: 'error' | 'warn' | 'info';
}

/**
 * Creates a sanitized error response that doesn't leak sensitive information
 * while still logging detailed errors server-side for debugging
 */
export function createErrorResponse(
  error: unknown,
  context: string,
  options: ErrorResponseOptions = {}
): NextResponse {
  const {
    status = 500,
    errorCode = 'INTERNAL_ERROR',
    publicMessage = 'An error occurred',
    logLevel = 'error'
  } = options;

  // Log detailed error server-side with context
  const logMessage = `${context}: ${error instanceof Error ? error.message : String(error)}`;
  const logDetails = {
    context,
    errorCode,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  };

  // Use appropriate log level
  switch (logLevel) {
    case 'warn':
      logger.warn(logMessage, logDetails);
      break;
    case 'info':
      logger.info(logMessage, logDetails);
      break;
    default:
      logger.error(logMessage, logDetails);
  }

  // Return sanitized response to client
  return NextResponse.json(
    {
      error: publicMessage,
      code: errorCode
    },
    { status }
  );
}

/**
 * Common error responses for consistent API behavior
 */
export const ApiErrors = {
  unauthorized: (context: string) =>
    createErrorResponse(
      'Unauthorized access attempt',
      context,
      {
        status: 401,
        errorCode: 'UNAUTHORIZED',
        publicMessage: 'Authentication required',
        logLevel: 'warn'
      }
    ),

  forbidden: (context: string) =>
    createErrorResponse(
      'Forbidden access attempt',
      context,
      {
        status: 403,
        errorCode: 'FORBIDDEN',
        publicMessage: 'Access denied',
        logLevel: 'warn'
      }
    ),

  notFound: (context: string, resource: string) =>
    createErrorResponse(
      `${resource} not found`,
      context,
      {
        status: 404,
        errorCode: 'NOT_FOUND',
        publicMessage: `${resource} not found`,
        logLevel: 'info'
      }
    ),

  badRequest: (context: string, publicMessage: string) =>
    createErrorResponse(
      publicMessage,
      context,
      {
        status: 400,
        errorCode: 'BAD_REQUEST',
        publicMessage,
        logLevel: 'warn'
      }
    ),

  serverError: (error: unknown, context: string) =>
    createErrorResponse(
      error,
      context,
      {
        status: 500,
        errorCode: 'SERVER_ERROR',
        publicMessage: 'Internal server error'
      }
    ),

  databaseError: (error: unknown, context: string) =>
    createErrorResponse(
      error,
      context,
      {
        status: 500,
        errorCode: 'DATABASE_ERROR',
        publicMessage: 'Failed to process request'
      }
    ),

  validationError: (context: string, publicMessage: string) =>
    createErrorResponse(
      publicMessage,
      context,
      {
        status: 422,
        errorCode: 'VALIDATION_ERROR',
        publicMessage,
        logLevel: 'warn'
      }
    ),

  rateLimitError: (context: string) =>
    createErrorResponse(
      'Rate limit exceeded',
      context,
      {
        status: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        publicMessage: 'Too many requests. Please try again later.',
        logLevel: 'warn'
      }
    )
};

/**
 * Safe JSON response for successful operations
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
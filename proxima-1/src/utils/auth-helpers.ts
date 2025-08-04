import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Extract authenticated user information from request headers
 * This is populated by the middleware after validating the session
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser | null {
  const userId = request.headers.get('x-authenticated-user-id');
  const userEmail = request.headers.get('x-user-email');
  
  if (!userId) {
    return null;
  }
  
  return {
    id: userId,
    email: userEmail || undefined,
  };
}
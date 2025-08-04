import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Get rate limit info from headers
  const headers = Object.fromEntries(request.headers.entries())
  const rateLimitInfo = {
    limit: headers['x-ratelimit-limit'],
    remaining: headers['x-ratelimit-remaining'],
    reset: headers['x-ratelimit-reset'],
    warning: headers['x-ratelimit-warning']
  }

  return NextResponse.json({
    message: 'Rate limit test endpoint',
    timestamp: new Date().toISOString(),
    rateLimitInfo,
    path: '/api/test-rate-limit'
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'POST request successful',
    timestamp: new Date().toISOString()
  })
}
import { NextRequest, NextResponse } from 'next/server';

// Stub endpoint to handle phantom requests from browser extensions or prefetching
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tier: string }> }
) {
  // Await the params in Next.js 15
  const { tier } = await params;
  
  // Just return an empty successful response to stop 404 errors
  return NextResponse.json({ 
    tier: tier,
    message: 'This endpoint is a stub to handle phantom requests',
    data: null 
  });
}
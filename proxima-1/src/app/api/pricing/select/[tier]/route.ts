import { NextRequest, NextResponse } from 'next/server';
import { TIERS } from '@/types/subscription';

// Endpoint used by Photo Analysis Reminders to check tier information
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tier: string }> }
) {
  // Await the params in Next.js 15
  const { tier } = await params;
  
  // Return actual tier data for photo analysis feature
  const tierData = TIERS[tier as keyof typeof TIERS];
  
  if (!tierData) {
    return NextResponse.json({ 
      error: 'Tier not found',
      tier: tier 
    }, { status: 404 });
  }
  
  return NextResponse.json({ 
    tier: tier,
    data: {
      name: tierData.name,
      displayName: tierData.displayName,
      features: {
        photoAnalyses: tierData.features.photoAnalyses,
        storageGB: tierData.features.storageGB,
      },
      price: tierData.price,
    }
  });
}
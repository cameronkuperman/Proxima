import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const modelId = searchParams.get('id') || '6JPs'
  const dk = searchParams.get('dk') || '3cbb6a7f38981892550f66544f254f8e9dd158ee'
  
  try {
    // Construct the BioDigital URL
    const biodigitalUrl = `https://human.biodigital.com/viewer/?id=${modelId}&dk=${dk}`
    
    // Fetch the content
    const response = await fetch(biodigitalUrl, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Referer': request.headers.get('referer') || '',
      },
    })
    
    if (!response.ok) {
      throw new Error(`BioDigital returned ${response.status}`)
    }
    
    // Get the HTML content
    let html = await response.text()
    
    // Inject base URL to fix relative paths
    const baseUrl = 'https://human.biodigital.com'
    html = html.replace('<head>', `<head><base href="${baseUrl}/">`)
    
    // Remove or modify CSP headers that prevent embedding
    const headers = new Headers()
    headers.set('Content-Type', 'text/html; charset=utf-8')
    // Don't forward the frame-ancestors CSP
    
    return new NextResponse(html, { headers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to proxy BioDigital content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
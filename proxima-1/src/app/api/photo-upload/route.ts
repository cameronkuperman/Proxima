import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif'
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

// Magic numbers for file type validation
const FILE_SIGNATURES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  // HEIF/HEIC files start with 'ftyp' at offset 4
  heif: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }
};

// Validate file content matches its extension
async function validateFileContent(buffer: ArrayBuffer, mimeType: string): Promise<boolean> {
  const bytes = new Uint8Array(buffer);
  
  // Check JPEG
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }
  
  // Check PNG
  if (mimeType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && 
           bytes[2] === 0x4E && bytes[3] === 0x47;
  }
  
  // Check HEIF/HEIC (more complex, checking for 'ftyp' box)
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    if (bytes.length < 12) return false;
    // Check for 'ftyp' at offset 4
    return bytes[4] === 0x66 && bytes[5] === 0x74 && 
           bytes[6] === 0x79 && bytes[7] === 0x70;
  }
  
  return false;
}

// Generate safe filename
function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.toLowerCase().match(/\.[a-z]+$/)?.[0] || '.jpg';
  
  // Ensure extension is allowed
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error('Invalid file extension');
  }
  
  return `photo_${timestamp}_${randomString}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Supabase session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {}
        }
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = {
      id: session.user.id,
      email: session.user.email
    };

    // Parse multipart form data
    const formData = await request.formData();
    const photos = formData.getAll('photos') as File[];
    const sessionId = formData.get('session_id') as string;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'No photos provided' },
        { status: 400 }
      );
    }
    
    // Validate each photo
    const validatedPhotos: FormData = new FormData();
    // Backend expects user_id in the FormData
    validatedPhotos.append('user_id', user.id);
    validatedPhotos.append('session_id', sessionId);
    
    for (const photo of photos) {
      // Check file size
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${photo.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }
      
      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
        return NextResponse.json(
          { error: `File ${photo.name} has invalid type. Allowed: JPEG, PNG, HEIC` },
          { status: 400 }
        );
      }
      
      // Read file content for validation
      const buffer = await photo.arrayBuffer();
      
      // Validate file content matches declared type
      const isValidContent = await validateFileContent(buffer, photo.type);
      if (!isValidContent) {
        return NextResponse.json(
          { error: `File ${photo.name} content does not match its type` },
          { status: 400 }
        );
      }
      
      // Check for malicious content patterns (basic check)
      const fileString = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror=/i,
        /onclick=/i,
        /<iframe/i,
        /base64,/i // Embedded data URLs
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(fileString)) {
          return NextResponse.json(
            { error: `File ${photo.name} contains suspicious content` },
            { status: 400 }
          );
        }
      }
      
      // Create a new File with safe filename but preserve the content
      const safeFilename = generateSafeFilename(photo.name);
      const safeFile = new File([buffer], safeFilename, { type: photo.type });
      
      validatedPhotos.append('photos', safeFile);
    }
    
    // Forward to backend API with validated photos
    const backendUrl = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app';
    const response = await fetch(`${backendUrl}/api/photo-analysis/upload`, {
      method: 'POST',
      body: validatedPhotos,
      headers: {
        'X-User-ID': user.id,
        'X-Request-ID': crypto.randomUUID()
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Backend upload error:', error);
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    // Log the upload in audit log (but don't include file content)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('audit.logs').insert({
        user_id: user.id,
        action: 'MEDICAL_PHOTO_UPLOADED',
        resource_type: 'photo_session',
        resource_id: sessionId,
        metadata: {
          photo_count: photos.length,
          total_size: photos.reduce((sum, p) => sum + p.size, 0),
          session_id: sessionId
        }
      });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
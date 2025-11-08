import { NextRequest, NextResponse } from 'next/server';

// Rate Limiting Map (in-memory - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 downloads per window (stricter than preview)
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Whitelist of allowed backend URLs (SSRF Protection)
const ALLOWED_BACKEND_URLS: string[] = [
  'http://localhost:5000',
  'http://localhost:3001',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3001',
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', ''),
].filter((url): url is string => Boolean(url));

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `download:${ip}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function validateBackendUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    return ALLOWED_BACKEND_URLS.some(allowed => 
      allowed && (baseUrl === allowed || baseUrl.startsWith(allowed))
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // ✅ Rate Limiting (stricter for downloads)
  const rateLimitKey = getRateLimitKey(request);
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // ✅ Validate token format (64-char hex)
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json(
      { error: 'Invalid token format' },
      { status: 400 }
    );
  }

  // ✅ SSRF Protection
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  if (!validateBackendUrl(apiUrl)) {
    console.error('⚠️ SSRF Attempt: Invalid backend URL', apiUrl);
    return NextResponse.json(
      { error: 'Invalid configuration' },
      { status: 500 }
    );
  }

  try {
    // Proxy the request to backend
    const response = await fetch(`${apiUrl}/documents/download/${token}`, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
      },
      signal: AbortSignal.timeout(60000), // 60 seconds for downloads
    });

    if (!response.ok) {
      // ✅ Hide error details
      const status = response.status;
      if (status === 404 || status === 400) {
        return NextResponse.json(
          { error: 'Document not found or expired' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: 500 }
      );
    }

    // Get the content type and body
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || '';
    const body = await response.arrayBuffer();

    // ✅ Return the proxied response
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    // ✅ Hide error details
    console.error('Proxy error (hidden from client):', error.name);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


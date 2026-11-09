import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.host = '127.0.0.1:8000';
    url.protocol = 'http:';
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: '/api/:path*',
};

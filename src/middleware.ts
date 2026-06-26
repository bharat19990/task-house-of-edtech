import { middlewareAuth } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

export default middlewareAuth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*'],
};

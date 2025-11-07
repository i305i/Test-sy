import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// المسارات العامة التي لا تحتاج مصادقة
const publicPaths = ['/login', '/register'];

// المسارات المحمية
const protectedPaths = ['/dashboard', '/companies', '/users', '/documents', '/reports', '/settings', '/audit-logs'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // التحقق من وجود token
  const token = request.cookies.get('access_token')?.value;
  
  // إذا كان المستخدم في صفحة عامة (مثل login) وهو مسجل دخول
  if (publicPaths.some(path => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // إذا كان المستخدم يحاول الوصول لصفحة محمية بدون token
  if (protectedPaths.some(path => pathname.startsWith(path)) && !token) {
    // حفظ الصفحة المطلوبة للعودة إليها بعد Login
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // السماح بالمرور
  return NextResponse.next();
}

// تحديد المسارات التي يعمل عليها الـ Middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


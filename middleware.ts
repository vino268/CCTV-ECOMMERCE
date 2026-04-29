import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || '';
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string, role?: 'admin' | 'user') {
  if (!token) return false;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return false;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (role === 'admin') {
      return String(payload?.role || '').toLowerCase() === 'admin';
    }

    return Boolean(payload?.id || payload?.userId);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken =
    request.cookies.get('adminToken')?.value ||
    request.cookies.get('admin_token')?.value ||
    request.cookies.get('token')?.value ||
    '';
  const userToken = request.cookies.get('token')?.value || request.cookies.get('userToken')?.value || '';

  if (pathname.startsWith('/admin/login')) {
    if (await verifyToken(adminToken, 'admin')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/login')) {
    if (await verifyToken(userToken, 'user')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (!(await verifyToken(adminToken, 'admin'))) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/account')) {
    if (!(await verifyToken(userToken, 'user'))) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/login', '/admin/login'],
};
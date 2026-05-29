import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'

  // 未登录且访问非登录页 -> 重定向到登录页
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登录且访问登录页 -> 重定向到首页
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

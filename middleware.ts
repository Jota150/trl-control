import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'
  
  const hasSession = request.cookies.getAll().some(c => 
    c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  if (!hasSession && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

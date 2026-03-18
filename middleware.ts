import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    const isPublic = request.nextUrl.pathname === '/login'
    if (!isPublic) {
      const toLogin = request.nextUrl.clone()
      toLogin.pathname = '/login'
      toLogin.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(toLogin)
    }
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: { path?: string } }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '?')
  )

  if (!user && !isPublic) {
    const toLogin = request.nextUrl.clone()
    toLogin.pathname = '/login'
    toLogin.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(toLogin)
  }

  if (user && request.nextUrl.pathname === '/login') {
    const toDashboard = request.nextUrl.clone()
    toDashboard.pathname = '/dashboard'
    return NextResponse.redirect(toDashboard)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}

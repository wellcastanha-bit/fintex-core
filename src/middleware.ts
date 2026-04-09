import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login']

const MOBILE_PUBLIC_PATHS = ['/m/login', '/m/empresas']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isMobilePublic(pathname: string): boolean {
  return MOBILE_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return res
  }

  const { pathname } = req.nextUrl

  if (pathname.startsWith('/m')) {
    if (isMobilePublic(pathname)) {
      if (user && pathname === '/m/login') {
        return NextResponse.redirect(new URL('/m/empresas', req.url))
      }
      return res
    }

    if (!user) {
      return NextResponse.redirect(new URL('/m/login', req.url))
    }

    const empresaId = req.cookies.get('empresa_id')?.value
    const holdingId = req.cookies.get('holding_id')?.value
    if (!empresaId && !holdingId) {
      return NextResponse.redirect(new URL('/m/empresas', req.url))
    }

    return res
  }

  if (isPublic(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL('/empresas', req.url))
    }
    return res
  }

  if (!user) {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: 'não autenticado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/|favicon\\.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

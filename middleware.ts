import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import type { AppSession } from '@/lib/session'
import { sessionOptions } from '@/lib/session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin 路由需要管理员身份
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const res = NextResponse.next()
    const session = await getIronSession<AppSession>(req, res, sessionOptions)

    if (!session.user) {
      // 未登录 → 跳转到登录页，带上 returnTo 参数
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
      }
      const returnTo = encodeURIComponent(pathname + req.nextUrl.search)
      return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, req.url))
    }

    if (session.user.role !== 'admin') {
      // 已登录但非管理员 → 跳回首页
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/?unauthorized=1', req.url))
    }

    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

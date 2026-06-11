import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import type { AppSession } from '@/lib/session'
import { sessionOptions } from '@/lib/session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin 页面路由：需要登录（不限角色）
  if (pathname.startsWith('/admin')) {
    const res = NextResponse.next()
    const session = await getIronSession<AppSession>(req, res, sessionOptions)

    if (!session.user) {
      // 未登录 → 跳转到登录页，带上 returnTo 参数
      const returnTo = encodeURIComponent(pathname + req.nextUrl.search)
      return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, req.url))
    }

    return res
  }

  // /api/admin API 路由：仍需要管理员身份
  if (pathname.startsWith('/api/admin')) {
    const res = NextResponse.next()
    const session = await getIronSession<AppSession>(req, res, sessionOptions)

    if (!session.user) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'forbidden' }, { status: 403 })
    }

    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

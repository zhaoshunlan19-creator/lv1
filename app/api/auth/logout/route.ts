import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// POST /api/auth/logout — 退出登录
export async function POST() {
  const session = await getSession()
  session.destroy()
  return new NextResponse(null, { status: 204 })
}

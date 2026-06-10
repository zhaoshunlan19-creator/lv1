import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// GET /api/me — 返回当前登录用户，未登录返回 401
export async function GET() {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json(session.user)
}

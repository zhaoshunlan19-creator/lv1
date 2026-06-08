import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings, maskKey } from '@/lib/settings'

/**
 * GET /api/settings
 * 返回当前有效配置（脱敏后的值 + 来源标识）
 */
export async function GET() {
  const settings = await getSettings()

  const describe = (key: 'AITOLL_API_KEY' | 'JUSTONEAPI_TOKEN') => {
    const stored = settings[key]
    const fromEnv = process.env[key]
    if (stored) return { masked: maskKey(stored), source: 'settings' as const }
    if (fromEnv) return { masked: maskKey(fromEnv), source: 'env' as const }
    return { masked: '', source: 'none' as const }
  }

  return NextResponse.json({
    AITOLL_API_KEY: describe('AITOLL_API_KEY'),
    JUSTONEAPI_TOKEN: describe('JUSTONEAPI_TOKEN'),
  })
}

/**
 * PUT /api/settings
 * body: { AITOLL_API_KEY?: string, JUSTONEAPI_TOKEN?: string }
 * 传空字符串 = 删除该项（回退到 env）
 */
export async function PUT(req: NextRequest) {
  const body = await req.json()
  await saveSettings({
    AITOLL_API_KEY: typeof body.AITOLL_API_KEY === 'string' ? body.AITOLL_API_KEY : undefined,
    JUSTONEAPI_TOKEN: typeof body.JUSTONEAPI_TOKEN === 'string' ? body.JUSTONEAPI_TOKEN : undefined,
  })
  return NextResponse.json({ ok: true })
}

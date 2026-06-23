import { NextRequest, NextResponse } from 'next/server'
import { getApiKey } from '@/lib/settings'

// JustOneAPI 地址：国内用户建议用 http://47.117.133.51:30015（更稳定）
const JUSTONEAPI_BASE = 'https://api.justoneapi.com'

/**
 * 从小红书 URL 中提取笔记 ID
 * 支持的格式：
 * - https://www.xiaohongshu.com/explore/<noteId>
 * - https://www.xiaohongshu.com/discovery/item/<noteId>
 * - https://www.xiaohongshu.com/user_profile/.../note/<noteId>
 * - http://xhslink.com/xxx（短链本身不含 noteId，返回空）
 */
function extractNoteIdFromUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined
  const match = url.match(/(?:\/explore\/|\/discovery\/item\/|\/note\/)([a-zA-Z0-9_-]{10,})/i)
  return match?.[1]
}

/**
 * 尝试跟随重定向获取最终 URL（用于 xhslink.com 短链）
 */
async function resolveRedirectUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    return res.url
  } catch {
    return undefined
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const raw: string = body?.url

  if (!raw || typeof raw !== 'string') {
    return NextResponse.json({ error: '请提供有效的链接' }, { status: 400 })
  }

  const urlMatch = raw.match(/https?:\/\/\S*(?:xhslink\.com|xiaohongshu\.com)\S*/i)
  if (!urlMatch) {
    return NextResponse.json(
      { error: '未找到小红书链接，请粘贴包含 xhslink.com 或 xiaohongshu.com 的链接或分享文字' },
      { status: 400 },
    )
  }
  const shareUrl = urlMatch[0].replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=%]+$/, '')

  const token = await getApiKey('JUSTONEAPI_TOKEN')
  if (!token) {
    return NextResponse.json(
      { error: 'JUSTONEAPI_TOKEN 未配置，请在设置页或 .env.local 中添加' },
      { status: 500 },
    )
  }

  try {
    // 优先从原始长链接中直接提取 noteId（浏览器地址栏链接通常可直接解析）
    let noteId = extractNoteIdFromUrl(shareUrl)
    let transferData: any = null

    // 短链或未能直接提取时，调用 JustOneAPI 分享链接解析
    if (!noteId) {
      // 先尝试 V3，失败后回退到 V1
      for (const version of ['v3', 'v1']) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          const transferUrl = `${JUSTONEAPI_BASE}/api/xiaohongshu/share-url-transfer/${version}?token=${encodeURIComponent(token)}&shareUrl=${encodeURIComponent(shareUrl)}`
          console.log(`[xiaohongshu/extract] ${version} attempt ${attempt}:`, transferUrl)
          const transferRes = await fetch(transferUrl, { signal: AbortSignal.timeout(60000) })
          transferData = await transferRes.json()
          console.log(`[xiaohongshu/extract] ${version} response (attempt ${attempt}):`, JSON.stringify(transferData, null, 2))
          if (transferData.code !== 301) break
          await new Promise(r => setTimeout(r, 1000))
        }
        if (transferData?.code === 0) break
      }

      if (transferData?.code !== 0) {
        return NextResponse.json(
          { error: `链接解析失败：${transferData?.message || '请检查链接是否有效'}`, debug: { code: transferData?.code, message: transferData?.message, data: transferData?.data } },
          { status: 400 },
        )
      }

      // 尝试多种方式提取笔记 ID
      noteId =
        transferData.data?.noteId ||
        transferData.data?.note_id ||
        transferData.data?.noteToken ||
        transferData.data?.note_token ||
        transferData.data?.id ||
        extractNoteIdFromUrl(transferData.data?.redirect_url) ||
        extractNoteIdFromUrl(transferData.data?.url) ||
        extractNoteIdFromUrl(transferData.data?.longUrl)

      // 若 API 返回了 redirect_url 但仍未提取到，尝试自己跟随重定向
      if (!noteId && transferData.data?.redirect_url) {
        const resolved = await resolveRedirectUrl(transferData.data.redirect_url)
        noteId = extractNoteIdFromUrl(resolved)
      }
    }

    if (!noteId) {
      return NextResponse.json(
        {
          error: '无法从小红书分享链接中提取笔记ID',
          suggestion: '请检查链接是否完整，或尝试直接粘贴浏览器地址栏中的 xiaohongshu.com/explore/xxx 链接',
          debug: {
            shareUrl,
            responseFields: transferData?.data ? Object.keys(transferData.data) : null,
            responseData: transferData?.data,
          },
        },
        { status: 400 },
      )
    }

    // Step 2: 笔记详情 → 获取完整数据
    const detailUrl = `${JUSTONEAPI_BASE}/api/xiaohongshu/get-note-detail/v5?token=${encodeURIComponent(token)}&noteId=${encodeURIComponent(noteId)}`
    const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(60000) })
    const detailData = await detailRes.json()

    if (detailData.code !== 0) {
      return NextResponse.json(
        { error: `获取笔记详情失败：${detailData.message || '请稍后重试'}` },
        { status: 400 },
      )
    }

    const note = detailData.data?.note || detailData.data?.noteDetail || detailData.data

    const title: string = note?.title || note?.displayTitle || ''
    const description: string = note?.desc || note?.description || note?.content || title
    const coverImage: string =
      note?.coverImage ||
      note?.cover?.url ||
      note?.cover?.url_list?.[0] ||
      note?.imageList?.[0]?.url ||
      note?.imageList?.[0]?.url_default ||
      ''
    const stats = {
      likeCount: note?.stats?.likedCount ?? note?.stats?.likeCount ?? note?.likedCount ?? 0,
      collectCount: note?.stats?.collectedCount ?? note?.stats?.collectCount ?? note?.collectedCount ?? 0,
      commentCount: note?.stats?.commentCount ?? note?.commentCount ?? 0,
      shareCount: note?.stats?.shareCount ?? note?.shareCount ?? 0,
    }
    const authorName: string =
      note?.author?.authorName ||
      note?.author?.nickname ||
      note?.author?.name ||
      note?.author?.uniqueId ||
      ''
    const authorId: string =
      note?.author?.userId ||
      note?.author?.user_id ||
      note?.author?.id ||
      ''

    if (!title && !description) {
      return NextResponse.json(
        { error: '无法获取笔记内容，笔记可能已删除或设为私密' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      noteId,
      title,
      description,
      coverImage,
      authorName,
      authorId,
      stats,
      shareUrl,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误'
    return NextResponse.json({ error: `提取失败：${msg}` }, { status: 500 })
  }
}

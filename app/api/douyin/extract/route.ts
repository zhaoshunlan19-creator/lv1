import { NextRequest, NextResponse } from 'next/server'
import { getApiKey } from '@/lib/settings'

// JustOneAPI 地址：国内用户建议用 http://47.117.133.51:30015（更稳定）
const JUSTONEAPI_BASE = 'https://api.justoneapi.com'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const raw: string = body?.url

  if (!raw || typeof raw !== 'string') {
    return NextResponse.json({ error: '请提供有效的链接' }, { status: 400 })
  }

  const urlMatch = raw.match(/https?:\/\/\S*(?:douyin|iesdouyin)\.com\S*/i)
  if (!urlMatch) {
    return NextResponse.json(
      { error: '未找到抖音链接，请粘贴包含 douyin.com 的链接或分享文字' },
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
    // Step 1: 分享链接解析 → 获取 videoId（code 301 时自动重试最多 3 次）
    let transferData: any = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      const transferUrl = `${JUSTONEAPI_BASE}/api/douyin/share-url-transfer/v1?token=${encodeURIComponent(token)}&shareUrl=${encodeURIComponent(shareUrl)}`
      console.log(`[douyin/extract] step1 attempt ${attempt}:`, transferUrl)
      const transferRes = await fetch(transferUrl, { signal: AbortSignal.timeout(60000) })
      transferData = await transferRes.json()
      console.log(`[douyin/extract] step1 response (attempt ${attempt}):`, JSON.stringify(transferData, null, 2))
      if (transferData.code !== 301) break
      // 301 = 采集失败请重试，等 1s 再试
      await new Promise(r => setTimeout(r, 1000))
    }

    if (transferData.code !== 0) {
      return NextResponse.json(
        { error: `链接解析失败：${transferData.message || '请检查链接是否有效'}`, debug: { code: transferData.code, message: transferData.message, data: transferData.data } },
        { status: 400 },
      )
    }

    const videoId: string =
      transferData.data?.aweme_id ||
      transferData.data?.video_id ||
      transferData.data?.videoId ||
      transferData.data?.id ||
      // 从 redirect_url 路径中提取视频 ID，如 /share/video/7644910900617115240/
      transferData.data?.redirect_url?.match(/\/video\/(\d+)/)?.[1]

    if (!videoId) {
      return NextResponse.json(
        { error: '无法提取视频ID', debug: transferData.data },
        { status: 400 },
      )
    }

    // Step 2: 视频详情 → 获取完整数据
    const detailUrl = `${JUSTONEAPI_BASE}/api/douyin/get-video-detail/v2?token=${encodeURIComponent(token)}&videoId=${encodeURIComponent(videoId)}`
    const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(60000) })
    const detailData = await detailRes.json()

    if (detailData.code !== 0) {
      return NextResponse.json(
        { error: `获取视频详情失败：${detailData.message || '请稍后重试'}` },
        { status: 400 },
      )
    }

    const video = detailData.data?.aweme_detail || detailData.data

    const title: string = video?.desc || video?.title || ''
    const coverImage: string =
      video?.video?.cover?.url_list?.[0] ||
      video?.video?.origin_cover?.url_list?.[0] ||
      video?.cover?.url_list?.[0] ||
      ''
    const stats = {
      playCount: video?.statistics?.play_count ?? video?.statistics?.view_count ?? 0,
      likeCount: video?.statistics?.digg_count ?? 0,
      commentCount: video?.statistics?.comment_count ?? 0,
      shareCount: video?.statistics?.share_count ?? 0,
    }
    const authorName: string =
      video?.author?.nickname || video?.author?.unique_id || ''

    if (!title) {
      return NextResponse.json(
        { error: '无法获取视频内容，视频可能已删除或设为私密' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      videoId,
      title,
      description: title,
      coverImage,
      authorName,
      stats,
      shareUrl,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误'
    return NextResponse.json({ error: `提取失败：${msg}` }, { status: 500 })
  }
}

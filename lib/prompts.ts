/**
 * IdeaForge AI Prompt 模板
 */

export interface AnalyzeInput {
  title: string
  description: string
  targetUser: string
}

/**
 * 构建 AI 分析 prompt
 */
export function buildAnalyzePrompt(input: AnalyzeInput): string {
  return `你是一位资深产品经理和独立开发者顾问。用户有一个产品创意，请帮他完成需求分析和 MVP 规划。

## 用户的创意

名称：${input.title}
描述：${input.description}
目标用户/痛点：${input.targetUser}

## 请输出以下内容

1. 需求分析
   - 核心痛点（2-3句话，直击本质）
   - 目标用户画像（1-2句话）
   - 关键功能建议（5个以内，简洁有力）
   - 潜在风险（1-2个）
   - 差异化机会（1-2句话）

2. MVP 规划（2周可验证版）
   - 核心功能（最多4个，每个1句话说明）
   - 明确不做的事（最多4个）
   - 成功验证标准（1-2个可量化指标）
   - 粗略时间线（按周简述）

3. 简要技术建议（1-2句话，适合新手，推荐具体的技术栈）

## 输出格式

必须严格按以下 JSON 格式输出，不要包含 markdown 代码块标记，直接输出 JSON：

{
  "analysis": {
    "painPoints": "...",
    "targetUsers": "...",
    "keyFeatures": ["...", "..."],
    "risks": "...",
    "opportunities": "..."
  },
  "mvpPlan": {
    "coreFeatures": ["...", "..."],
    "outOfScope": ["...", "..."],
    "successCriteria": "...",
    "timeline": "..."
  },
  "techSuggestion": "..."
}`
}

export interface DouyinVideoMeta {
  title: string
  description: string
}

/**
 * 从抖音视频内容生成创意草稿
 */
export function buildDouyinIdeaPrompt(meta: DouyinVideoMeta): string {
  return `你是一位产品经理助手。根据以下抖音视频信息，提炼出一个产品创意草稿。

## 视频信息

标题：${meta.title}
描述：${meta.description || '（无描述）'}

## 要求

从视频内容中挖掘潜在的产品机会或用户需求，生成一个简洁的创意草稿。

必须严格按以下 JSON 格式输出，不要包含 markdown 代码块标记，直接输出 JSON：

{
  "title": "简洁的创意名称（10字以内）",
  "description": "具体描述这个创意想做什么、解决什么问题（50-100字）",
  "targetUser": "目标用户群体和他们的核心痛点（20-40字）"
}`
}

export interface XiaohongshuNoteMeta {
  title: string
  description: string
}

/**
 * 从小红书笔记内容生成创意草稿
 */
export function buildXiaohongshuIdeaPrompt(meta: XiaohongshuNoteMeta): string {
  return `你是一位产品经理助手。根据以下小红书笔记信息，提炼出一个产品创意草稿。

## 笔记信息

标题：${meta.title}
正文：${meta.description || '（无正文）'}

## 要求

从笔记内容中挖掘潜在的产品机会或用户需求，生成一个简洁的创意草稿。

必须严格按以下 JSON 格式输出，不要包含 markdown 代码块标记，直接输出 JSON：

{
  "title": "简洁的创意名称（10字以内）",
  "description": "具体描述这个创意想做什么、解决什么问题（50-100字）",
  "targetUser": "目标用户群体和他们的核心痛点（20-40字）"
}`
}
export function extractJson(text: string): Record<string, unknown> {
  // 尝试匹配 ```json ... ``` 格式
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1].trim())
  }

  // 尝试直接匹配 JSON 对象（第一个 { ... }）
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('无法从响应中提取 JSON')
}

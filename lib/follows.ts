/**
 * 关注数据存储层
 * 数据存储在 data/follows.json 中
 */

import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const FOLLOWS_FILE = path.join(DATA_DIR, 'follows.json')

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
  try {
    await fs.access(FOLLOWS_FILE)
  } catch {
    await fs.writeFile(FOLLOWS_FILE, JSON.stringify({}, null, 2))
  }
}

async function getFollowsMap(): Promise<Record<string, string[]>> {
  await ensureDataFile()
  const data = await fs.readFile(FOLLOWS_FILE, 'utf-8')
  return JSON.parse(data) as Record<string, string[]>
}

async function saveFollowsMap(map: Record<string, string[]>): Promise<void> {
  await fs.writeFile(FOLLOWS_FILE, JSON.stringify(map, null, 2))
}

/**
 * 获取用户关注的创意ID列表
 */
export async function getFollowedIdeaIds(userId: string): Promise<string[]> {
  const map = await getFollowsMap()
  return map[userId] || []
}

/**
 * 关注一个创意
 */
export async function followIdea(userId: string, ideaId: string): Promise<void> {
  const map = await getFollowsMap()
  const list = map[userId] || []
  if (!list.includes(ideaId)) {
    map[userId] = [...list, ideaId]
    await saveFollowsMap(map)
  }
}

/**
 * 取消关注一个创意
 */
export async function unfollowIdea(userId: string, ideaId: string): Promise<void> {
  const map = await getFollowsMap()
  const list = map[userId] || []
  if (list.includes(ideaId)) {
    map[userId] = list.filter((id) => id !== ideaId)
    await saveFollowsMap(map)
  }
}

/**
 * 用户是否已关注该创意
 */
export async function isFollowing(userId: string, ideaId: string): Promise<boolean> {
  const map = await getFollowsMap()
  const list = map[userId] || []
  return list.includes(ideaId)
}

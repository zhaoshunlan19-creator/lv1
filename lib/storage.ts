/**
 * IdeaForge 文件系统存储层
 * 数据存储在项目目录的 data/ideas.json 中
 */

import fs from 'fs/promises'
import path from 'path'
import type { Idea } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'ideas.json')

/**
 * 确保数据目录和文件存在
 */
async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2))
  }
}

/**
 * 获取所有创意
 */
export async function getAllIdeas(): Promise<Idea[]> {
  await ensureDataFile()
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data) as Idea[]
}

/**
 * 获取单个创意
 */
export async function getIdea(id: string): Promise<Idea | null> {
  const ideas = await getAllIdeas()
  return ideas.find((i) => i.id === id) || null
}

/**
 * 保存创意（新增或更新）
 */
export async function saveIdea(idea: Idea): Promise<void> {
  const ideas = await getAllIdeas()
  const index = ideas.findIndex((i) => i.id === idea.id)
  if (index >= 0) {
    ideas[index] = idea
  } else {
    ideas.unshift(idea)
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(ideas, null, 2))
}

/**
 * 删除创意
 */
export async function deleteIdea(id: string): Promise<void> {
  const ideas = await getAllIdeas()
  const filtered = ideas.filter((i) => i.id !== id)
  await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2))
}

/**
 * 获取指定用户的创意列表
 */
export async function getIdeasByUserId(userId: string): Promise<Idea[]> {
  const ideas = await getAllIdeas()
  return ideas.filter((i) => i.userId === userId)
}

/**
 * 检查创意是否属于指定用户（或无创建者，即公共创意）
 */
export async function isIdeaOwner(id: string, userId: string): Promise<boolean> {
  const idea = await getIdea(id)
  if (!idea) return false
  return !idea.userId || idea.userId === userId
}

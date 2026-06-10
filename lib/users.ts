/**
 * IdeaForge 用户存储层
 * 数据存储在 data/users.json 中，结构与 storage.ts 保持一致
 */

import fs from 'fs/promises'
import path from 'path'
import type { User } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

/**
 * 确保用户数据文件存在
 */
async function ensureUsersFile(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
  try {
    await fs.access(USERS_FILE)
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2))
  }
}

/**
 * 获取所有用户
 */
export async function getAllUsers(): Promise<User[]> {
  await ensureUsersFile()
  const data = await fs.readFile(USERS_FILE, 'utf-8')
  return JSON.parse(data) as User[]
}

/**
 * 按邮箱查找用户（不区分大小写）
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getAllUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
}

/**
 * 按 ID 查找用户
 */
export async function getUserById(id: string): Promise<User | null> {
  const users = await getAllUsers()
  return users.find((u) => u.id === id) ?? null
}

/**
 * 保存用户（新增或更新）
 */
export async function saveUser(user: User): Promise<void> {
  const users = await getAllUsers()
  const index = users.findIndex((u) => u.id === user.id)
  if (index >= 0) {
    users[index] = user
  } else {
    users.push(user)
  }
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

/**
 * 返回用户总数（用于判断是否是第一个用户）
 */
export async function countUsers(): Promise<number> {
  const users = await getAllUsers()
  return users.length
}

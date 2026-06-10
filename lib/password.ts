/**
 * 密码哈希工具（bcryptjs，12 轮）
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// 用于邮箱不存在时的恒时比对，避免通过响应时间枚举已注册邮箱
// 对应明文 "dummy-password" 的 bcrypt 哈希
export const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO0pX0LkEoF5tZ8w8FqQ6sB1nC2vD3eF6'

'use client'

import { useState, useEffect } from 'react'
import { Loader2, ShieldCheck, User, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SafeUser, UserRole } from '@/lib/types'

const ROLE_LABEL: Record<UserRole, string> = {
  admin: '管理员',
  user: '普通用户',
}

export default function UsersPage() {
  const [users, setUsers] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (id: string, role: UserRole) => {
    setChanging(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '修改失败')
        return
      }
      const updated: SafeUser = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    } finally {
      setChanging(null)
    }
  }

  return (
    <main className="p-6 max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">用户管理</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">用户</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">角色</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">注册时间</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.role === 'admin' ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {ROLE_LABEL[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {changing === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role !== 'admin' && (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              设为管理员
                            </DropdownMenuItem>
                          )}
                          {user.role !== 'user' && (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')}>
                              <User className="h-4 w-4 mr-2" />
                              设为普通用户
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    暂无用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

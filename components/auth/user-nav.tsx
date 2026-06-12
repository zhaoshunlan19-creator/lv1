'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2, Shield, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SessionUser } from '@/lib/session'

export function UserNav() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user.displayName?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-xs font-medium">{user.displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{user.displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/profile" className="cursor-pointer flex items-center gap-2">
            <User className="h-4 w-4" />
            个人中心
          </Link>
        </DropdownMenuItem>
        {user.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer flex items-center gap-2">
              <Shield className="h-4 w-4" />
              管理后台
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

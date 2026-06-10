'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
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
    <div className="px-3 py-2 space-y-1">
      <div className="text-xs font-medium truncate">{user.displayName}</div>
      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {loggingOut ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        退出登录
      </button>
    </div>
  )
}

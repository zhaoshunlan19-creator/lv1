'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Lightbulb, Settings, ArrowLeft, Users, Shield, User } from 'lucide-react'
import { UserNav } from '@/components/auth/user-nav'
import type { SessionUser } from '@/lib/session'

const NAV_ITEMS = [
  {
    label: '创意管理',
    href: '/admin',
    icon: Lightbulb,
    exact: true,
    adminOnly: true,
  },
  {
    label: '用户管理',
    href: '/admin/users',
    icon: Users,
    exact: false,
    adminOnly: true,
  },
  {
    label: '个人中心',
    href: '/admin/profile',
    icon: User,
    exact: true,
    adminOnly: false,
  },
  {
    label: '设置',
    href: '/admin/settings',
    icon: Settings,
    exact: false,
    adminOnly: false,
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
  }, [])

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin')

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 border-r bg-card flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-4 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm">{user?.role === 'admin' ? '管理后台' : '个人中心'}</span>
              {user?.role === 'admin' && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Shield className="h-3 w-3" />管理员
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            返回首页
          </Link>
          <div className="px-1 pt-1 border-t">
            <UserNav />
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

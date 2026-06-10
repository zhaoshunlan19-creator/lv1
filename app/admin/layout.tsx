'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Lightbulb, Settings, ArrowLeft } from 'lucide-react'

const NAV_ITEMS = [
  {
    label: '创意管理',
    href: '/admin',
    icon: Lightbulb,
    // exact match，避免 /admin/settings 也高亮
    exact: true,
  },
  {
    label: '设置',
    href: '/admin/settings',
    icon: Settings,
    exact: false,
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
            <span className="font-bold text-sm">管理后台</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
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
        <div className="px-2 py-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            返回首页
          </Link>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

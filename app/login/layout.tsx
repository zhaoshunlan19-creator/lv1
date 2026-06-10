import { Suspense } from 'react'

// useSearchParams 需要 Suspense 边界
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>
}

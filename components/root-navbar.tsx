'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'

export function RootNavbar() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) {
    return null
  }

  return <Navbar />
}

'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopNavbar from '@/components/TopNavbar'

type Props = {
  children: React.ReactNode
  userEmail?: string | null
}

export default function AppShell({ children, userEmail }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar className="hidden md:block" />

      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity md:hidden ${
          mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />

      <Sidebar
        mobile
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        className="md:hidden"
      />

      <div className="min-h-screen md:pl-64">
        <TopNavbar
          userEmail={userEmail}
          onMenuClick={() => setMobileNavOpen((current) => !current)}
        />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  )
}

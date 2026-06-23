'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { UtensilsCrossed, Bell, Sun, Moon } from 'lucide-react'

function TopBar() {
  const [time, setTime] = useState('')
  const [greeting, setGreeting] = useState('')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const h = now.getHours()
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
      if (h < 11) setGreeting('Selamat Pagi')
      else if (h < 15) setGreeting('Selamat Siang')
      else if (h < 18) setGreeting('Selamat Sore')
      else setGreeting('Selamat Malam')
    }
    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  const toggleDark = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="sticky top-0 z-40 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-12 items-center gap-3 px-3">
        {/* Sidebar trigger */}
        <SidebarTrigger className="shrink-0 h-8 w-8 rounded-lg border border-border/60 bg-background/80 hover:bg-accent transition-all duration-200 hover:shadow-sm" />

        {/* Brand */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="hidden sm:block text-sm font-semibold text-foreground/80">CateringKita</span>
        </div>

        {/* Time & Greeting */}
        {greeting && (
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border/40 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{greeting}</span>
            <span className="text-border">·</span>
            <span className="font-mono tabular-nums">{time}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleDark}
            className="h-8 w-8 rounded-lg border border-border/60 bg-background/80 flex items-center justify-center hover:bg-accent transition-all duration-200 hover:shadow-sm"
            title="Toggle tema"
          >
            {isDark
              ? <Sun className="h-3.5 w-3.5 text-amber-500" />
              : <Moon className="h-3.5 w-3.5 text-slate-500" />
            }
          </button>
          <button
            className="h-8 w-8 rounded-lg border border-border/60 bg-background/80 flex items-center justify-center hover:bg-accent transition-all duration-200 relative hover:shadow-sm"
            title="Notifikasi"
          >
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

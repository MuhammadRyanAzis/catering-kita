'use client'

import type { ReactNode } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className='sticky top-2 z-30 w-fit p-2'>
          <SidebarTrigger className='bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/70' />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

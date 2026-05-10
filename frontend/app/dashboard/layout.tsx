import type { ReactNode } from 'react'

import { DashboardShell } from '@/components/dashboard-shell'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <DashboardShell>{children}</DashboardShell>
    </TooltipProvider>
  )
}

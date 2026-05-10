'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, CheckCircle2, PauseCircle, XCircle, Sparkles } from 'lucide-react'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type SubscriptionOrder = {
  id: number
  service_date: string
  delivery_slot: 'MORNING' | 'AFTERNOON'
  order_id: number
}

type Subscription = {
  id: number
  plan: 'DAYS_7' | 'DAYS_30'
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  total_price: number | string
  remaining_budget: number | string
  start_date: string
  end_date: string
  pause_reason?: string
  vendor: {
    id: number
    name: string
  }
  subscription_orders?: SubscriptionOrder[]
}

type SubscriptionResponse = {
  data?: Subscription[]
  total?: number
  message?: string
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function getPlanLabel(plan: Subscription['plan']) {
  return plan === 'DAYS_30' ? 'Paket 30 Hari' : 'Paket 7 Hari'
}

function getStatusInfo(status: Subscription['status']) {
  switch (status) {
    case 'active':
      return { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
    case 'paused':
      return { label: 'Pause', color: 'bg-amber-100 text-amber-700', icon: PauseCircle }
    case 'cancelled':
      return { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-700', icon: XCircle }
    case 'completed':
      return { label: 'Selesai', color: 'bg-slate-100 text-slate-700', icon: CheckCircle2 }
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700', icon: CheckCircle2 }
  }
}

export default function CustomerSubscriptionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [cancelLoading, setCancelLoading] = useState<number | null>(null)

  const loadSubscriptions = useCallback(async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      router.replace('/signin')
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) {
      setError('Konfigurasi NEXT_PUBLIC_API_URL belum tersedia')
      setLoading(false)
      return
    }

    let parsedUser: DashboardUser
    try {
      parsedUser = JSON.parse(storedUser) as DashboardUser
    } catch {
      router.replace('/signin')
      return
    }

    if (parsedUser.role !== 'CUSTOMER') {
      router.replace('/signin')
      return
    }

    try {
      const res = await fetch(`${baseUrl}/subscriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.replace('/signin')
        return
      }

      const json = (await res.json()) as SubscriptionResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat langganan')
      }

      setSubscriptions(json.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat langganan')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadSubscriptions()
  }, [loadSubscriptions])

  const handleCancel = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan langganan ini?')) return

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token || !baseUrl) return

    setCancelLoading(id)
    try {
      const res = await fetch(`${baseUrl}/subscriptions/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal membatalkan langganan')
      }

      await loadSubscriptions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membatalkan langganan')
    } finally {
      setCancelLoading(null)
    }
  }

  const sortedSubscriptions = useMemo(() => {
    return subscriptions.slice().sort((a, b) => {
      const aDate = new Date(a.start_date).getTime()
      const bDate = new Date(b.start_date).getTime()
      return bDate - aDate
    })
  }, [subscriptions])

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl animate-pulse space-y-6'>
          <div className='h-8 w-64 rounded bg-muted' />
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-48 rounded-2xl bg-muted' />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-4xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Langganan Saya</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Pantau status langganan catering dan jadwal paketmu.
              </p>
            </div>
            <Button
              variant='outline'
              className='bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20'
              onClick={() => router.push('/customer/vendors')}
            >
              Cari Vendor
            </Button>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {sortedSubscriptions.length === 0 && !error ? (
          <div className='rounded-2xl border border-dashed bg-card p-12 text-center flex flex-col items-center justify-center'>
            <Sparkles className='size-12 text-muted-foreground mb-4 opacity-20' />
            <h3 className='text-lg font-medium'>Belum ada langganan</h3>
            <p className='text-sm text-muted-foreground mt-1'>Kamu belum membuat paket langganan apapun.</p>
            <Button className='mt-6' onClick={() => router.push('/customer/vendors')}>
              Cari Vendor Sekarang
            </Button>
          </div>
        ) : null}

        <div className='space-y-4'>
          {sortedSubscriptions.map((subscription) => {
            const statusInfo = getStatusInfo(subscription.status)
            const StatusIcon = statusInfo.icon
            const ordersCount = subscription.subscription_orders?.length || 0
            return (
              <Card key={subscription.id} className='overflow-hidden'>
                <CardHeader className='border-b bg-muted/30 py-4'>
                  <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='space-y-1'>
                      <CardTitle className='text-lg'>{subscription.vendor.name}</CardTitle>
                      <p className='text-xs text-muted-foreground'>{getPlanLabel(subscription.plan)}</p>
                    </div>
                    <Badge variant='outline' className={`gap-1.5 border-transparent ${statusInfo.color}`}>
                      <StatusIcon className='size-3.5' />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='p-6 space-y-4'>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Total Paket</p>
                      <p className='mt-1 font-medium'>{formatCurrency(subscription.total_price)}</p>
                    </div>
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Sisa Budget</p>
                      <p className='mt-1 font-medium'>{formatCurrency(subscription.remaining_budget)}</p>
                    </div>
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Tanggal Mulai</p>
                      <p className='mt-1 font-medium flex items-center gap-2'>
                        <CalendarDays className='size-4 text-primary' />
                        {new Date(subscription.start_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Tanggal Selesai</p>
                      <p className='mt-1 font-medium flex items-center gap-2'>
                        <CalendarDays className='size-4 text-primary' />
                        {new Date(subscription.end_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
                    <Badge variant='secondary'>Order dibuat: {ordersCount}</Badge>
                    {subscription.pause_reason ? (
                      <Badge variant='outline'>Alasan pause: {subscription.pause_reason}</Badge>
                    ) : null}
                  </div>
                </CardContent>
                <CardFooter className='flex flex-wrap items-center justify-between gap-3'>
                  <Button
                    variant='outline'
                    onClick={() => router.push(`/customer/vendors/${subscription.vendor.id}`)}
                  >
                    Lihat Vendor
                  </Button>
                  {subscription.status === 'active' ? (
                    <Button
                      variant='destructive'
                      onClick={() => void handleCancel(subscription.id)}
                      disabled={cancelLoading === subscription.id}
                    >
                      {cancelLoading === subscription.id ? 'Membatalkan...' : 'Batalkan Langganan'}
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}

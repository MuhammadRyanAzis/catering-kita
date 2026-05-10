'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteCookies } from '@/helper/cookies'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type VendorOrderItem = {
  id: number
  quantity: number
  price: number | string
  subtotal: number | string
  menu?: {
    id: number
    name: string
  }
}

type VendorOrder = {
  id: number
  status: string
  total: number | string
  delivery_fee?: number | string
  notes?: string
  created_at: string
  customer?: {
    user?: {
      name?: string
      email?: string
    }
  }
  order_items?: VendorOrderItem[]
}

type VendorStats = {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  preparingOrders: number
  readyOrders: number
  onDeliveryOrders: number
  deliveredOrders: number
  cancelledOrders: number
  totalRevenue: number
}

type VendorOrdersResponse = {
  statistics?: VendorStats
  data?: VendorOrder[]
  message?: string
}

type OrderActionResponse = {
  message?: string
}

const NEXT_STATUS_BY_CURRENT: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'on_delivery',
  on_delivery: 'delivered',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  on_delivery: 'On Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'delivered') {
    return 'default'
  }

  if (status === 'cancelled') {
    return 'outline'
  }

  return 'secondary'
}

export default function VendorOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vendorName, setVendorName] = useState('Vendor')
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token || !storedUser) {
      router.replace('/signin')
      return
    }

    if (!baseUrl) {
      setError('Konfigurasi NEXT_PUBLIC_API_URL belum tersedia')
      setLoading(false)
      return
    }

    try {
      const user = JSON.parse(storedUser) as DashboardUser
      if (user.role !== 'VENDOR') {
        router.replace('/signin')
        return
      }
      setVendorName(user.name)
    } catch {
      router.replace('/signin')
      return
    }

    try {
      const response = await fetch(`${baseUrl}/vendors/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        await handleLogout()
        return
      }

      const json = (await response.json()) as VendorOrdersResponse
      if (!response.ok) {
        throw new Error(json.message || 'Gagal memuat order vendor')
      }

      setOrders(json.data || [])
      setStats(json.statistics || null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat order vendor')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const advanceStatus = async (order: VendorOrder) => {
    const nextStatus = NEXT_STATUS_BY_CURRENT[order.status]
    if (!nextStatus) {
      return
    }

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) {
      setError('Sesi tidak valid, silakan login ulang')
      return
    }

    setUpdatingOrderId(order.id)
    setError('')

    try {
      const response = await fetch(`${baseUrl}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (response.status === 401) {
        await handleLogout()
        return
      }

      const json = (await response.json()) as OrderActionResponse
      if (!response.ok) {
        throw new Error(json.message || 'Gagal mengubah status order')
      }

      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status order')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const cancelOrder = async (orderId: number) => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) {
      setError('Sesi tidak valid, silakan login ulang')
      return
    }

    setCancellingOrderId(orderId)
    setError('')

    try {
      const response = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        await handleLogout()
        return
      }

      const json = (await response.json()) as OrderActionResponse
      if (!response.ok) {
        throw new Error(json.message || 'Gagal membatalkan order')
      }

      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membatalkan order')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const activeOrders = useMemo(
    () => orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)),
    [orders],
  )

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl animate-pulse space-y-4'>
          <div className='h-10 w-64 rounded bg-muted' />
          <div className='h-28 rounded-xl bg-muted' />
          <div className='h-40 rounded-xl bg-muted' />
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-sky-100/40 via-background to-background px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-600 to-indigo-600 p-6 text-white shadow-lg'>
          <div className='absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-28 rounded-full bg-indigo-300/30 blur-2xl' />
          <div className='relative'>
            <h1 className='text-2xl font-semibold'>Pesanan Masuk</h1>
            <p className='mt-1 text-sm text-sky-50'>
              Pantau dan proses order customer secara berurutan sesuai flow status.
            </p>

            <div className='mt-4 grid gap-3 sm:grid-cols-3'>
              <div className='rounded-xl border border-white/20 bg-white/10 p-3'>
                <p className='text-xs text-white/70'>Vendor</p>
                <p className='mt-1 font-medium'>{vendorName}</p>
              </div>
              <div className='rounded-xl border border-white/20 bg-white/10 p-3'>
                <p className='text-xs text-white/70'>Order Aktif</p>
                <p className='mt-1 font-medium'>{activeOrders.length}</p>
              </div>
              <div className='rounded-xl border border-white/20 bg-white/10 p-3'>
                <p className='text-xs text-white/70'>Revenue Delivered</p>
                <p className='mt-1 font-medium'>{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {orders.length === 0 ? (
          <div className='rounded-xl border bg-card p-6 text-sm text-muted-foreground'>
            Belum ada order untuk vendor ini.
          </div>
        ) : (
          <section className='grid gap-4'>
            {orders.map((order) => {
              const nextStatus = NEXT_STATUS_BY_CURRENT[order.status]
              const canCancel = ['pending', 'confirmed'].includes(order.status)

              return (
                <Card key={order.id} size='sm'>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between gap-2'>
                      <span>Order #{order.id}</span>
                      <Badge variant={getStatusVariant(order.status)}>{STATUS_LABEL[order.status] || order.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {order.customer?.user?.name || 'Customer'} • {formatDate(order.created_at)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='space-y-3'>
                    <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
                      <div className='rounded-lg border bg-background p-3'>
                        <p className='text-xs text-muted-foreground'>Total</p>
                        <p className='mt-1 font-medium'>{formatCurrency(order.total)}</p>
                      </div>
                      <div className='rounded-lg border bg-background p-3'>
                        <p className='text-xs text-muted-foreground'>Delivery Fee</p>
                        <p className='mt-1 font-medium'>{formatCurrency(order.delivery_fee || 0)}</p>
                      </div>
                      <div className='rounded-lg border bg-background p-3 sm:col-span-2'>
                        <p className='text-xs text-muted-foreground'>Catatan</p>
                        <p className='mt-1 text-sm'>{order.notes || '-'}</p>
                      </div>
                    </div>

                    <div className='rounded-lg border bg-background p-3'>
                      <p className='mb-2 text-xs text-muted-foreground'>Item Pesanan</p>
                      <div className='space-y-2'>
                        {(order.order_items || []).map((item) => (
                          <div key={item.id} className='flex items-center justify-between gap-3 text-sm'>
                            <span>
                              {item.menu?.name || 'Menu'} x {item.quantity}
                            </span>
                            <span className='text-muted-foreground'>{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className='flex flex-wrap gap-2'>
                    <Button
                      className='bg-sky-600 text-white hover:bg-sky-700'
                      onClick={() => void advanceStatus(order)}
                      disabled={!nextStatus || updatingOrderId === order.id || cancellingOrderId === order.id}
                    >
                      {updatingOrderId === order.id
                        ? 'Menyimpan...'
                        : nextStatus
                          ? `Lanjut ke ${STATUS_LABEL[nextStatus] || nextStatus}`
                          : 'Status Final'}
                    </Button>

                    <Button
                      variant='outline'
                      onClick={() => void cancelOrder(order.id)}
                      disabled={!canCancel || cancellingOrderId === order.id || updatingOrderId === order.id}
                    >
                      {cancellingOrderId === order.id ? 'Membatalkan...' : 'Batalkan Order'}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}

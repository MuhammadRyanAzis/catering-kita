'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Package, CheckCircle2, XCircle, Truck, Store, Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type OrderItem = {
  id: number
  menu_id: number
  quantity: number
  price: string | number
  subtotal: string | number
  menu: {
    id: number
    name: string
    image_url?: string
  }
}

type Order = {
  id: number
  total: string | number
  status: string
  created_at: string
  notes?: string
  delivery_fee?: string | number
  vendor: {
    id: number
    name: string
  }
  order_items: OrderItem[]
  payment?: {
    id: number
    status: string
    payment_method: string
  }
}

type OrdersResponse = {
  data?: Order[]
  total?: number
  message?: string
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return { label: 'Menunggu Konfirmasi', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock }
    case 'confirmed':
      return { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 }
    case 'preparing':
      return { label: 'Sedang Disiapkan', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: Package }
    case 'ready':
      return { label: 'Siap Dikirim', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Package }
    case 'on_delivery':
      return { label: 'Dalam Pengiriman', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck }
    case 'delivered':
      return { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 }
    case 'cancelled':
      return { label: 'Dibatalkan', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: Clock }
  }
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [cancelLoading, setCancelLoading] = useState<number | null>(null)

  const loadOrders = useCallback(async () => {
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
      const res = await fetch(`${baseUrl}/orders`, {
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

      const json = (await res.json()) as OrdersResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat daftar pesanan')
      }

      setOrders(json.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat pesanan')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token || !baseUrl) return

    setCancelLoading(orderId)
    try {
      const res = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal membatalkan pesanan')
      }

      await loadOrders()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membatalkan pesanan')
    } finally {
      setCancelLoading(null)
    }
  }

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
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Pesanan Saya</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Pantau status pesanan dan riwayat transaksimu di sini.
              </p>
            </div>
            <Button variant='outline' className='bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20' onClick={() => router.push('/customer/dashboard')}>
              Cari Menu Lain
            </Button>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {orders.length === 0 && !error ? (
          <div className='rounded-2xl border border-dashed bg-card p-12 text-center flex flex-col items-center justify-center'>
            <Receipt className='size-12 text-muted-foreground mb-4 opacity-20' />
            <h3 className='text-lg font-medium'>Belum ada pesanan</h3>
            <p className='text-sm text-muted-foreground mt-1'>Kamu belum pernah membuat pesanan apapun.</p>
            <Button className='mt-6' onClick={() => router.push('/customer/dashboard')}>
              Cari Menu Sekarang
            </Button>
          </div>
        ) : null}

        <div className='space-y-4'>
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status)
            const StatusIcon = statusInfo.icon

            return (
              <Card key={order.id} className='overflow-hidden'>
                <CardHeader className='border-b bg-muted/30 py-4'>
                  <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-1.5 font-medium'>
                        <Store className='size-4 text-primary' />
                        {order.vendor.name}
                      </div>
                      <span className='text-xs text-muted-foreground'>•</span>
                      <span className='text-xs text-muted-foreground'>
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <Badge variant='outline' className={`gap-1.5 border-transparent ${statusInfo.color}`}>
                      <StatusIcon className='size-3.5' />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='p-6'>
                  <div className='space-y-4'>
                    {order.order_items.map((item) => (
                      <div key={item.id} className='flex items-start gap-4'>
                        {item.menu.image_url ? (
                          <img
                            src={item.menu.image_url}
                            alt={item.menu.name}
                            className='size-16 rounded-lg object-cover border'
                          />
                        ) : (
                          <div className='size-16 rounded-lg bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground'>
                            No Img
                          </div>
                        )}
                        <div className='flex-1'>
                          <h4 className='font-medium'>{item.menu.name}</h4>
                          <p className='text-sm text-muted-foreground'>
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className='font-medium'>
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.notes && (
                    <div className='mt-4 rounded-lg bg-muted/40 p-3 text-sm'>
                      <span className='font-medium'>Catatan:</span> {order.notes}
                    </div>
                  )}
                </CardContent>
                <CardFooter className='border-t bg-muted/10 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4'>
                  <div>
                    <p className='text-xs text-muted-foreground'>Total Pesanan</p>
                    <p className='text-lg font-semibold text-primary'>{formatCurrency(order.total)}</p>
                  </div>
                  
                  <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => router.push(`/customer/orders/${order.id}`)}>
                      Detail Pesanan
                    </Button>
                    
                    {order.status === 'pending' && (
                      <Button
                        variant='destructive'
                        disabled={cancelLoading === order.id}
                        onClick={() => void handleCancelOrder(order.id)}
                      >
                        {cancelLoading === order.id ? 'Membatalkan...' : 'Batalkan'}
                      </Button>
                    )}

                    {order.status === 'delivered' && (
                      <Button
                        className='bg-emerald-600 hover:bg-emerald-700 text-white'
                        onClick={() => router.push(`/customer/reviews/new?orderId=${order.id}`)}
                      >
                        Beri Ulasan
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}

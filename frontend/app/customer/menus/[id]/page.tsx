'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Utensils, MapPin } from 'lucide-react'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type MenuDetail = {
  id: number
  name: string
  description?: string
  price: number | string
  calories?: number
  image_url?: string
  available: boolean
  category?: {
    id: number
    name: string
  }
  vendor?: {
    id: number
    name: string
    city?: string
    address?: string
    phone?: string
    image_url?: string
    banner_url?: string
  }
}

type MenuDetailResponse = {
  data?: MenuDetail
  message?: string
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

export default function CustomerMenuDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState<MenuDetail | null>(null)

  // Order State
  const [quantity, setQuantity] = useState<number>(1)
  const [notes, setNotes] = useState('')
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')

  const menuId = useMemo(() => Number(params?.id || 0), [params])

  const loadMenuDetail = useCallback(async () => {
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

    try {
      const menuRes = await fetch(`${baseUrl}/menus/${menuId}`)
      const menuJson = (await menuRes.json()) as MenuDetailResponse

      if (!menuRes.ok) {
        throw new Error(menuJson.message || 'Gagal memuat detail menu')
      }

      const menuData = menuJson.data || null
      setMenu(menuData)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat detail menu')
    } finally {
      setLoading(false)
    }
  }, [menuId, router])

  useEffect(() => {
    void loadMenuDetail()
  }, [loadMenuDetail])

  const handleCreateOrder = async () => {
    if (!menu || !menu.vendor?.id) return
    if (quantity < 1) {
      setOrderError('Kuantitas minimal 1')
      return
    }

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token || !baseUrl) return

    setOrderLoading(true)
    setOrderError('')

    try {
      const payload = {
        vendorId: menu.vendor.id,
        items: [{ menuId: menu.id, quantity }],
        notes: notes || undefined,
        delivery_fee: deliveryFee || 0,
      }

      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || 'Gagal membuat pesanan')
      }

      // Order success, redirect to payment
      const orderId = json.data?.id || json.id
      if (orderId) {
        router.push(`/customer/payment/${orderId}`)
      } else {
        router.push('/customer/orders')
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Gagal membuat pesanan')
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl animate-pulse space-y-4'>
          <div className='h-32 animate-pulse rounded-3xl bg-muted/60' />
          <div className='h-96 animate-pulse rounded-2xl bg-muted/60' />
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Detail Menu</h1>
              <p className='max-w-2xl text-sm text-emerald-50'>
                Periksa detail makanan, atur jumlah pesanan, dan konfirmasi pilihan Anda.
              </p>
            </div>
            <Button variant='outline' className='bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20' onClick={() => router.push('/customer/dashboard')}>
              Kembali ke Dashboard
            </Button>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {menu ? (
          <div className='grid gap-6 md:grid-cols-3'>
            {/* Left side: Image and details */}
            <div className='md:col-span-2 space-y-6'>
              <Card className='overflow-hidden border-none shadow-md'>
                {menu.image_url ? (
                  <img src={menu.image_url} alt={menu.name} className='aspect-video w-full object-cover rounded-2xl shadow-sm' />
                ) : (
                  <div className='flex aspect-video w-full items-center justify-center bg-emerald-50/50 text-emerald-200 rounded-2xl shadow-sm'>
                    <Utensils className='size-20' />
                  </div>
                )}
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-2xl'>{menu.name}</CardTitle>
                    <Badge variant={menu.available ? 'default' : 'secondary'} className={menu.available ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}>
                      {menu.available ? 'Menu Aktif' : 'Menu Nonaktif'}
                    </Badge>
                  </div>
                  <CardDescription className='text-base mt-2'>
                    {menu.description || 'Menu catering dengan bahan berkualitas dan rasa autentik.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 sm:grid-cols-2'>
                  <div className='rounded-xl border bg-emerald-50/30 p-4 dark:bg-emerald-950/20'>
                    <p className='text-xs text-muted-foreground'>Harga</p>
                    <p className='mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400'>{formatCurrency(menu.price)}</p>
                  </div>
                  <div className='rounded-xl border bg-emerald-50/30 p-4 dark:bg-emerald-950/20'>
                    <p className='text-xs text-muted-foreground'>Kategori</p>
                    <p className='mt-1 text-lg font-medium'>{menu.category?.name || 'Tanpa Kategori'}</p>
                  </div>
                  <div className='rounded-xl border bg-emerald-50/30 p-4 dark:bg-emerald-950/20'>
                    <p className='text-xs text-muted-foreground'>Vendor</p>
                    <div className='mt-1 flex items-center gap-2'>
                      <MapPin className='size-4 text-emerald-500' />
                      <span className='font-medium'>{menu.vendor?.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side: Order Form */}
            <div className='space-y-6'>
              <Card className="sticky top-6 rounded-3xl border border-[--color-chart-3]/20 bg-card shadow-md ring-1 ring-[--color-chart-3]/10">
                <CardHeader className='bg-emerald-50/50 border-b dark:bg-emerald-950/20'>
                  <CardTitle className='flex items-center gap-2'>
                    <ShoppingCart className='size-5 text-emerald-600 dark:text-emerald-400' />
                    Buat Pesanan
                  </CardTitle>
                  <CardDescription>
                    Pesan menu ini sekarang.
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-6 space-y-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Kuantitas</label>
                    <div className='flex items-center gap-3'>
                      <Button 
                        variant='outline' 
                        size='icon'
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || !menu.available}
                      >
                        -
                      </Button>
                      <span className='w-8 text-center font-semibold'>{quantity}</span>
                      <Button 
                        variant='outline' 
                        size='icon'
                        onClick={() => setQuantity(q => q + 1)}
                        disabled={!menu.available}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Catatan (Opsional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className='flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50'
                      placeholder='Contoh: Tolong jangan pedas, minta sambal dipisah.'
                      disabled={!menu.available}
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Biaya Pengantaran (Demo)</label>
                    <input
                      type='number'
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50'
                      disabled={!menu.available}
                    />
                  </div>

                  {orderError ? (
                    <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                      {orderError}
                    </div>
                  ) : null}

                  <div className='pt-4 border-t'>
                    <div className='flex items-center justify-between mb-4'>
                      <span className='font-medium text-muted-foreground'>Subtotal</span>
                      <span className='text-lg font-bold text-emerald-600 dark:text-emerald-400'>
                        {formatCurrency((Number(menu.price) * quantity) + deliveryFee)}
                      </span>
                    </div>
                    <Button 
                      className="w-full bg-linear-to-r from-[--color-chart-3] to-[--color-chart-5] text-white hover:opacity-90 transition-opacity"
                      size='lg'
                      onClick={() => void handleCreateOrder()}
                      disabled={!menu.available || orderLoading}
                    >
                      {orderLoading ? 'Memproses...' : 'Buat Pesanan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

      </div>
    </main>
  )
}

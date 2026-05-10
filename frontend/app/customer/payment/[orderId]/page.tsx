'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BadgeDollarSign, Building2, QrCode, Wallet, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type OrderItem = {
  id: number
  menu_id: number
  quantity: number
  price: string | number
  subtotal: string | number
  menu: { id: number; name: string; image_url?: string }
}

type OrderDetail = {
  id: number
  total: string | number
  status: string
  created_at: string
  delivery_fee?: string | number
  vendor: { id: number; name: string }
  order_items: OrderItem[]
  payment?: { id: number; status: string; payment_method: string }
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

export default function CustomerDemoPaymentPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<OrderDetail | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'ewallet' | 'cash'>('transfer')
  const [paymentLoading, setPaymentLoading] = useState(false)

  const loadOrderDetail = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
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
      const res = await fetch(`${baseUrl}/orders/${params.orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        router.replace('/signin')
        return
      }

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat pesanan')
      }

      setOrder(json.data || json)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat pesanan')
    } finally {
      setLoading(false)
    }
  }, [params.orderId, router])

  useEffect(() => {
    void loadOrderDetail()
  }, [loadOrderDetail])

  const handlePayment = async () => {
    if (!order) return

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    
    if (!token || !baseUrl) return

    setPaymentLoading(true)

    try {
      // Attempt POST to /payments (scaffold endpoint)
      const res = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.id,
          payment_method: paymentMethod,
          amount: Number(order.total)
        })
      })

      if (!res.ok) {
        // Fallback demo mode if backend fails
        console.warn('Backend payment failed, falling back to demo mode.')
        throw new Error('Fallback')
      }
    } catch (err) {
      // Demo Mode Fallback Logging
      console.log('Demo mode activated. Saving to localStorage.')
      
      const existingPayments = JSON.parse(localStorage.getItem('demo_payments') || '[]')
      const newPayment = {
        id: Date.now(),
        order_id: order.id,
        amount: order.total,
        payment_method: paymentMethod,
        status: 'paid',
        created_at: new Date().toISOString(),
        vendor: { name: order.vendor.name }
      }
      
      existingPayments.push(newPayment)
      localStorage.setItem('demo_payments', JSON.stringify(existingPayments))
      
      // We can also flag the order as "paid" locally if we want, but typically 
      // the real backend would do this. Since we just need the demo to work visually,
      // we just record it.
      
    } finally {
      setPaymentLoading(false)
      // Redirect with fake alert
      alert('DEMO: Pembayaran berhasil dicatat!')
      router.push('/customer/orders')
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-3xl animate-pulse space-y-6'>
          <div className='h-32 rounded-3xl bg-muted' />
          <div className='h-96 rounded-2xl bg-muted' />
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-6'>
        
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <ShieldCheck className='size-3.5 text-emerald-300' />
                Pembayaran Aman
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Selesaikan Pembayaran</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Pilih metode pembayaran yang paling nyaman untuk Anda. Transaksi ini dalam mode simulasi.
              </p>
            </div>
            <Badge variant='outline' className='bg-yellow-500/20 text-yellow-100 border-yellow-500/50 hover:bg-yellow-500/30 font-bold tracking-widest'>
              DEMO MODE
            </Badge>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {order ? (
          <div className='grid gap-6 md:grid-cols-2'>
            {/* Left: Order Summary */}
            <div className='space-y-6'>
              <Card className='border-none shadow-md'>
                <CardHeader className='bg-muted/30 border-b pb-4'>
                  <CardTitle className='text-lg'>Ringkasan Pesanan</CardTitle>
                  <CardDescription>Pesanan #{order.id} ke {order.vendor.name}</CardDescription>
                </CardHeader>
                <CardContent className='p-6 space-y-4'>
                  <div className='space-y-3'>
                    {order.order_items.map((item) => (
                      <div key={item.id} className='flex justify-between items-start text-sm'>
                        <div>
                          <p className='font-medium'>{item.menu.name}</p>
                          <p className='text-muted-foreground'>{item.quantity}x {formatCurrency(item.price)}</p>
                        </div>
                        <p className='font-medium'>{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>

                  <div className='border-t pt-4 space-y-2 text-sm'>
                    <div className='flex justify-between text-muted-foreground'>
                      <span>Biaya Pengantaran</span>
                      <span>{formatCurrency(order.delivery_fee || 0)}</span>
                    </div>
                  </div>

                  <div className='border-t pt-4 flex justify-between items-center'>
                    <span className='font-semibold'>Total Pembayaran</span>
                    <span className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Payment Method */}
            <div className='space-y-6'>
              <Card className='border-emerald-200 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-900'>
                <CardHeader className='bg-emerald-50/50 border-b dark:bg-emerald-950/20'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Wallet className='size-5 text-emerald-600 dark:text-emerald-400' />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-6 space-y-4'>
                  
                  {/* Options */}
                  <div className='grid gap-3'>
                    <div 
                      className={`relative flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${paymentMethod === 'transfer' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'hover:bg-muted'}`}
                      onClick={() => setPaymentMethod('transfer')}
                    >
                      <div className={`flex size-10 items-center justify-center rounded-full ${paymentMethod === 'transfer' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-muted'}`}>
                        <Building2 className='size-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-medium'>Transfer Bank</h4>
                        <p className='text-xs text-muted-foreground'>BCA, Mandiri, BNI, BRI</p>
                      </div>
                      {paymentMethod === 'transfer' && <CheckCircle2 className='size-5 text-emerald-600' />}
                    </div>

                    <div 
                      className={`relative flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${paymentMethod === 'ewallet' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'hover:bg-muted'}`}
                      onClick={() => setPaymentMethod('ewallet')}
                    >
                      <div className={`flex size-10 items-center justify-center rounded-full ${paymentMethod === 'ewallet' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-muted'}`}>
                        <QrCode className='size-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-medium'>E-Wallet / QRIS</h4>
                        <p className='text-xs text-muted-foreground'>Scan melalui e-Wallet / M-Banking</p>
                      </div>
                      {paymentMethod === 'ewallet' && <CheckCircle2 className='size-5 text-emerald-600' />}
                    </div>

                    <div 
                      className={`relative flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'hover:bg-muted'}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <div className={`flex size-10 items-center justify-center rounded-full ${paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-muted'}`}>
                        <BadgeDollarSign className='size-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-medium'>Cash on Delivery</h4>
                        <p className='text-xs text-muted-foreground'>Bayar tunai di tempat</p>
                      </div>
                      {paymentMethod === 'cash' && <CheckCircle2 className='size-5 text-emerald-600' />}
                    </div>
                  </div>

                  <Button 
                    className='w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2 mt-4'
                    size='lg'
                    onClick={() => void handlePayment()}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                    {!paymentLoading && <ArrowRight className='size-4' />}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

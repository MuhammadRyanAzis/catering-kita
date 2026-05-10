'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquareText, Star, Store, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type OrderDetail = {
  id: number
  vendor: { id: number; name: string }
  order_items: { menu: { name: string } }[]
}

export default function CustomerNewReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<OrderDetail | null>(null)

  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) {
      setError('ID Pesanan tidak valid')
      setLoading(false)
      return
    }

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
      const res = await fetch(`${baseUrl}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        router.replace('/signin')
        return
      }

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat detail pesanan')
      }

      setOrder(json.data || json)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat pesanan')
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    void loadOrderDetail()
  }, [loadOrderDetail])

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setSubmitError('Silakan pilih rating bintang terlebih dahulu')
      return
    }

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    
    if (!token || !baseUrl || !orderId) return

    setSubmitLoading(true)
    setSubmitError('')

    try {
      // POST to /reviews
      const res = await fetch(`${baseUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: Number(orderId),
          rating,
          comment
        })
      })

      if (!res.ok) {
        throw new Error('Ulasan gagal dikirim, coba lagi nanti')
      }

      router.push('/customer/reviews')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ulasan gagal dikirim, coba lagi nanti')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl animate-pulse space-y-6'>
          <div className='h-32 rounded-3xl bg-muted' />
          <div className='h-96 rounded-2xl bg-muted' />
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-2xl space-y-6'>
        
        <header className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <Star className='size-3.5 text-amber-300' />
                Beri Penilaian
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Tulis Ulasan Baru</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Bagikan pengalamanmu terhadap pesanan ini.
              </p>
            </div>
            <Button variant='outline' className='bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20' onClick={() => router.push('/customer/orders')}>
              Batal
            </Button>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {!error && order ? (
          <Card className='border-emerald-200 shadow-md dark:border-emerald-900'>
            <CardHeader className='bg-emerald-50/50 border-b dark:bg-emerald-950/20'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Store className='size-5 text-emerald-600 dark:text-emerald-400' />
                Vendor: {order.vendor.name}
              </CardTitle>
              <CardDescription>
                Pesanan #{order.id} • {order.order_items.map(i => i.menu.name).join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-6'>
              
              <div className='space-y-4'>
                <div className='text-center space-y-2'>
                  <label className='text-sm font-medium'>Bagaimana kualitas makanannya?</label>
                  <div className='flex justify-center gap-2'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type='button'
                        className='transition-transform hover:scale-110 focus:outline-none'
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <Star 
                          className={`size-10 transition-colors ${
                            star <= (hoveredRating || rating) 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-muted-foreground/30'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className='text-sm text-emerald-600 font-medium'>
                      {rating === 5 ? 'Sempurna!' : rating >= 4 ? 'Sangat Baik' : rating >= 3 ? 'Cukup Baik' : 'Kurang Memuaskan'}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Komentar Tambahan (Opsional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className='flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50'
                    placeholder='Ceritakan pengalamanmu memesan menu ini...'
                    disabled={submitLoading}
                  />
                </div>

                {submitError && (
                  <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                    {submitError}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className='bg-muted/10 border-t p-6'>
              <Button 
                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2'
                size='lg'
                onClick={() => void handleSubmitReview()}
                disabled={submitLoading || rating === 0}
              >
                {submitLoading ? 'Mengirim...' : 'Kirim Ulasan'}
                {!submitLoading && <CheckCircle2 className='size-4' />}
              </Button>
            </CardFooter>
          </Card>
        ) : null}

      </div>
    </main>
  )
}

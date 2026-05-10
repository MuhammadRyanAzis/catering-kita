'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquareText, Star, Store, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Review = {
  id: number
  order_id: number
  vendor_id: number
  rating: number
  comment?: string
  created_at: string
  vendor?: {
    id: number
    name: string
  }
}

type ReviewsResponse = {
  data?: Review[]
  message?: string
}

export default function CustomerReviewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [isGracefulFallback, setIsGracefulFallback] = useState(false)

  const loadReviews = useCallback(async () => {
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
      // Dapatkan reviews langsung dari endpoint /reviews
      const reviewsRes = await fetch(`${baseUrl}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (reviewsRes.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.replace('/signin')
        return
      }

      if (!reviewsRes.ok) {
        throw new Error('Fallback')
      }

      const reviewsJson = (await reviewsRes.json()) as ReviewsResponse
      setReviews(reviewsJson.data || [])
      setError('')
      setIsGracefulFallback(false)
    } catch (err) {
      // Graceful fallback jika backend scaffold error / belum sedia
      console.warn('Endpoint /reviews gagal, mengaktifkan graceful fallback')
      setReviews([])
      setIsGracefulFallback(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl animate-pulse space-y-6'>
          <div className='h-32 rounded-3xl bg-muted' />
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-32 rounded-2xl bg-muted' />
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
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <Star className='size-3.5 text-amber-300' />
                Ulasan Customer
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Ulasan Saya</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Kelola ulasan dan rating yang pernah Anda berikan untuk vendor.
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

        {isGracefulFallback && (
          <div className='rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-3 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'>
            <ShieldCheck className='size-5 shrink-0 mt-0.5' />
            <div>
              <p className='font-medium'>Fitur Ulasan Segera Hadir</p>
              <p className='mt-1 opacity-90'>Saat ini fitur sinkronisasi ulasan sedang dalam pengembangan (Demo Mode). Anda dapat memberikan ulasan, namun riwayat mungkin belum muncul di sini.</p>
            </div>
          </div>
        )}

        {reviews.length === 0 && !error && !isGracefulFallback ? (
          <div className='rounded-2xl border border-dashed bg-card p-12 text-center flex flex-col items-center justify-center mt-8'>
            <div className='flex size-20 items-center justify-center rounded-full bg-emerald-50 mb-6 dark:bg-emerald-950/30'>
              <MessageSquareText className='size-10 text-emerald-500 opacity-80' />
            </div>
            <h3 className='text-xl font-medium'>Belum ada ulasan</h3>
            <p className='text-sm text-muted-foreground mt-2 max-w-md'>
              Anda belum pernah memberikan ulasan. Berikan rating pada pesanan yang sudah selesai untuk membantu customer lain!
            </p>
            <Button className='mt-8 bg-emerald-600 hover:bg-emerald-700 text-white' onClick={() => router.push('/customer/orders')}>
              Lihat Riwayat Pesanan
            </Button>
          </div>
        ) : null}

        <div className='grid gap-4'>
          {reviews.map((review) => (
            <Card key={review.id} className='overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'>
              <CardHeader className='border-b bg-muted/30 py-3 sm:py-4'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-1.5 font-medium'>
                      <Store className='size-4 text-emerald-600 dark:text-emerald-400' />
                      {review.vendor?.name || 'Vendor'}
                    </div>
                    <span className='text-xs text-muted-foreground'>•</span>
                    <span className='text-xs text-muted-foreground'>
                      {new Date(review.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className='flex gap-0.5 text-amber-500'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${i < review.rating ? 'fill-current' : 'text-muted/40 fill-muted/40'}`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-4 sm:p-6'>
                {review.comment ? (
                  <p className='text-sm'>{review.comment}</p>
                ) : (
                  <p className='text-sm text-muted-foreground italic'>Tidak ada komentar teks.</p>
                )}
                {review.vendor?.id && (
                  <div className='mt-4 flex'>
                    <Button variant='outline' size='sm' onClick={() => router.push(`/customer/vendors/${review.vendor!.id}`)}>
                      Lihat Vendor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}

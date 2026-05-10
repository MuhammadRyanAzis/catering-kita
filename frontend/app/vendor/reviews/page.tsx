'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquareText, ShieldCheck, Star, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { deleteCookies } from '@/helper/cookies'

type VendorProfile = {
  id: number
  name: string
}

type ReviewItem = {
  id: number
  rating: number
  comment?: string
  created_at: string
  customerName: string
}

type VendorReviewsResponse = {
  vendor?: VendorProfile
  avgRating?: number
  totalRatings?: number
  data?: ReviewItem[]
  message?: string
}

export default function VendorReviewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [avgRating, setAvgRating] = useState(0)

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadVendorReviews = useCallback(async () => {
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
      const reviewsRes = await fetch(`${baseUrl}/reviews/vendor`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (reviewsRes.status === 401) {
        await handleLogout()
        return
      }

      const reviewsJson = (await reviewsRes.json()) as VendorReviewsResponse

      if (!reviewsRes.ok) {
        throw new Error(reviewsJson.message || 'Gagal memuat ulasan pelanggan')
      }

      setVendor(reviewsJson.vendor || null)
      setReviews(reviewsJson.data || [])
      setAvgRating(reviewsJson.avgRating || 0)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat ulasan')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadVendorReviews()
  }, [loadVendorReviews])

  const ratingDistribution = useMemo(() => {
    const rows = [5, 4, 3, 2, 1].map((rating) => {
      const count = reviews.filter((review) => review.rating === rating).length
      return { rating, count }
    })
    const total = reviews.length
    return rows.map((row) => ({
      ...row,
      percent: total ? Math.round((row.count / total) * 100) : 0,
    }))
  }, [reviews])

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-5xl animate-pulse space-y-6'>
          <div className='h-32 rounded-3xl bg-muted' />
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-28 rounded-2xl bg-muted' />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-indigo-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <Star className='size-3.5 text-amber-300' />
                Ulasan Pelanggan
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Suara Pelanggan</h1>
              <p className='max-w-xl text-sm text-sky-50'>
                Pantau kepuasan pelanggan untuk {vendor?.name || 'vendor'} dan tingkatkan kualitas layanan.
              </p>
            </div>
            <Button
              variant='outline'
              className='bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20'
              onClick={() => router.push('/vendor/dashboard')}
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        <section className='grid gap-4 lg:grid-cols-[1.1fr_1fr]'>
          <Card className='border-border/60'>
            <CardHeader>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <h2 className='text-lg font-semibold'>Ringkasan Rating</h2>
                  <p className='text-sm text-muted-foreground'>Tinjau performa layanan terbaru.</p>
                </div>
                <Badge variant='outline' className='gap-1'>
                  <Store className='size-3.5' />
                  {vendor?.name || 'Vendor'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-baseline gap-3'>
                <p className='text-4xl font-bold text-foreground'>{avgRating.toFixed(1)}</p>
                <div className='flex gap-1 text-amber-500'>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`size-4 ${index < Math.round(avgRating) ? 'fill-current' : 'text-muted/40 fill-muted/40'}`}
                    />
                  ))}
                </div>
                <span className='text-sm text-muted-foreground'>({reviews.length} ulasan)</span>
              </div>
              <div className='space-y-2'>
                {ratingDistribution.map((row) => (
                  <div key={row.rating} className='flex items-center gap-3 text-sm'>
                    <span className='w-8 font-medium'>{row.rating}★</span>
                    <div className='h-2 flex-1 rounded-full bg-muted overflow-hidden'>
                      <div className='h-full rounded-full bg-amber-400' style={{ width: `${row.percent}%` }} />
                    </div>
                    <span className='w-10 text-right text-muted-foreground'>{row.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60'>
            <CardHeader>
              <h2 className='text-lg font-semibold'>Insight Cepat</h2>
              <p className='text-sm text-muted-foreground'>Tindak lanjut rekomendasi layanan.</p>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700'>
                {reviews.length > 0 ? 'Terus jaga standar layanan terbaik.' : 'Belum ada ulasan, ajak pelanggan memberi rating.'}
              </div>
              <div className='rounded-lg border border-sky-200 bg-sky-50 p-3 text-sky-700'>
                Review terbaru membantu mempromosikan menu unggulan vendor.
              </div>
            </CardContent>
          </Card>
        </section>

        {reviews.length === 0 && !error ? (
          <div className='rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground'>
            <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted/40'>
              <MessageSquareText className='size-7 text-muted-foreground' />
            </div>
            Belum ada ulasan pelanggan untuk vendor ini.
          </div>
        ) : (
          <div className='grid gap-4'>
            {reviews.map((review) => (
              <Card key={review.id} className='overflow-hidden'>
                <CardHeader className='border-b bg-muted/30 py-3 sm:py-4'>
                  <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-1.5 font-medium'>
                        <ShieldCheck className='size-4 text-emerald-600' />
                        {review.customerName || 'Customer'}
                      </div>
                      <span className='text-xs text-muted-foreground'>•</span>
                      <span className='text-xs text-muted-foreground'>
                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

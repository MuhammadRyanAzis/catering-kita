'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type VendorDetail = {
  id: number
  name: string
  description?: string
  address: string
  city: string
  phone: string
  image_url?: string
  banner_url?: string
  subscription_price_7?: number | string
  subscription_price_30?: number | string
  is_active: boolean
  avgRating?: number
  totalRatings?: number
  _count?: {
    menus: number
    orders: number
    reviews: number
    vendor_ratings?: number
  }
}

type VendorRating = {
  id: number
  rating: number
  comment?: string
  created_at: string
  customerName: string
}

type MenuItem = {
  id: number
  name: string
  description?: string
  price: number | string
  available: boolean
  image_url?: string
  category?: {
    id: number
    name: string
  }
}

type VendorDetailResponse = {
  id: number
  name: string
  description?: string
  address: string
  city: string
  phone: string
  image_url?: string
  banner_url?: string
  subscription_price_7?: number | string
  subscription_price_30?: number | string
  is_active: boolean
  avgRating?: number
  totalRatings?: number
  ratings?: VendorRating[]
  _count?: {
    menus: number
    orders: number
    reviews: number
    vendor_ratings?: number
  }
  message?: string
}

type VendorMenusResponse = {
  data?: MenuItem[]
  message?: string
}

type VendorRatingsResponse = {
  avgRating?: number
  totalRatings?: number
  data?: VendorRating[]
  message?: string
}

function formatCurrency(value?: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

export default function CustomerVendorDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [ratings, setRatings] = useState<VendorRating[]>([])
  const [ratingValue, setRatingValue] = useState('5')
  const [ratingComment, setRatingComment] = useState('')
  const [ratingError, setRatingError] = useState('')
  const [ratingSuccess, setRatingSuccess] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [subscriptionSuccess, setSubscriptionSuccess] = useState('')

  const vendorId = useMemo(() => Number(params?.id || 0), [params])

  const loadVendorDetail = useCallback(async () => {
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

    if (!vendorId) {
      setError('ID vendor tidak valid')
      setLoading(false)
      return
    }

    try {
      const [vendorRes, menusRes, ratingsRes] = await Promise.all([
        fetch(`${baseUrl}/vendors/${vendorId}`),
        fetch(`${baseUrl}/vendors/${vendorId}/menus`),
        fetch(`${baseUrl}/vendors/${vendorId}/ratings`),
      ])

      const vendorJson = (await vendorRes.json()) as VendorDetailResponse
      const menusJson = (await menusRes.json()) as VendorMenusResponse
      const ratingsJson = (await ratingsRes.json()) as VendorRatingsResponse

      if (!vendorRes.ok) {
        throw new Error(vendorJson.message || 'Gagal memuat detail vendor')
      }

      if (!menusRes.ok) {
        throw new Error(menusJson.message || 'Gagal memuat daftar menu vendor')
      }

      if (!ratingsRes.ok) {
        throw new Error(ratingsJson.message || 'Gagal memuat rating vendor')
      }

      // We intentionally render only public-facing fields for customer view.
      setVendor({
        id: vendorJson.id,
        name: vendorJson.name,
        description: vendorJson.description,
        address: vendorJson.address,
        city: vendorJson.city,
        phone: vendorJson.phone,
        image_url: vendorJson.image_url,
        banner_url: vendorJson.banner_url,
        subscription_price_7: vendorJson.subscription_price_7,
        subscription_price_30: vendorJson.subscription_price_30,
        is_active: vendorJson.is_active,
        avgRating: vendorJson.avgRating,
        totalRatings: vendorJson.totalRatings,
        _count: vendorJson._count,
      })
      setMenus(menusJson.data || [])
      setRatings(ratingsJson.data || vendorJson.ratings || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat detail vendor')
    } finally {
      setLoading(false)
    }
  }, [router, vendorId])

  useEffect(() => {
    void loadVendorDetail()
  }, [loadVendorDetail])

  const submitVendorRating = async () => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token || !baseUrl || !vendorId) {
      setRatingError('Sesi tidak valid, silakan login ulang')
      return
    }

    setRatingLoading(true)
    setRatingError('')
    setRatingSuccess('')

    try {
      const res = await fetch(`${baseUrl}/vendors/${vendorId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: Number(ratingValue),
          comment: ratingComment || undefined,
        }),
      })

      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal menyimpan rating vendor')
      }

      setRatingSuccess('Rating vendor berhasil disimpan')
      setRatingComment('')
      await loadVendorDetail()
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : 'Gagal menyimpan rating vendor')
    } finally {
      setRatingLoading(false)
    }
  }

  const submitSubscription = async (plan: 'DAYS_7' | 'DAYS_30') => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token || !baseUrl || !vendorId) {
      setSubscriptionError('Sesi tidak valid, silakan login ulang')
      return
    }

    setSubscriptionLoading(true)
    setSubscriptionError('')
    setSubscriptionSuccess('')

    try {
      const res = await fetch(`${baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendorId,
          plan,
        }),
      })

      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal membuat langganan')
      }

      setSubscriptionSuccess('Langganan berhasil dibuat')
    } catch (err) {
      setSubscriptionError(err instanceof Error ? err.message : 'Gagal membuat langganan')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl animate-pulse space-y-4'>
          <div className='h-10 w-72 rounded bg-muted' />
          <div className='h-60 rounded-2xl bg-muted' />
          <div className='h-52 rounded-2xl bg-muted' />
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Detail Vendor</h1>
          <Button variant='outline' onClick={() => router.push('/customer/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </div>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {vendor ? (
          <Card className='pt-0'>
            {vendor.banner_url ? (
              <img src={vendor.banner_url} alt={`${vendor.name} banner`} className='aspect-video w-full object-cover' />
            ) : (
              <div className='aspect-video w-full bg-muted/40' />
            )}
            <CardHeader>
              <CardTitle>{vendor.name}</CardTitle>
              <CardDescription>
                {vendor.description || 'Vendor catering terpercaya untuk kebutuhan harian dan acara spesial.'}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='rounded-xl border p-3'>
                <p className='text-xs text-muted-foreground'>Kota</p>
                <p className='mt-1 font-medium'>{vendor.city || '-'}</p>
              </div>
              <div className='rounded-xl border p-3'>
                <p className='text-xs text-muted-foreground'>Alamat</p>
                <p className='mt-1 line-clamp-2 font-medium'>{vendor.address || '-'}</p>
              </div>
              <div className='rounded-xl border p-3'>
                <p className='text-xs text-muted-foreground'>Telepon</p>
                <p className='mt-1 font-medium'>{vendor.phone || '-'}</p>
              </div>
              <div className='rounded-xl border p-3'>
                <p className='text-xs text-muted-foreground'>Rating</p>
                <p className='mt-1 font-medium'>
                  {vendor.avgRating?.toFixed(1) || '0.0'} ({vendor.totalRatings || 0} rating)
                </p>
              </div>
            </CardContent>
            <CardContent className='pt-0 space-y-3'>
              <div className='rounded-xl border border-dashed bg-muted/30 p-3 text-sm'>
                <p className='text-xs font-medium text-muted-foreground'>Paket Langganan</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  <Badge variant='outline'>7 Hari: {formatCurrency(vendor.subscription_price_7)}</Badge>
                  <Badge variant='outline'>30 Hari: {formatCurrency(vendor.subscription_price_30)}</Badge>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  onClick={() => void submitSubscription('DAYS_7')}
                  disabled={subscriptionLoading || !vendor.subscription_price_7}
                >
                  {subscriptionLoading ? 'Memproses...' : 'Langganan 7 Hari'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => void submitSubscription('DAYS_30')}
                  disabled={subscriptionLoading || !vendor.subscription_price_30}
                >
                  {subscriptionLoading ? 'Memproses...' : 'Langganan 30 Hari'}
                </Button>
              </div>
              {subscriptionError ? (
                <p className='text-xs text-destructive'>{subscriptionError}</p>
              ) : null}
              {subscriptionSuccess ? (
                <p className='text-xs text-emerald-600'>{subscriptionSuccess}</p>
              ) : null}
            </CardContent>
            <CardFooter className='gap-2'>
              <Badge variant={vendor.is_active ? 'default' : 'outline'}>
                {vendor.is_active ? 'Vendor Aktif' : 'Vendor Nonaktif'}
              </Badge>
              <Badge variant='secondary'>{menus.length} Menu</Badge>
            </CardFooter>
          </Card>
        ) : null}

        <section className='space-y-3'>
          <h2 className='text-lg font-semibold'>Rating Vendor</h2>
          <Card>
            <CardHeader>
              <CardTitle>Beri Rating Vendor</CardTitle>
              <CardDescription>Pilih skor 1-5 dan komentar opsional.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-xs text-muted-foreground'>Skor</label>
                  <select
                    value={ratingValue}
                    onChange={(event) => setRatingValue(event.target.value)}
                    className='h-9 w-full rounded-md border border-input bg-input/30 px-3 text-sm'
                    disabled={ratingLoading}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} bintang
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='mb-1 block text-xs text-muted-foreground'>Komentar</label>
                  <input
                    value={ratingComment}
                    onChange={(event) => setRatingComment(event.target.value)}
                    placeholder='Opsional'
                    className='h-9 w-full rounded-md border border-input bg-input/30 px-3 text-sm'
                    disabled={ratingLoading}
                  />
                </div>
              </div>
              {ratingError ? <p className='text-xs text-destructive'>{ratingError}</p> : null}
              {ratingSuccess ? <p className='text-xs text-emerald-600'>{ratingSuccess}</p> : null}
            </CardContent>
            <CardFooter>
              <Button onClick={() => void submitVendorRating()} disabled={ratingLoading}>
                {ratingLoading ? 'Menyimpan...' : 'Kirim Rating Vendor'}
              </Button>
            </CardFooter>
          </Card>

          <div className='grid gap-3'>
            {ratings.length === 0 ? (
              <div className='rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground'>
                Belum ada rating vendor.
              </div>
            ) : (
              ratings.map((rating) => (
                <Card key={rating.id} size='sm'>
                  <CardContent className='space-y-1'>
                    <p className='text-sm font-medium'>
                      {rating.customerName} • {rating.rating}/5
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(rating.created_at).toLocaleDateString('id-ID')}
                    </p>
                    {rating.comment ? <p className='text-sm'>{rating.comment}</p> : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className='space-y-3'>
          <h2 className='text-lg font-semibold'>Menu dari Vendor Ini</h2>
          {menus.length === 0 ? (
            <div className='rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground'>
              Vendor ini belum punya menu.
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {menus.map((menu) => (
                <Card key={menu.id} className='pt-0'>
                  {menu.image_url ? (
                    <img src={menu.image_url} alt={menu.name} className='aspect-video w-full object-cover' />
                  ) : (
                    <div className='aspect-video w-full bg-muted/30' />
                  )}
                  <CardHeader>
                    <CardTitle>{menu.name}</CardTitle>
                    <CardDescription>
                      {menu.description || 'Menu catering dengan rasa autentik dan bahan berkualitas.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <p className='text-sm font-medium'>{formatCurrency(menu.price)}</p>
                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary'>{menu.category?.name || 'Tanpa Kategori'}</Badge>
                      <Badge variant={menu.available ? 'default' : 'outline'}>
                        {menu.available ? 'Available' : 'Sold Out'}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className='w-full' onClick={() => router.push(`/customer/menus/${menu.id}`)}>
                      Detail Menu
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

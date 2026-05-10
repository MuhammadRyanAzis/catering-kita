'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Star, Store, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type VendorItem = {
  id: number
  name: string
  city: string
  address: string
  description?: string
  image_url?: string
  subscription_price_7?: number | string
  subscription_price_30?: number | string
  avgRating?: number
  totalMenus?: number
  totalOrders?: number
}

type VendorsResponse = {
  data?: VendorItem[]
  message?: string
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80'

function formatCurrency(value?: number | string) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

export default function CustomerVendorsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const loadVendors = useCallback(async () => {
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
      const res = await fetch(`${baseUrl}/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.replace('/signin')
        return
      }

      const json = (await res.json()) as VendorsResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat daftar vendor')
      }

      setVendors(json.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat vendor')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadVendors()
  }, [loadVendors])

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl animate-pulse space-y-6'>
          <div className='h-8 w-64 rounded bg-muted' />
          <div className='h-10 w-full max-w-md rounded-md bg-muted' />
          <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className='h-80 rounded-2xl bg-muted' />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <Store className='size-3.5 text-emerald-300' />
                Katalog Catering
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Eksplorasi Vendor</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Temukan layanan catering terbaik di kotamu untuk segala kebutuhan.
              </p>
            </div>
          </div>
        </header>

        <div className='flex max-w-md items-center gap-2 rounded-md border bg-background px-3 py-2'>
          <Search className='size-4 text-muted-foreground' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Cari nama vendor atau kota...'
            className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
          />
        </div>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {filteredVendors.length === 0 && !error ? (
          <div className='rounded-2xl border border-dashed bg-card p-12 text-center flex flex-col items-center justify-center mt-8'>
            <div className='flex size-20 items-center justify-center rounded-full bg-muted/50 mb-6'>
              <Store className='size-10 text-muted-foreground opacity-50' />
            </div>
            <h3 className='text-xl font-medium'>Vendor tidak ditemukan</h3>
            <p className='text-sm text-muted-foreground mt-2 max-w-md'>
              Cobalah kata kunci lain atau periksa kembali ejaan pencarian Anda.
            </p>
          </div>
        ) : null}

        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className='overflow-hidden border-none bg-background shadow-sm transition-transform duration-300 hover:-translate-y-1'>
              <div className='relative aspect-video w-full'>
                <img
                  src={vendor.image_url || FALLBACK_IMAGE}
                  alt={vendor.name}
                  className='h-full w-full object-cover'
                />
                {vendor.avgRating ? (
                  <div className='absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur-sm'>
                    <Star className='size-3 text-amber-500 fill-amber-500' />
                    {vendor.avgRating.toFixed(1)}
                  </div>
                ) : null}
              </div>
              <CardHeader className='pb-3'>
                <CardTitle className='line-clamp-1'>{vendor.name}</CardTitle>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <MapPin className='size-3.5' />
                  {vendor.city || 'Kota belum diset'}
                </div>
              </CardHeader>
              <CardContent className='pb-3 text-sm text-muted-foreground'>
                <p className='line-clamp-2'>
                  {vendor.description || 'Vendor catering profesional untuk berbagai kebutuhan acara Anda.'}
                </p>
                <div className='mt-4 grid gap-2 rounded-xl border border-dashed bg-muted/30 p-3 text-xs text-foreground'>
                  <p className='font-medium text-muted-foreground'>Paket Langganan</p>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='outline'>7 Hari: {formatCurrency(vendor.subscription_price_7)}</Badge>
                    <Badge variant='outline'>30 Hari: {formatCurrency(vendor.subscription_price_30)}</Badge>
                  </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Badge variant='secondary' className='font-normal'>
                    {vendor.totalMenus || 0} Menu
                  </Badge>
                  <Badge variant='secondary' className='font-normal'>
                    {vendor.totalOrders || 0} Pesanan Selesai
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className='w-full' 
                  onClick={() => router.push(`/customer/vendors/${vendor.id}`)}
                >
                  Lihat Detail Vendor
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BadgeDollarSign,
  MapPin,
  Search,
  Sparkles,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { deleteCookies } from '@/helper/cookies'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type MenuItem = {
  id: number
  name: string
  description?: string
  price: number | string
  available: boolean
  image_url?: string
  vendor?: {
    id: number
    name: string
  }
  category?: {
    id: number
    name: string
  }
}

type VendorItem = {
  id: number
  name: string
  city: string
  address: string
  description?: string
  image_url?: string
  avgRating?: number
  totalMenus?: number
  status?: 'OPEN' | 'CLOSED' | 'BUSY'
  distanceKm?: number
}

type MenuResponse = {
  data?: MenuItem[]
  message?: string
}

type VendorResponse = {
  data?: VendorItem[]
  message?: string
}

const FALLBACK_MENU_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80'

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadDashboard = useCallback(async () => {
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

    if (parsedUser.role === 'VENDOR') {
      router.replace('/vendor/dashboard')
      return
    }

    if (parsedUser.role === 'ADMIN') {
      router.replace('/dashboard')
      return
    }

    if (parsedUser.role !== 'CUSTOMER') {
      router.replace('/signin')
      return
    }

    setUser(parsedUser)

    try {
      const [menusRes, vendorsRes] = await Promise.all([
        fetch(`${baseUrl}/menus`),
        fetch(`${baseUrl}/vendors`),
      ])

      if (menusRes.status === 401 || vendorsRes.status === 401) {
        await handleLogout()
        return
      }

      const menusJson = (await menusRes.json()) as MenuResponse
      const vendorsJson = (await vendorsRes.json()) as VendorResponse
      if (!menusRes.ok) {
        throw new Error(menusJson.message || 'Gagal memuat data menu')
      }

      if (!vendorsRes.ok) {
        throw new Error(vendorsJson.message || 'Gagal memuat data vendor')
      }

      setMenus(menusJson.data || [])
      setVendors(vendorsJson.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat menu')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const availableMenus = useMemo(() => menus.filter((menu) => menu.available), [menus])
  const featuredVendors = useMemo(
    () => vendors.slice().sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)).slice(0, 12),
    [vendors],
  )
  const uniqueCities = useMemo(() => new Set(vendors.map((vendor) => vendor.city).filter(Boolean)).size, [vendors])
  const averagePrice = useMemo(() => {
    if (menus.length === 0) {
      return 0
    }
    return menus.reduce((sum, menu) => sum + Number(menu.price || 0), 0) / menus.length
  }, [menus])
  const categories = useMemo(() => {
    const items = menus
      .map((menu) => menu.category?.name)
      .filter((name): name is string => Boolean(name))
    return ['Semua', ...Array.from(new Set(items))]
  }, [menus])
  const filteredMenus = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return menus.filter((menu) => {
      const matchesQuery = normalizedQuery
        ? [menu.name, menu.description, menu.vendor?.name, menu.category?.name]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedQuery))
        : true
      const matchesCategory = selectedCategory === 'Semua'
        ? true
        : menu.category?.name === selectedCategory
      return matchesQuery && matchesCategory
    })
  }, [menus, searchQuery, selectedCategory])
  const menuPlaceholders = useMemo(() => {
    const minCards = 3
    if (filteredMenus.length >= minCards) {
      return [] as number[]
    }
    return Array.from({ length: minCards - filteredMenus.length }, (_, index) => index)
  }, [filteredMenus.length])

  const getVendorStatus = (vendor: VendorItem) => {
    if (!vendor.status) {
      return {
        label: 'Status belum tersedia',
        className: 'border-slate-200 bg-slate-50 text-slate-600',
      }
    }

    if (vendor.status === 'OPEN') {
      return { label: 'Buka', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
    }

    if (vendor.status === 'BUSY') {
      return { label: 'Penuh', className: 'border-amber-200 bg-amber-50 text-amber-700' }
    }

    return { label: 'Tutup', className: 'border-rose-200 bg-rose-50 text-rose-700' }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl animate-pulse space-y-6'>
          <div className='h-8 w-64 rounded bg-muted' />
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='h-92.5 animate-pulse rounded-2xl bg-muted/60' />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-end justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <Sparkles className='size-3.5 text-emerald-300' />
                Halo, {user?.name}
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Temukan Menu Favoritmu Hari Ini</h1>
              <p className='max-w-2xl text-sm text-emerald-50'>
                Jelajahi vendor terbaik, bandingkan menu, dan pilih paket catering yang paling cocok untuk kebutuhanmu.
              </p>
            </div>
          </div>
          <div className='relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-2xl border-l-4 border-l-[--color-chart-4] border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
              <p className='text-xs text-emerald-100'>Menu Tersedia</p>
              <p className='mt-1 text-xl font-semibold'>{availableMenus.length}</p>
            </div>
            <div className='rounded-2xl border-l-4 border-l-[--color-chart-4] border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
              <p className='text-xs text-emerald-100'>Total Vendor</p>
              <p className='mt-1 text-xl font-semibold'>{vendors.length}</p>
            </div>
            <div className='rounded-2xl border-l-4 border-l-[--color-chart-4] border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
              <p className='text-xs text-emerald-100'>Kota Terjangkau</p>
              <p className='mt-1 text-xl font-semibold'>{uniqueCities}</p>
            </div>
            <div className='rounded-2xl border-l-4 border-l-[--color-chart-4] border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
              <p className='text-xs text-emerald-100'>Rata-rata Harga</p>
              <p className='mt-1 text-xl font-semibold'>{formatCurrency(averagePrice)}</p>
            </div>
          </div>
        </header>

        <div className='flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center'>
          <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative w-full sm:max-w-md'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Cari menu, vendor, atau kategori...'
                className='pl-9'
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {!error && menus.length === 0 ? (
          <div className='rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground'>
            Belum ada menu yang bisa ditampilkan.
          </div>
        ) : null}

        <section className='space-y-3 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6 backdrop-blur-sm'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[--color-chart-3]" />
                <h2 className='text-lg font-semibold'>Vendor Pilihan</h2>
              </div>
              <p className='text-sm text-muted-foreground'>Cocok untuk catering harian sampai acara besar.</p>
            </div>
            <Badge variant='outline' className='gap-1'>
              <Store className='size-3.5' />
              Top Vendor
            </Badge>
          </div>
          {featuredVendors.length > 0 ? (
            <Carousel className='w-full'>
              <CarouselContent className='-ml-1'>
                {featuredVendors.map((vendor) => (
                  <CarouselItem key={vendor.id} className='basis-[78%] pl-1 sm:basis-1/2 lg:basis-1/3'>
                    <div className='p-1'>
                      <Card className='h-full border-none bg-background pt-0 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 rounded-2xl overflow-hidden'>
                        {vendor.image_url ? (
                          <img
                            src={vendor.image_url}
                            alt={vendor.name}
                            className='h-36 w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-28 w-full items-center justify-center bg-muted/40 text-xs text-muted-foreground'>
                            Belum ada foto profil vendor
                          </div>
                        )}
                        <CardContent className='space-y-2'>
                            <div className='flex items-start justify-between gap-2'>
                              <h3 className='font-medium'>{vendor.name}</h3>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                  getVendorStatus(vendor).className
                                }`}
                              >
                                {getVendorStatus(vendor).label}
                              </span>
                            </div>
                          <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <MapPin className='size-3.5' />
                              {vendor.city || '-'}
                              {typeof vendor.distanceKm === 'number' ? ` • ${vendor.distanceKm.toFixed(1)} km` : ''}
                          </p>
                          <p className='line-clamp-2 text-xs text-muted-foreground'>
                            {vendor.description || 'Vendor catering untuk kebutuhan harian dan acara spesial.'}
                          </p>
                          <p className='text-xs text-foreground'>
                            Rating {vendor.avgRating?.toFixed(1) || '0.0'} • {vendor.totalMenus || 0} menu
                          </p>
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
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className='rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground'>
              Belum ada vendor aktif untuk ditampilkan.
            </div>
          )}
        </section>

        <section className='space-y-3 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6 backdrop-blur-sm'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[--color-chart-3]" />
                <h2 className='text-lg font-semibold'>Explore Menu</h2>
              </div>
              <p className='text-sm text-muted-foreground'>Temukan kombinasi rasa terbaik dari tiap vendor.</p>
            </div>
            <Badge variant='outline' className='gap-1'>
              <UtensilsCrossed className='size-3.5' />
              {menus.length} Menu
            </Badge>
          </div>
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
            {filteredMenus.map((menu) => (
              <Card key={menu.id} className='relative mx-auto w-full max-w-sm border-none bg-background pt-0 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 rounded-2xl overflow-hidden'>
                <div className='absolute inset-0 z-30 aspect-video bg-linear-to-t from-black/60 via-black/20 to-transparent' />
                <img
                  src={menu.image_url || FALLBACK_MENU_IMAGE}
                  alt={menu.name}
                  className='relative z-20 aspect-video w-full object-cover brightness-60'
                />
                <CardHeader>
                  <CardAction>
                    <Badge variant='secondary'>{menu.available ? 'Available' : 'Sold Out'}</Badge>
                  </CardAction>
                  <CardTitle>{menu.name}</CardTitle>
                  <CardDescription>
                    {menu.description || 'Menu catering pilihan untuk kebutuhan harian dan acara spesial.'}
                  </CardDescription>
                  <CardDescription className='text-foreground'>
                    {formatCurrency(menu.price)}
                    {menu.vendor?.name ? ` • ${menu.vendor.name}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardFooter className='gap-2 flex-col sm:flex-wrap'>
                  <Button
                    variant='outline'
                    className='w-full'
                    disabled={!menu.id}
                    onClick={() => {
                      if (menu.id) {
                        router.push(`/customer/menus/${menu.id}`)
                      }
                    }}
                  >
                    Detail Menu
                  </Button>
                  <Button
                    className='w-full bg-emerald-600 hover:bg-emerald-700 text-white'
                    disabled={!menu.available || !menu.id}
                    onClick={() => {
                      if (menu.id && menu.available) {
                        router.push(`/customer/menus/${menu.id}`)
                      }
                    }}
                  >
                    Pesan Sekarang
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {menuPlaceholders.map((placeholder) => (
              <div
                key={`menu-placeholder-${placeholder}`}
                className='flex min-h-70 flex-col justify-between rounded-2xl border border-dashed border-emerald-200/70 bg-linear-to-br from-emerald-50 via-white to-white p-5 text-sm text-muted-foreground'
              >
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500/70'>Coming Soon</p>
                  <h3 className='mt-2 text-lg font-semibold text-emerald-900'>Nantikan menu menarik lainnya</h3>
                  <p className='mt-2 text-xs text-muted-foreground'>Kami sedang menyiapkan pilihan menu baru untukmu.</p>
                </div>
                <div className='h-2 w-20 rounded-full bg-emerald-100' />
              </div>
            ))}
          </div>
          {filteredMenus.length === 0 ? (
            <div className='rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700'>
              Belum ada menu yang cocok dengan pencarianmu. Coba kata kunci lain atau kategori berbeda.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

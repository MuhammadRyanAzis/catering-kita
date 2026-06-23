'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BadgeDollarSign,
  ChefHat,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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
  vendor?: { id: number; name: string }
  category?: { id: number; name: string }
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
}

type MenuResponse = { data?: MenuItem[]; message?: string }
type VendorResponse = { data?: VendorItem[]; message?: string }

const FALLBACK_MENU_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
]

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  delay?: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={`
        glass rounded-2xl p-4 transition-all duration-500
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-white/70 uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

function MenuCard({ menu, onDetail, onOrder }: {
  menu: MenuItem
  onDetail: () => void
  onOrder: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const img = (!imgError && menu.image_url) ? menu.image_url : FOOD_IMAGES[menu.id % FOOD_IMAGES.length] || FALLBACK_MENU_IMAGE

  return (
    <Card className="group overflow-hidden border border-border/60 bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9]">
        <img
          src={img}
          alt={menu.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Badge available */}
        <div className="absolute top-3 right-3">
          <span className={`
            inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold border backdrop-blur-sm
            ${menu.available
              ? 'bg-emerald-500/90 text-white border-emerald-400/50'
              : 'bg-slate-600/90 text-white border-slate-500/50'}
          `}>
            {menu.available ? <><Zap className="h-2.5 w-2.5" />Tersedia</> : 'Habis'}
          </span>
        </div>
        {/* Category */}
        {menu.category?.name && (
          <div className="absolute bottom-3 left-3">
            <span className="glass rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white">
              {menu.category.name}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4 pb-2">
        <h3 className="font-semibold text-foreground line-clamp-1 text-base">{menu.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {menu.description || 'Menu catering pilihan untuk kebutuhan harian dan acara spesial.'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-primary">{formatCurrency(menu.price)}</span>
          {menu.vendor?.name && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Store className="h-3 w-3" />
              {menu.vendor.name}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs border-border/60 hover:border-primary/40 hover:text-primary transition-colors"
          onClick={onDetail}
        >
          Detail
        </Button>
        <Button
          size="sm"
          className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all"
          disabled={!menu.available}
          onClick={onOrder}
        >
          {menu.available ? 'Pesan' : 'Habis'}
        </Button>
      </CardFooter>
    </Card>
  )
}

function VendorCard({ vendor, onClick }: { vendor: VendorItem; onClick: () => void }) {
  const rating = vendor.avgRating ?? 0
  const stars = Math.round(rating)

  return (
    <div className="p-1">
      <Card
        onClick={onClick}
        className="group overflow-hidden border border-border/60 bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      >
        {/* Cover */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-600/30">
          {vendor.image_url ? (
            <img
              src={vendor.image_url}
              alt={vendor.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-emerald-600/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {/* Rating badge */}
          <div className="absolute top-2.5 right-2.5 glass rounded-full px-2.5 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-white">
              {rating > 0 ? rating.toFixed(1) : 'Baru'}
            </span>
          </div>
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-white text-sm line-clamp-1 drop-shadow">{vendor.name}</h3>
          </div>
        </div>

        <CardContent className="p-3 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-emerald-600" />
            <span className="truncate">{vendor.city || 'Lokasi tidak tersedia'}</span>
          </div>
          {vendor.description && (
            <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">
              {vendor.description}
            </p>
          )}
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {vendor.totalMenus || 0} menu
            </span>
          </div>
        </CardContent>

        <div className="px-3 pb-3">
          <Button
            size="sm"
            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            Lihat Vendor
          </Button>
        </div>
      </Card>
    </div>
  )
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
  const [headerVisible, setHeaderVisible] = useState(false)

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

    if (parsedUser.role === 'VENDOR') { router.replace('/vendor/dashboard'); return }
    if (parsedUser.role === 'ADMIN') { router.replace('/dashboard'); return }
    if (parsedUser.role !== 'CUSTOMER') { router.replace('/signin'); return }

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

      if (!menusRes.ok) throw new Error(menusJson.message || 'Gagal memuat data menu')
      if (!vendorsRes.ok) throw new Error(vendorsJson.message || 'Gagal memuat data vendor')

      setMenus(menusJson.data || [])
      setVendors(vendorsJson.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat menu')
    } finally {
      setLoading(false)
      setTimeout(() => setHeaderVisible(true), 100)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const availableMenus = useMemo(() => menus.filter((m) => m.available), [menus])
  const featuredVendors = useMemo(
    () => vendors.slice().sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)).slice(0, 12),
    [vendors],
  )
  const uniqueCities = useMemo(
    () => new Set(vendors.map((v) => v.city).filter(Boolean)).size,
    [vendors],
  )
  const averagePrice = useMemo(() => {
    if (menus.length === 0) return 0
    return menus.reduce((sum, m) => sum + Number(m.price || 0), 0) / menus.length
  }, [menus])

  const categories = useMemo(() => {
    const items = menus.map((m) => m.category?.name).filter((n): n is string => Boolean(n))
    return ['Semua', ...Array.from(new Set(items))]
  }, [menus])

  const filteredMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return menus.filter((menu) => {
      const matchQuery = q
        ? [menu.name, menu.description, menu.vendor?.name, menu.category?.name]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q))
        : true
      const matchCat = selectedCategory === 'Semua' ? true : menu.category?.name === selectedCategory
      return matchQuery && matchCat
    })
  }, [menus, searchQuery, selectedCategory])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-mesh">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-30" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-emerald-50 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground">Memuat Dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">Mengambil menu dan vendor terbaik...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* ── HERO HEADER ── */}
      <header
        className={`
          relative overflow-hidden mx-4 mt-4 mb-6 rounded-3xl
          transition-all duration-700
          ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}
      >
        <div className="bg-hero-green p-6 sm:p-8 rounded-3xl relative">
          {/* Decorative blobs */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-teal-300/15 blur-2xl animate-float-slow" />

          {/* Content */}
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-white">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                  {user?.name ? `Halo, ${user.name}! 👋` : 'Selamat datang!'}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Temukan Menu Favoritmu
                  <br />
                  <span className="text-emerald-200">Hari Ini</span>
                </h1>
                <p className="text-sm text-emerald-50/80 max-w-md">
                  Jelajahi ratusan menu catering berkualitas dari vendor terpercaya di kota kamu.
                </p>
              </div>
              <div className="glass rounded-2xl px-4 py-3 text-white text-sm hidden sm:block">
                <p className="text-emerald-200 text-[10px] uppercase font-semibold tracking-wider">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="font-semibold">Aktif & Siap Pesan</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <StatCard
                label="Menu Tersedia"
                value={availableMenus.length}
                icon={UtensilsCrossed}
                color="bg-white/20"
                delay={0}
              />
              <StatCard
                label="Total Vendor"
                value={vendors.length}
                icon={Store}
                color="bg-white/20"
                delay={100}
              />
              <StatCard
                label="Kota Terjangkau"
                value={uniqueCities}
                icon={MapPin}
                color="bg-white/20"
                delay={200}
              />
              <StatCard
                label="Rata-rata Harga"
                value={formatCurrency(Math.round(averagePrice))}
                icon={BadgeDollarSign}
                color="bg-white/20"
                delay={300}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-6 pb-8">
        {/* ── SEARCH & FILTER ── */}
        <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm shadow-sm p-4 animate-slide-down">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu, vendor, atau kategori..."
                className="pl-10 h-10 rounded-xl border-border/60 bg-background/80 focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200
                    ${selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'border-border/60 bg-background text-muted-foreground hover:text-foreground hover:border-primary/40'}
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <X className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── VENDOR CAROUSEL ── */}
        <section className="animate-slide-up delay-100 rounded-3xl border border-border/60 bg-card/90 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                <h2 className="text-lg font-bold">Vendor Pilihan</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 ml-3">
                Cocok untuk catering harian sampai acara besar
              </p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 gap-1">
              <TrendingUp className="h-3 w-3" />
              Top {featuredVendors.length}
            </Badge>
          </div>

          {featuredVendors.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent className="-ml-2">
                {featuredVendors.map((vendor) => (
                  <CarouselItem key={vendor.id} className="basis-[75%] sm:basis-[45%] lg:basis-1/3 xl:basis-1/4 pl-2">
                    <VendorCard
                      vendor={vendor}
                      onClick={() => router.push(`/customer/vendors/${vendor.id}`)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4 bg-card border-border/60 hover:bg-accent shadow-md" />
              <CarouselNext className="hidden sm:flex -right-4 bg-card border-border/60 hover:bg-accent shadow-md" />
            </Carousel>
          ) : (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
              <ChefHat className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada vendor aktif untuk ditampilkan.</p>
            </div>
          )}
        </section>

        {/* ── MENU GRID ── */}
        <section className="animate-slide-up delay-200 rounded-3xl border border-border/60 bg-card/90 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                <h2 className="text-lg font-bold">
                  {searchQuery || selectedCategory !== 'Semua' ? 'Hasil Pencarian' : 'Semua Menu'}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 ml-3">
                {filteredMenus.length > 0
                  ? `Menampilkan ${filteredMenus.length} menu`
                  : 'Tidak ada menu yang cocok'}
              </p>
            </div>
            <Badge variant="outline" className="gap-1 border-border/60">
              <UtensilsCrossed className="h-3 w-3" />
              {menus.length} Total
            </Badge>
          </div>

          {filteredMenus.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center">
              <Search className="h-10 w-10 text-emerald-400/60 mx-auto mb-3" />
              <p className="font-medium text-foreground">Tidak ada menu ditemukan</p>
              <p className="text-sm text-muted-foreground mt-1">
                Coba ubah kata kunci atau pilih kategori lain
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => { setSearchQuery(''); setSelectedCategory('Semua') }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMenus.map((menu, index) => (
                <div
                  key={menu.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MenuCard
                    menu={menu}
                    onDetail={() => router.push(`/customer/menus/${menu.id}`)}
                    onOrder={() => menu.available && router.push(`/customer/menus/${menu.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── EMPTY STATE ── */}
        {!error && menus.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground">Belum Ada Menu</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Menu akan muncul saat vendor mulai menambahkan item.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

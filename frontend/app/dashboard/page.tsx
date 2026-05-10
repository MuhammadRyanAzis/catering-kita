'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCookies } from '@/helper/cookies'
import {
  Building2,
  ChartSpline,
  CircleDollarSign,
  Layers,
  LayoutGrid,
  Medal,
  RefreshCcw,
  Tags,
  Users,
  Utensils,
} from 'lucide-react'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type CustomerItem = {
  id: number
  city?: string
  created_at: string
  totalOrders: number
  user: {
    name: string
    email: string
  }
}

type VendorItem = {
  id: number
  name: string
  city: string
  avgRating: number
  totalOrders: number
}

type CategoryItem = {
  id: number
  name: string
  totalMenus: number
}

type MenuItem = {
  id: number
  price: number | string
  vendor?: {
    id: number
    name: string
  }
}

type ApiListResponse<T> = {
  data?: T[]
  total?: number
  message?: string
}

export default function DashboardRedirectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [menus, setMenus] = useState<MenuItem[]>([])

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadAdminDashboard = useCallback(async () => {
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

    if (parsedUser.role === 'CUSTOMER') {
      router.replace('/customer/dashboard')
      return
    }

    if (parsedUser.role === 'VENDOR') {
      router.replace('/vendor/dashboard')
      return
    }

    if (parsedUser.role !== 'ADMIN') {
      router.replace('/signin')
      return
    }

    setUser(parsedUser)

    try {
      const [customersRes, vendorsRes, categoriesRes, menusRes] = await Promise.all([
        fetch(`${baseUrl}/customers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${baseUrl}/vendors`),
        fetch(`${baseUrl}/categories`),
        fetch(`${baseUrl}/menus`),
      ])

      if (customersRes.status === 401) {
        await handleLogout()
        return
      }

      const customersJson = (await customersRes.json()) as ApiListResponse<CustomerItem>
      const vendorsJson = (await vendorsRes.json()) as ApiListResponse<VendorItem>
      const categoriesJson = (await categoriesRes.json()) as ApiListResponse<CategoryItem>
      const menusJson = (await menusRes.json()) as ApiListResponse<MenuItem>

      if (!customersRes.ok) {
        throw new Error(customersJson.message || 'Gagal memuat data customer')
      }
      if (!vendorsRes.ok) {
        throw new Error(vendorsJson.message || 'Gagal memuat data vendor')
      }
      if (!categoriesRes.ok) {
        throw new Error(categoriesJson.message || 'Gagal memuat data kategori')
      }
      if (!menusRes.ok) {
        throw new Error(menusJson.message || 'Gagal memuat data menu')
      }

      setCustomers(customersJson.data || [])
      setVendors(vendorsJson.data || [])
      setCategories(categoriesJson.data || [])
      setMenus(menusJson.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat dashboard admin')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadAdminDashboard()
  }, [loadAdminDashboard])

  const totalRevenuePotential = useMemo(
    () => menus.reduce((sum, menu) => sum + Number(menu.price || 0), 0),
    [menus],
  )

  const activeCities = useMemo(() => {
    const citySet = new Set<string>()
    for (const vendor of vendors) {
      if (vendor.city) {
        citySet.add(vendor.city)
      }
    }
    for (const customer of customers) {
      if (customer.city) {
        citySet.add(customer.city)
      }
    }
    return citySet.size
  }, [customers, vendors])

  const topCategory = useMemo(
    () => [...categories].sort((a, b) => b.totalMenus - a.totalMenus)[0] || null,
    [categories],
  )

  const topVendor = useMemo(
    () => [...vendors].sort((a, b) => b.avgRating - a.avgRating)[0] || null,
    [vendors],
  )

  const recentCustomers = useMemo(
    () => [...customers].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6),
    [customers],
  )

  const categoryShare = useMemo(() => {
    const totalMenus = categories.reduce((sum, category) => sum + category.totalMenus, 0)
    return categories
      .slice()
      .sort((a, b) => b.totalMenus - a.totalMenus)
      .slice(0, 6)
      .map((category) => ({
        ...category,
        percentage: totalMenus ? Math.round((category.totalMenus / totalMenus) * 100) : 0,
      }))
  }, [categories])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#EEEDFE] to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E1DEFB] border-b-[#533AB7] mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F2F0FF] via-background to-background">
      <nav className="border-b bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#533AB7]">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Halo, {user?.name}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-4">{error}</div>
        ) : null}

        <section className="rounded-2xl border bg-card p-6 shadow-sm overflow-hidden relative">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#E1DEFB]" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#DCD8FA]" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[#533AB7] font-semibold">Platform Intelligence</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">Kontrol penuh ekosistem CateringKita</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Pantau pertumbuhan user, kualitas supply vendor, dan distribusi kategori menu dalam satu command center.
              </p>
            </div>

            <button
              onClick={() => {
                setLoading(true)
                void loadAdminDashboard()
              }}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
            <div className="rounded-xl border bg-[#F0F4FF] p-4">
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-2xl font-bold mt-1">{customers.length}</p>
              <Users className="h-4 w-4 text-[#4E73D9] mt-2" />
            </div>
            <div className="rounded-xl border bg-[#EEE9FF] p-4">
              <p className="text-sm text-muted-foreground">Vendors</p>
              <p className="text-2xl font-bold mt-1">{vendors.length}</p>
              <Building2 className="h-4 w-4 text-[#6C4FDB] mt-2" />
            </div>
            <div className="rounded-xl border bg-[#F5F0FF] p-4">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold mt-1">{categories.length}</p>
              <Tags className="h-4 w-4 text-[#7A5CE6] mt-2" />
            </div>
            <div className="rounded-xl border bg-[#EDEBFF] p-4">
              <p className="text-sm text-muted-foreground">Menus</p>
              <p className="text-2xl font-bold mt-1">{menus.length}</p>
              <Utensils className="h-4 w-4 text-[#5A47C9] mt-2" />
            </div>
            <div className="rounded-xl border bg-[#F2EEFF] p-4">
              <p className="text-sm text-muted-foreground">Coverage Kota</p>
              <p className="text-2xl font-bold mt-1">{activeCities}</p>
              <LayoutGrid className="h-4 w-4 text-[#533AB7] mt-2" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Highlight Platform</h3>
            <p className="text-sm text-muted-foreground mt-1">Insight utama dari data saat ini</p>

            <div className="space-y-3 mt-4 text-sm">
              <div className="rounded-lg border p-3 bg-background/80">
                <p className="text-muted-foreground">Top Category</p>
                <p className="font-semibold mt-1">{topCategory?.name || 'Belum tersedia'}</p>
                <p className="text-xs text-muted-foreground mt-1">{topCategory?.totalMenus || 0} menu</p>
              </div>
              <div className="rounded-lg border p-3 bg-background/80">
                <p className="text-muted-foreground">Top Vendor Rating</p>
                <p className="font-semibold mt-1">{topVendor?.name || 'Belum tersedia'}</p>
                <p className="text-xs text-muted-foreground mt-1">Rating {topVendor?.avgRating?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="rounded-lg border p-3 bg-background/80">
                <p className="text-muted-foreground">Nilai Katalog</p>
                <p className="font-semibold mt-1">Rp {totalRevenuePotential.toLocaleString('id-ID')}</p>
                <p className="text-xs text-muted-foreground mt-1">Akumulasi harga seluruh menu</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 xl:col-span-2">
            <h3 className="font-semibold">Distribusi Kategori</h3>
            <p className="text-sm text-muted-foreground mt-1">Proporsi menu pada kategori teratas</p>

            <div className="space-y-3 mt-4">
              {categoryShare.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada kategori untuk divisualisasikan.</p>
              ) : (
                categoryShare.map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">{category.totalMenus} menu ({category.percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-[#533AB7]" style={{ width: `${category.percentage}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border bg-card p-5 xl:col-span-2">
            <h3 className="font-semibold">Vendor Leaderboard</h3>
            <p className="text-sm text-muted-foreground mt-1">Peringkat vendor berdasarkan rating dan volume order</p>

            <div className="mt-4 space-y-3">
              {[...vendors]
                .sort((a, b) => b.avgRating - a.avgRating)
                .slice(0, 6)
                .map((vendor, index) => (
                  <div key={vendor.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-[#EEE9FF] text-[#533AB7] text-xs font-semibold grid place-content-center">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.city || 'Tanpa kota'} • {vendor.totalOrders} order</p>
                      </div>
                    </div>
                    <span className="text-xs rounded-full border px-2 py-1 bg-[#EEE9FF] text-[#533AB7] border-[#D9D6FB]">
                      {vendor.avgRating.toFixed(1)}
                    </span>
                  </div>
                ))}

              {vendors.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada vendor terdaftar.</p> : null}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Quick Health Check</h3>
            <p className="text-sm text-muted-foreground mt-1">Sinyal cepat kondisi marketplace</p>

            <div className="space-y-3 mt-4 text-sm">
              <div className="rounded-lg border p-3 bg-background/80">
                <p className="text-muted-foreground">Rasio Vendor per Customer</p>
                <p className="font-semibold mt-1">
                  {customers.length ? (vendors.length / customers.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-background/80">
                <p className="text-muted-foreground">Rata-rata Menu per Vendor</p>
                <p className="font-semibold mt-1">{vendors.length ? (menus.length / vendors.length).toFixed(1) : '0.0'}</p>
              </div>
              <div className="rounded-lg border p-3 bg-background/80">
                <p className="text-muted-foreground">Order Exposure</p>
                <p className="font-semibold mt-1 flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4 text-[#533AB7]" />
                  {vendors.reduce((sum, vendor) => sum + (vendor.totalOrders || 0), 0)} total order vendor
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold">Customer Terbaru</h3>
              <p className="text-sm text-muted-foreground mt-1">Akuisisi customer paling baru di platform</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ChartSpline className="h-4 w-4" />
              Snapshot real-time
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="rounded-lg border p-4">
                <p className="font-medium">{customer.user.name}</p>
                <p className="text-sm text-muted-foreground">{customer.user.email}</p>
                <p className="text-xs text-muted-foreground mt-2">{customer.city || 'Tanpa kota'}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="rounded-full border px-2 py-1 bg-[#EEE9FF] text-[#533AB7]">{customer.totalOrders} order</span>
                  <span className="text-muted-foreground">{new Date(customer.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {recentCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">Belum ada customer baru.</p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
            <div className="rounded-lg border p-3 bg-background/80">
              <p className="text-muted-foreground flex items-center gap-1"><Medal className="h-4 w-4" /> Kategori Terkaya</p>
              <p className="font-semibold mt-1">{topCategory?.name || '-'}</p>
            </div>
            <div className="rounded-lg border p-3 bg-background/80">
              <p className="text-muted-foreground flex items-center gap-1"><Layers className="h-4 w-4" /> Vendor Unggulan</p>
              <p className="font-semibold mt-1">{topVendor?.name || '-'}</p>
            </div>
            <div className="rounded-lg border p-3 bg-background/80">
              <p className="text-muted-foreground flex items-center gap-1"><CircleDollarSign className="h-4 w-4 text-[#533AB7]" /> Potensi Nilai Menu</p>
              <p className="font-semibold mt-1">Rp {totalRevenuePotential.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

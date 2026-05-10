'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCookies } from '@/helper/cookies'
import {
  BanknoteArrowUp,
  ChefHat,
  ClipboardList,
  Clock3,
  CookingPot,
  Flame,
  Megaphone,
  PackageSearch,
  ShieldCheck,
  Truck,
} from 'lucide-react'

type DashboardUser = {
  id: number
  name: string
  email: string
  role: string
}

type VendorProfile = {
  id: number
  name: string
  city: string
  phone: string
  is_active: boolean
}

type VendorOrder = {
  id: number
  status: string
  total: number | string
  created_at: string
  customer?: {
    user?: {
      name?: string
    }
  }
}

type VendorStatistics = {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  preparingOrders: number
  readyOrders: number
  onDeliveryOrders: number
  deliveredOrders: number
  cancelledOrders: number
  totalRevenue: number
}

type VendorMenu = {
  id: number
  available: boolean
  name?: string
  category?: {
    name: string
  }
}

type ProfileResponse = {
  data?: {
    user: DashboardUser
    profile: VendorProfile | null
  }
  message?: string
}

type VendorOrdersResponse = {
  statistics?: VendorStatistics
  data?: VendorOrder[]
  message?: string
}

type VendorMenusResponse = {
  data?: VendorMenu[]
  message?: string
}

type DashboardState = {
  user: DashboardUser | null
  profile: VendorProfile | null
  statistics: VendorStatistics | null
  orders: VendorOrder[]
  menus: VendorMenu[]
}

const STATUS_META: Record<string, { label: string; colorClass: string }> = {
  pending: { label: 'Pending', colorClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', colorClass: 'bg-sky-100 text-sky-700 border-sky-200' },
  preparing: { label: 'Preparing', colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  ready: { label: 'Ready', colorClass: 'bg-violet-100 text-violet-700 border-violet-200' },
  on_delivery: { label: 'Delivery', colorClass: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  delivered: { label: 'Delivered', colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', colorClass: 'bg-rose-100 text-rose-700 border-rose-200' },
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function VendorDashboard() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardState>({
    user: null,
    profile: null,
    statistics: null,
    orders: [],
    menus: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.push('/signin')
  }, [router])

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        router.push('/signin')
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      if (!baseUrl) {
        setError('Konfigurasi NEXT_PUBLIC_API_URL belum tersedia')
        setLoading(false)
        return
      }

      const userData = JSON.parse(storedUser) as DashboardUser

      if (userData.role !== 'VENDOR') {
        router.push('/signin')
        return
      }

      try {
        const profileRes = await fetch(`${baseUrl}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (profileRes.status === 401) {
          await handleLogout()
          return
        }

        const profileJson = (await profileRes.json()) as ProfileResponse
        if (!profileRes.ok || !profileJson.data?.profile) {
          throw new Error(profileJson.message || 'Gagal memuat profil vendor')
        }

        const vendorProfile = profileJson.data.profile

        const [ordersRes, menusRes] = await Promise.all([
          fetch(`${baseUrl}/vendors/orders`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${baseUrl}/vendors/${vendorProfile.id}/menus`),
        ])

        const ordersJson = (await ordersRes.json()) as VendorOrdersResponse
        const menusJson = (await menusRes.json()) as VendorMenusResponse

        if (!ordersRes.ok) {
          throw new Error(ordersJson.message || 'Gagal memuat statistik order vendor')
        }

        if (!menusRes.ok) {
          throw new Error(menusJson.message || 'Gagal memuat data menu vendor')
        }

        setDashboard({
          user: profileJson.data.user,
          profile: vendorProfile,
          statistics: ordersJson.statistics || null,
          orders: ordersJson.data || [],
          menus: menusJson.data || [],
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat dashboard')
      } finally {
        setLoading(false)
      }
    }

    void checkAuth()
  }, [handleLogout, router])

  const activeMenus = dashboard.menus.filter((menu) => menu.available).length
  const inactiveMenus = dashboard.menus.length - activeMenus
  const latestOrders = dashboard.orders.slice(0, 6)

  const activeOrdersCount =
    (dashboard.statistics?.pendingOrders || 0) +
    (dashboard.statistics?.confirmedOrders || 0) +
    (dashboard.statistics?.preparingOrders || 0) +
    (dashboard.statistics?.readyOrders || 0) +
    (dashboard.statistics?.onDeliveryOrders || 0)

  const completionRate = useMemo(() => {
    const total = dashboard.statistics?.totalOrders || 0
    if (!total) {
      return 0
    }
    return Math.round(((dashboard.statistics?.deliveredOrders || 0) / total) * 100)
  }, [dashboard.statistics])

  const cancellationRate = useMemo(() => {
    const total = dashboard.statistics?.totalOrders || 0
    if (!total) {
      return 0
    }
    return Math.round(((dashboard.statistics?.cancelledOrders || 0) / total) * 100)
  }, [dashboard.statistics])

  const menuAvailabilityRate = dashboard.menus.length
    ? Math.round((activeMenus / dashboard.menus.length) * 100)
    : 0

  const stalePendingOrders = useMemo(() => {
    const now = Date.now()
    return dashboard.orders.filter((order) => {
      if (order.status !== 'pending') {
        return false
      }
      const ageMinutes = Math.floor((now - new Date(order.created_at).getTime()) / (1000 * 60))
      return ageMinutes >= 30
    })
  }, [dashboard.orders])

  const statusMix = useMemo(() => {
    const rows = [
      { key: 'pending', value: dashboard.statistics?.pendingOrders || 0 },
      { key: 'confirmed', value: dashboard.statistics?.confirmedOrders || 0 },
      { key: 'preparing', value: dashboard.statistics?.preparingOrders || 0 },
      { key: 'ready', value: dashboard.statistics?.readyOrders || 0 },
      { key: 'on_delivery', value: dashboard.statistics?.onDeliveryOrders || 0 },
      { key: 'delivered', value: dashboard.statistics?.deliveredOrders || 0 },
      { key: 'cancelled', value: dashboard.statistics?.cancelledOrders || 0 },
    ]
    const total = dashboard.statistics?.totalOrders || 0
    return rows
      .filter((item) => item.value > 0)
      .map((item) => ({
        ...item,
        percent: total ? Math.round((item.value / total) * 100) : 0,
      }))
  }, [dashboard.statistics])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-sky-100/60 to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-200 border-b-sky-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat dashboard vendor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-100/50 via-background to-background">
      <nav className="border-b bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-sky-700">Vendor Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Halo, {dashboard.user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border bg-card p-6 shadow-sm overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/40" />
          <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-indigo-200/40" />

          <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-sky-700 font-semibold">Vendor Mission Control</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">
                Operasi {dashboard.profile?.name || 'Toko Anda'} siap dipantau penuh.
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Pantau order berjalan, laju pendapatan, performa delivery, dan kualitas katalog tanpa pindah halaman.
              </p>
            </div>

            <div className="rounded-xl border bg-background/80 p-4 min-w-64">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Kesehatan Operasional</p>
              <p className="text-2xl font-bold mt-1">{completionRate}%</p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Completion rate berdasarkan total order.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            <div className="rounded-xl border bg-sky-50 p-4">
              <p className="text-sm text-muted-foreground">Total Order</p>
              <p className="text-2xl font-bold mt-1">{dashboard.statistics?.totalOrders || 0}</p>
              <ClipboardList className="h-4 w-4 text-sky-600 mt-2" />
            </div>

            <div className="rounded-xl border bg-blue-50 p-4">
              <p className="text-sm text-muted-foreground">Order Berjalan</p>
              <p className="text-2xl font-bold mt-1">{activeOrdersCount}</p>
              <CookingPot className="h-4 w-4 text-blue-600 mt-2" />
            </div>

            <div className="rounded-xl border bg-indigo-50 p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(dashboard.statistics?.totalRevenue || 0)}
              </p>
              <BanknoteArrowUp className="h-4 w-4 text-indigo-600 mt-2" />
            </div>

            <div className="rounded-xl border bg-cyan-50 p-4">
              <p className="text-sm text-muted-foreground">Menu Aktif</p>
              <p className="text-2xl font-bold mt-1">{activeMenus}</p>
              <PackageSearch className="h-4 w-4 text-cyan-600 mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cancellation Rate</p>
              <p className="text-lg font-semibold mt-1">{cancellationRate}%</p>
              <p className="text-sm text-muted-foreground">Tetap rendah agar kepercayaan pelanggan meningkat.</p>
            </div>
            <div className="rounded-xl border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Availability Menu</p>
              <p className="text-lg font-semibold mt-1">{menuAvailabilityRate}%</p>
              <p className="text-sm text-muted-foreground">Menu tersedia mempengaruhi peluang order masuk.</p>
            </div>
            <div className="rounded-xl border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status Toko</p>
              <p className="text-lg font-semibold mt-1">{dashboard.profile?.is_active ? 'Aktif' : 'Nonaktif'}</p>
              <p className="text-sm text-muted-foreground">Pastikan status aktif saat jam operasional utama.</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border bg-card p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold">Order Stream</h3>
                <p className="text-sm text-muted-foreground mt-1">Pantau order terbaru dan identifikasi bottleneck dengan cepat</p>
              </div>
              <span className="text-xs rounded-full border border-sky-200 px-3 py-1 bg-sky-100 text-sky-700">
                {latestOrders.length} order terbaru
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {latestOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada order masuk.</p>
              ) : (
                latestOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer?.user?.name || 'Pelanggan'} • {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-semibold">{formatCurrency(Number(order.total))}</p>
                      <span className={`text-xs border rounded-full px-2 py-1 ${STATUS_META[order.status]?.colorClass || 'bg-muted text-muted-foreground border-border'}`}>
                        {STATUS_META[order.status]?.label || order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">SLA Alert</h3>
            <p className="text-sm text-muted-foreground mt-1">Order pending lebih dari 30 menit</p>

            <div className="mt-4 space-y-3">
              {stalePendingOrders.length === 0 ? (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-700 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Tidak ada order pending kritis.
                </div>
              ) : (
                stalePendingOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="font-medium text-sm">Order #{order.id}</p>
                    <p className="text-xs text-amber-700 mt-1">Perlu konfirmasi cepat untuk menjaga SLA.</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => router.push('/vendor/dashboard')}
                className="w-full rounded-lg border px-3 py-2 text-sm flex items-center justify-between hover:bg-muted/60 transition-colors"
              >
                Reload Data
                <Clock3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-lg border px-3 py-2 text-sm flex items-center justify-between hover:bg-muted/60 transition-colors"
              >
                Promosi Vendor
                <Megaphone className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border bg-card p-5 xl:col-span-2">
            <h3 className="font-semibold">Funnel Status Order</h3>
            <p className="text-sm text-muted-foreground mt-1">Visual distribusi order dari pending hingga selesai</p>

            <div className="space-y-3 mt-4">
              {statusMix.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data order untuk divisualisasikan.</p>
              ) : (
                statusMix.map((item) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{STATUS_META[item.key]?.label || item.key}</span>
                      <span className="text-muted-foreground">{item.value} ({item.percent}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Profil Vendor</h3>
            <p className="text-sm text-muted-foreground mt-1">Data bisnis yang sedang aktif</p>
            <div className="space-y-2 text-sm mt-4">
              <p><span className="text-muted-foreground">Nama:</span> {dashboard.profile?.name || '-'}</p>
              <p><span className="text-muted-foreground">Email:</span> {dashboard.user?.email || '-'}</p>
              <p><span className="text-muted-foreground">Telepon:</span> {dashboard.profile?.phone || '-'}</p>
              <p><span className="text-muted-foreground">Kota:</span> {dashboard.profile?.city || '-'}</p>
              <p><span className="text-muted-foreground">Status:</span> {dashboard.profile?.is_active ? 'Aktif' : 'Nonaktif'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="rounded-md border p-2 bg-sky-50">
                <p className="text-muted-foreground">Order Delivery</p>
                <p className="font-semibold mt-1 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  {dashboard.statistics?.onDeliveryOrders || 0}
                </p>
              </div>
              <div className="rounded-md border p-2 bg-indigo-50">
                <p className="text-muted-foreground">Delivered</p>
                <p className="font-semibold mt-1 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" />
                  {dashboard.statistics?.deliveredOrders || 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 mt-6">
          <h3 className="font-semibold">Kualitas Katalog</h3>
          <p className="text-sm text-muted-foreground mt-1">Distribusi status menu untuk menjaga kesiapan jual</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Menu</p>
              <p className="text-xl font-bold mt-1">{dashboard.menus.length}</p>
            </div>
            <div className="rounded-lg border p-4 bg-sky-50">
              <p className="text-sm text-muted-foreground">Menu Tersedia</p>
              <p className="text-xl font-bold mt-1 text-sky-700">{activeMenus}</p>
            </div>
            <div className="rounded-lg border p-4 bg-indigo-50">
              <p className="text-sm text-muted-foreground">Menu Tidak Tersedia</p>
              <p className="text-xl font-bold mt-1 text-indigo-700">{inactiveMenus}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border p-4 bg-background/80">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Menu Availability Score</span>
              <span className="font-medium">{menuAvailabilityRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${menuAvailabilityRate}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ChefHat className="h-3.5 w-3.5" />
              Jaga availability di atas 80% untuk menjaga conversion dari halaman menu.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

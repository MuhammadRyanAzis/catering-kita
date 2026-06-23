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
  Sparkles,
  TrendingUp,
} from 'lucide-react'

type DashboardUser = { id: number; name: string; email: string; role: string }
type VendorProfile = { id: number; name: string; city: string; phone: string; is_active: boolean }
type VendorOrder = { id: number; status: string; total: number | string; created_at: string; customer?: { user?: { name?: string } } }
type VendorStatistics = { totalOrders: number; pendingOrders: number; confirmedOrders: number; preparingOrders: number; readyOrders: number; onDeliveryOrders: number; deliveredOrders: number; cancelledOrders: number; totalRevenue: number }
type VendorMenu = { id: number; available: boolean; name?: string; category?: { name: string } }
type ProfileResponse = { data?: { user: DashboardUser; profile: VendorProfile | null }; message?: string }
type VendorOrdersResponse = { statistics?: VendorStatistics; data?: VendorOrder[]; message?: string }
type VendorMenusResponse = { data?: VendorMenu[]; message?: string }
type DashboardState = { user: DashboardUser | null; profile: VendorProfile | null; statistics: VendorStatistics | null; orders: VendorOrder[]; menus: VendorMenu[] }

const STATUS_META: Record<string, { label: string; colorClass: string }> = {
  pending: { label: 'Pending', colorClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', colorClass: 'bg-sky-100 text-sky-700 border-sky-200' },
  preparing: { label: 'Preparing', colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  ready: { label: 'Ready', colorClass: 'bg-violet-100 text-violet-700 border-violet-200' },
  on_delivery: { label: 'Delivery', colorClass: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  delivered: { label: 'Delivered', colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', colorClass: 'bg-rose-100 text-rose-700 border-rose-200' },
}

function formatCurrency(amount: number): string { return `Rp ${amount.toLocaleString('id-ID')}` }
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatCard({
  label, value, icon: Icon, color, delay = 0
}: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; delay?: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className={`glass rounded-2xl p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white tabular-nums drop-shadow-sm">{value}</p>
        </div>
        <div className={`rounded-xl p-3 shadow-inner border border-white/20 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function VendorDashboard() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardState>({ user: null, profile: null, statistics: null, orders: [], menus: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [headerVisible, setHeaderVisible] = useState(false)

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) { router.replace('/signin'); return }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      if (!baseUrl) { setError('Konfigurasi NEXT_PUBLIC_API_URL belum tersedia'); setLoading(false); return }

      let userData: DashboardUser
      try { userData = JSON.parse(storedUser) as DashboardUser } catch { router.replace('/signin'); return }
      if (userData.role !== 'VENDOR') { router.replace('/signin'); return }

      try {
        const profileRes = await fetch(`${baseUrl}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
        if (profileRes.status === 401) { await handleLogout(); return }

        const profileJson = (await profileRes.json()) as ProfileResponse
        if (!profileRes.ok || !profileJson.data?.profile) throw new Error(profileJson.message || 'Gagal memuat profil vendor')
        
        const vendorProfile = profileJson.data.profile

        const [ordersRes, menusRes] = await Promise.all([
          fetch(`${baseUrl}/vendors/orders`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${baseUrl}/vendors/${vendorProfile.id}/menus`)
        ])

        const ordersJson = (await ordersRes.json()) as VendorOrdersResponse
        const menusJson = (await menusRes.json()) as VendorMenusResponse

        if (!ordersRes.ok) throw new Error(ordersJson.message || 'Gagal memuat statistik order vendor')
        if (!menusRes.ok) throw new Error(menusJson.message || 'Gagal memuat data menu vendor')

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
        setTimeout(() => setHeaderVisible(true), 100)
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
    if (!total) return 0
    return Math.round(((dashboard.statistics?.deliveredOrders || 0) / total) * 100)
  }, [dashboard.statistics])

  const cancellationRate = useMemo(() => {
    const total = dashboard.statistics?.totalOrders || 0
    if (!total) return 0
    return Math.round(((dashboard.statistics?.cancelledOrders || 0) / total) * 100)
  }, [dashboard.statistics])

  const menuAvailabilityRate = dashboard.menus.length ? Math.round((activeMenus / dashboard.menus.length) * 100) : 0

  const stalePendingOrders = useMemo(() => {
    const now = Date.now()
    return dashboard.orders.filter((order) => {
      if (order.status !== 'pending') return false
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
    return rows.filter((item) => item.value > 0).map((item) => ({ ...item, percent: total ? Math.round((item.value / total) * 100) : 0 }))
  }, [dashboard.statistics])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-mesh">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-30" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-blue-50 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground">Memuat Dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">Mengambil data operasional vendor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-mesh pb-8">
      {/* ── HERO HEADER ── */}
      <header className={`relative overflow-hidden mx-4 mt-4 mb-6 rounded-3xl transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="bg-hero-blue p-6 sm:p-8 rounded-3xl relative">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-blue-300/20 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-cyan-300/15 blur-2xl animate-float-slow" />

          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-white">
                  <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                  Mission Control
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Operasi {dashboard.profile?.name || 'Toko Anda'}
                  <br />
                  <span className="text-blue-200">Siap Dipantau Penuh</span>
                </h1>
                <p className="text-sm text-blue-50/80 max-w-md mt-2">
                  Pantau order berjalan, laju pendapatan, performa delivery, dan kualitas katalog.
                </p>
              </div>
              <div className="glass rounded-2xl px-5 py-4 text-white text-sm hidden md:block border-white/20">
                <p className="text-blue-200 text-[10px] uppercase font-bold tracking-[0.15em]">Completion Rate</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-3xl font-extrabold">{completionRate}%</span>
                  <TrendingUp className="h-5 w-5 mb-1 text-blue-200" />
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-black/20 overflow-hidden">
                  <div className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              <StatCard label="Total Order" value={dashboard.statistics?.totalOrders || 0} icon={ClipboardList} color="bg-white/20" delay={0} />
              <StatCard label="Order Aktif" value={activeOrdersCount} icon={CookingPot} color="bg-white/20" delay={100} />
              <StatCard label="Total Revenue" value={formatCurrency(dashboard.statistics?.totalRevenue || 0)} icon={BanknoteArrowUp} color="bg-white/20" delay={200} />
              <StatCard label="Menu Aktif" value={activeMenus} icon={PackageSearch} color="bg-white/20" delay={300} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up delay-100">
          <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Cancellation Rate</p>
            <p className="text-2xl font-bold mt-1 text-rose-600">{cancellationRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Tetap rendah agar rating toko terjaga.</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Availability Menu</p>
            <p className="text-2xl font-bold mt-1 text-cyan-600">{menuAvailabilityRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Menu tersedia meningkatkan order.</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Status Toko</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`h-3 w-3 rounded-full ${dashboard.profile?.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <p className="text-2xl font-bold">{dashboard.profile?.is_active ? 'Aktif' : 'Nonaktif'}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status aktif penting saat jam operasi.</p>
          </div>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <div className="rounded-3xl border border-border/60 bg-card/90 backdrop-blur-sm p-6 shadow-sm xl:col-span-2 animate-slide-up delay-200">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/50 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-lg">Order Stream</h3>
                <p className="text-sm text-muted-foreground">Pantau order terbaru dan status pesanan</p>
              </div>
              <span className="text-xs font-semibold rounded-full border border-blue-200 px-3 py-1 bg-blue-50 text-blue-700">
                {latestOrders.length} order terbaru
              </span>
            </div>

            <div className="space-y-3">
              {latestOrders.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Belum ada order masuk.</p>
                </div>
              ) : (
                latestOrders.map((order) => (
                  <div key={order.id} className="group rounded-2xl border border-border/50 bg-background/50 p-4 flex flex-wrap items-center justify-between gap-4 hover:border-primary/30 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        #{order.id}
                      </div>
                      <div>
                        <p className="font-semibold">{order.customer?.user?.name || 'Pelanggan'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="font-bold text-lg">{formatCurrency(Number(order.total))}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${STATUS_META[order.status]?.colorClass || 'bg-muted text-muted-foreground border-border'}`}>
                        {STATUS_META[order.status]?.label || order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6 animate-slide-up delay-300">
            <div className="rounded-3xl border border-border/60 bg-card/90 backdrop-blur-sm p-6 shadow-sm">
              <h3 className="font-bold text-lg text-rose-600 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                SLA Alert
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Order pending &gt; 30 menit</p>

              <div className="mt-4 space-y-3">
                {stalePendingOrders.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-700 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full"><ShieldCheck className="h-4 w-4" /></div>
                    <span className="font-medium">Tidak ada order pending kritis.</span>
                  </div>
                ) : (
                  stalePendingOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                      <p className="font-bold text-sm text-rose-900">Order #{order.id}</p>
                      <p className="text-xs text-rose-700 mt-1 font-medium">Perlu konfirmasi cepat untuk menjaga SLA.</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-2">
                <button onClick={() => router.refresh()} className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm font-semibold flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-all">
                  Refresh Data
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            <div className="rounded-3xl border border-border/60 bg-card/90 backdrop-blur-sm p-6 shadow-sm">
              <h3 className="font-bold text-lg">Profil Cepat</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Telepon</span>
                  <span className="font-medium">{dashboard.profile?.phone || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Kota</span>
                  <span className="font-medium">{dashboard.profile?.city || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

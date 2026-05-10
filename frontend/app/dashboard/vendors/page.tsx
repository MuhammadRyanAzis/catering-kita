'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Building2, Search, ShieldCheck, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteCookies } from '@/helper/cookies'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type VendorUser = {
  id: number
  name: string
  email: string
}

type VendorItem = {
  id: number
  name: string
  city?: string
  phone?: string
  is_active: boolean
  avgRating: number
  totalRatings: number
  totalMenus: number
  totalOrders: number
  created_at: string
  user: VendorUser
}

type VendorsResponse = {
  data?: VendorItem[]
  total?: number
  message?: string
}

export default function AdminVendorsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyVendorId, setBusyVendorId] = useState<number | null>(null)

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadVendors = useCallback(async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      router.replace('/signin')
      return
    }

    let parsedUser: DashboardUser
    try {
      parsedUser = JSON.parse(storedUser) as DashboardUser
    } catch {
      router.replace('/signin')
      return
    }

    if (parsedUser.role !== 'ADMIN') {
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
      const res = await fetch(`${baseUrl}/vendors/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as VendorsResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat data vendor')
      }

      setVendors(json.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat vendor')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadVendors()
  }, [loadVendors])

  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return vendors.filter((vendor) => {
      const matchesQuery = normalizedQuery
        ? [vendor.name, vendor.user?.name, vendor.user?.email, vendor.city, vendor.phone]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedQuery))
        : true
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? vendor.is_active
          : !vendor.is_active
      return matchesQuery && matchesStatus
    })
  }, [vendors, searchQuery, statusFilter])

  const summary = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.is_active).length
    const inactive = vendors.length - active
    const totalOrders = vendors.reduce((sum, vendor) => sum + (vendor.totalOrders || 0), 0)
    return { active, inactive, totalOrders }
  }, [vendors])

  const toggleStatus = async (vendor: VendorItem) => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setBusyVendorId(vendor.id)

    try {
      const res = await fetch(`${baseUrl}/vendors/${vendor.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !vendor.is_active }),
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as { data?: VendorItem; message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal mengubah status vendor')
      }

      setVendors((prev) => prev.map((item) => (item.id === vendor.id ? (json.data || item) : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status vendor')
    } finally {
      setBusyVendorId(null)
    }
  }

  const removeVendor = async (vendor: VendorItem) => {
    if (!confirm(`Hapus vendor "${vendor.name}"?`)) return

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setBusyVendorId(vendor.id)

    try {
      const res = await fetch(`${baseUrl}/vendors/${vendor.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      if (!res.ok) {
        const json = (await res.json()) as { message?: string }
        throw new Error(json.message || 'Gagal menghapus vendor')
      }

      setVendors((prev) => prev.filter((item) => item.id !== vendor.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus vendor')
    } finally {
      setBusyVendorId(null)
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl animate-pulse space-y-6'>
          <div className='h-10 w-64 rounded bg-muted' />
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='h-44 rounded-2xl bg-muted/60' />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-[#F2F0FF] via-background to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-[#533AB7] to-[#7F77DD] p-6 text-white shadow-lg'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-white/10 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-[0.3em] text-white/70'>Vendor Management</p>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Manajemen Vendor</h1>
              <p className='max-w-xl text-sm text-white/80'>
                Monitor status vendor, kualitas rating, serta aktivitas order di marketplace.
              </p>
            </div>
            <Button
              variant='outline'
              className='bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20'
              onClick={() => router.push('/dashboard')}
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

        <div className='grid gap-4 md:grid-cols-3'>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Vendor Aktif</CardTitle>
              <p className='text-sm text-muted-foreground'>Vendor yang sedang aktif.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#533AB7]'>{summary.active}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Vendor Nonaktif</CardTitle>
              <p className='text-sm text-muted-foreground'>Vendor yang sedang dibekukan.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#7F77DD]'>{summary.inactive}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Total Order Vendor</CardTitle>
              <p className='text-sm text-muted-foreground'>Jumlah order dari seluruh vendor.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#4E73D9]'>{summary.totalOrders}</p>
            </CardContent>
          </Card>
        </div>

        <div className='flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative w-full sm:max-w-md'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Cari vendor, email, atau kota...'
                className='pl-9'
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className='h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground'
            >
              <option value='all'>Semua status</option>
              <option value='active'>Aktif</option>
              <option value='inactive'>Nonaktif</option>
            </select>
          </div>
          <Badge variant='outline' className='text-xs'>
            {filteredVendors.length} vendor tampil
          </Badge>
        </div>

        {filteredVendors.length === 0 ? (
          <div className='rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground'>
            Tidak ada vendor yang cocok dengan filter saat ini.
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className='border-border/60'>
                <CardHeader>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <CardTitle className='text-base'>{vendor.name}</CardTitle>
                      <p className='text-xs text-muted-foreground'>{vendor.user?.email || '-'}</p>
                    </div>
                    <Badge
                      variant='outline'
                      className={vendor.is_active ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-600'}
                    >
                      {vendor.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Building2 className='size-4' />
                    <span>{vendor.city || 'Tanpa kota'}</span>
                  </div>
                  <div className='flex flex-wrap items-center gap-3 text-xs'>
                    <span className='rounded-full border px-2 py-1 bg-[#EEE9FF] text-[#533AB7]'>
                      {vendor.totalMenus} menu
                    </span>
                    <span className='rounded-full border px-2 py-1 bg-[#F0F4FF] text-[#4E73D9]'>
                      {vendor.totalOrders} order
                    </span>
                    <span className='rounded-full border px-2 py-1 bg-[#F5F0FF] text-[#7A5CE6] flex items-center gap-1'>
                      <Star className='size-3.5' />
                      {vendor.avgRating.toFixed(1)} ({vendor.totalRatings})
                    </span>
                  </div>
                </CardContent>
                <CardFooter className='flex flex-wrap gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => void toggleStatus(vendor)}
                    disabled={busyVendorId === vendor.id}
                  >
                    {vendor.is_active ? <Ban className='size-4' /> : <ShieldCheck className='size-4' />}
                    {vendor.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => void removeVendor(vendor)}
                    disabled={busyVendorId === vendor.id}
                  >
                    Hapus
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Search, ShieldAlert, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteCookies } from '@/helper/cookies'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type CustomerUser = {
  id: number
  name: string
  email: string
}

type CustomerItem = {
  id: number
  user_id: number
  phone: string
  address?: string
  city?: string
  created_at: string
  updated_at: string
  user: CustomerUser
  totalOrders: number
  totalReviews: number
}

type CustomersResponse = {
  data?: CustomerItem[]
  total?: number
  message?: string
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [busyCustomerId, setBusyCustomerId] = useState<number | null>(null)

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadCustomers = useCallback(async () => {
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
      const res = await fetch(`${baseUrl}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as CustomersResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat data customer')
      }

      setCustomers(json.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat customer')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return customers.filter((customer) => {
      if (!normalizedQuery) return true
      return [
        customer.user?.name,
        customer.user?.email,
        customer.city,
        customer.phone,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery))
    })
  }, [customers, searchQuery])

  const summary = useMemo(() => {
    const totalOrders = customers.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0)
    const totalReviews = customers.reduce((sum, customer) => sum + (customer.totalReviews || 0), 0)
    return { totalOrders, totalReviews }
  }, [customers])

  const removeCustomer = async (customer: CustomerItem) => {
    if (!confirm(`Hapus customer "${customer.user?.name || 'Customer'}"?`)) return

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setBusyCustomerId(customer.id)

    try {
      const res = await fetch(`${baseUrl}/customers/${customer.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      if (!res.ok) {
        const json = (await res.json()) as { message?: string }
        throw new Error(json.message || 'Gagal menghapus customer')
      }

      setCustomers((prev) => prev.filter((item) => item.id !== customer.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus customer')
    } finally {
      setBusyCustomerId(null)
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
              <p className='text-xs uppercase tracking-[0.3em] text-white/70'>Customer Management</p>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Manajemen Customer</h1>
              <p className='max-w-xl text-sm text-white/80'>
                Monitoring basis customer, aktivitas order, dan kontribusi ulasan marketplace.
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
              <CardTitle className='text-base'>Total Customer</CardTitle>
              <p className='text-sm text-muted-foreground'>Jumlah customer terdaftar.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#533AB7]'>{customers.length}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Total Order</CardTitle>
              <p className='text-sm text-muted-foreground'>Akumulasi order customer.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#7F77DD]'>{summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Total Ulasan</CardTitle>
              <p className='text-sm text-muted-foreground'>Kontribusi ulasan dari customer.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#4E73D9]'>{summary.totalReviews}</p>
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
                placeholder='Cari nama, email, kota, atau telepon...'
                className='pl-9'
              />
            </div>
          </div>
          <Badge variant='outline' className='text-xs'>
            {filteredCustomers.length} customer tampil
          </Badge>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className='rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground'>
            Tidak ada customer yang cocok dengan pencarian.
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className='border-border/60'>
                <CardHeader>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <CardTitle className='text-base'>{customer.user?.name || 'Customer'}</CardTitle>
                      <p className='text-xs text-muted-foreground'>{customer.user?.email || '-'}</p>
                    </div>
                    <Badge variant='outline' className='border-[#D9D6FB] text-[#533AB7]'>
                      {customer.totalOrders} order
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Mail className='size-4' />
                    <span>{customer.phone || '-'}</span>
                  </div>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Users className='size-4' />
                    <span>{customer.city || 'Tanpa kota'}</span>
                  </div>
                  <div className='flex flex-wrap items-center gap-3 text-xs'>
                    <span className='rounded-full border px-2 py-1 bg-[#F0F4FF] text-[#4E73D9]'>
                      {customer.totalReviews} ulasan
                    </span>
                    <span className='rounded-full border px-2 py-1 bg-[#F5F0FF] text-[#7A5CE6]'>
                      {new Date(customer.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </CardContent>
                <CardContent className='flex flex-wrap gap-2 pt-0'>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => void removeCustomer(customer)}
                    disabled={busyCustomerId === customer.id}
                  >
                    <ShieldAlert className='size-4' />
                    Hapus
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

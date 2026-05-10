'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteCookies } from '@/helper/cookies'
import { BadgeDollarSign, CheckCircle2, Clock, CreditCard, Receipt, Search, XCircle } from 'lucide-react'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type PaymentItem = {
  id: number
  order_id: number
  amount: number | string
  payment_method: string
  status: string
  paid_at?: string | null
  created_at: string
  vendor?: { name: string } | null
  customer?: { name: string; email: string } | null
}

type PaymentsResponse = {
  data?: PaymentItem[]
  total?: number
  message?: string
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function getPaymentStatusInfo(status: string) {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    case 'paid':
      return { label: 'Lunas', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
    case 'failed':
      return { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: XCircle }
    case 'refunded':
      return { label: 'Refund', color: 'bg-blue-100 text-blue-800', icon: Receipt }
    default:
      return { label: status || '-', color: 'bg-muted text-muted-foreground', icon: Clock }
  }
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadPayments = useCallback(async () => {
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
      const res = await fetch(`${baseUrl}/payments/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as PaymentsResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat data pembayaran')
      }

      setPayments(json.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat pembayaran')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadPayments()
  }, [loadPayments])

  const generateDemoPayments = () => {
    const now = new Date()
    const demoPayments: PaymentItem[] = [
      {
        id: Number(`${Date.now()}1`),
        order_id: 12031,
        amount: 425000,
        payment_method: 'transfer',
        status: 'paid',
        paid_at: now.toISOString(),
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        vendor: { name: 'Dapoer Sehat' },
        customer: { name: 'Nadia Putri', email: 'nadia@example.com' },
      },
      {
        id: Number(`${Date.now()}2`),
        order_id: 12032,
        amount: 289000,
        payment_method: 'ewallet',
        status: 'pending',
        paid_at: null,
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
        vendor: { name: 'Catering Mawar' },
        customer: { name: 'Rafi Akbar', email: 'rafi@example.com' },
      },
      {
        id: Number(`${Date.now()}3`),
        order_id: 12033,
        amount: 510000,
        payment_method: 'cash',
        status: 'failed',
        paid_at: null,
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 26).toISOString(),
        vendor: { name: 'Sari Rasa Kitchen' },
        customer: { name: 'Kevin Surya', email: 'kevin@example.com' },
      },
    ]

    setPayments(demoPayments)
    setIsDemoMode(true)
    setError('')
  }

  const filteredPayments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return payments.filter((payment) => {
      const matchesQuery = normalizedQuery
        ? [
            payment.vendor?.name,
            payment.customer?.name,
            payment.customer?.email,
            String(payment.order_id),
            payment.payment_method,
          ]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedQuery))
        : true
      const matchesStatus = statusFilter === 'all' ? true : payment.status === statusFilter
      const matchesMethod = methodFilter === 'all' ? true : payment.payment_method === methodFilter
      return matchesQuery && matchesStatus && matchesMethod
    })
  }, [payments, searchQuery, statusFilter, methodFilter])

  const summary = useMemo(() => {
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const paidAmount = payments
      .filter((payment) => payment.status === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const pending = payments.filter((payment) => payment.status === 'pending').length
    return { totalAmount, paidAmount, pending }
  }, [payments])

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
              <p className='text-xs uppercase tracking-[0.3em] text-white/70'>Payments Overview</p>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Pembayaran Platform</h1>
              <p className='max-w-xl text-sm text-white/80'>
                Pantau status pembayaran dan performa transaksi di seluruh platform.
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
          {isDemoMode ? (
            <Badge variant='outline' className='bg-white/10 text-white border-white/30'>
              DEMO DATA
            </Badge>
          ) : null}
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        <div className='grid gap-4 md:grid-cols-3'>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Total Transaksi</CardTitle>
              <p className='text-sm text-muted-foreground'>Akumulasi seluruh pembayaran.</p>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-[#533AB7]'>{formatCurrency(summary.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Pembayaran Lunas</CardTitle>
              <p className='text-sm text-muted-foreground'>Total nominal pembayaran sukses.</p>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-[#7F77DD]'>{formatCurrency(summary.paidAmount)}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Pending</CardTitle>
              <p className='text-sm text-muted-foreground'>Menunggu konfirmasi pembayaran.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#4E73D9]'>{summary.pending}</p>
            </CardContent>
          </Card>
        </div>

        <div className='flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-1 flex-col gap-3 lg:flex-row lg:items-center'>
            <div className='relative w-full lg:max-w-md'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Cari vendor, customer, email, atau order...'
                className='pl-9'
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-44'
            >
              <option value='all'>Semua Status</option>
              <option value='paid'>Lunas</option>
              <option value='pending'>Pending</option>
              <option value='failed'>Gagal</option>
              <option value='refunded'>Refund</option>
            </select>
            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-44'
            >
              <option value='all'>Semua Metode</option>
              <option value='transfer'>Transfer</option>
              <option value='cash'>Cash</option>
              <option value='ewallet'>E-wallet</option>
            </select>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='outline' className='text-xs'>
              {filteredPayments.length} pembayaran tampil
            </Badge>
            <Button variant='outline' size='sm' onClick={generateDemoPayments}>
              Buat Data Demo
            </Button>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className='rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground'>
            Belum ada data pembayaran yang cocok.
            <div className='mt-4'>
              <Button size='sm' onClick={generateDemoPayments}>
                Buat Data Demo
              </Button>
            </div>
          </div>
        ) : (
          <div className='grid gap-4'>
            {filteredPayments.map((payment) => {
              const statusInfo = getPaymentStatusInfo(payment.status)
              const StatusIcon = statusInfo.icon
              return (
                <Card key={payment.id} className='overflow-hidden'>
                  <CardHeader className='border-b bg-muted/30 py-3 sm:py-4'>
                    <div className='flex flex-wrap items-center justify-between gap-4'>
                      <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-1.5 font-medium'>
                          <CreditCard className='size-4 text-[#533AB7]' />
                          {payment.payment_method.toUpperCase()}
                        </div>
                        <span className='text-xs text-muted-foreground'>•</span>
                        <span className='text-xs text-muted-foreground'>
                          {new Date(payment.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <Badge variant='outline' className={`gap-1.5 border-transparent ${statusInfo.color}`}>
                        <StatusIcon className='size-3.5' />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='p-4 sm:p-6'>
                    <div className='grid gap-3 md:grid-cols-[1.4fr_1fr]'>
                      <div className='space-y-2 text-sm'>
                        <div className='flex items-center gap-2 text-base font-semibold'>
                          <BadgeDollarSign className='size-4 text-[#7F77DD]' />
                          Order #{payment.order_id}
                        </div>
                        <div className='text-muted-foreground'>
                          Vendor: {payment.vendor?.name || 'Tidak diketahui'}
                        </div>
                        <div className='text-muted-foreground'>
                          Customer: {payment.customer?.name || 'Tidak diketahui'}
                          {payment.customer?.email ? ` • ${payment.customer.email}` : ''}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-muted/20 p-4 text-right'>
                        <p className='text-xs text-muted-foreground'>Nominal Pembayaran</p>
                        <p className='mt-1 text-lg font-bold text-[#533AB7]'>{formatCurrency(payment.amount)}</p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {payment.paid_at ? `Dibayar: ${new Date(payment.paid_at).toLocaleDateString('id-ID')}` : 'Belum dibayar'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

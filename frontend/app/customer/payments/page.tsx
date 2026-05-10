'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeDollarSign, Receipt, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Payment = {
  id: number
  order_id: number
  amount: string | number
  payment_method: string
  status: string
  created_at: string
  vendor?: {
    name: string
  }
}

type PaymentsResponse = {
  data?: Payment[]
  message?: string
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function getPaymentStatusInfo(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock }
    case 'paid':
      return { label: 'Lunas', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 }
    case 'failed':
      return { label: 'Gagal', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle }
    case 'refunded':
      return { label: 'Dikembalikan', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Receipt }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: Clock }
  }
}

export default function CustomerPaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState<Payment[]>([])
  const [isDemoMode, setIsDemoMode] = useState(false)

  const loadPayments = useCallback(async () => {
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
      const res = await fetch(`${baseUrl}/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.replace('/signin')
        return
      }

      if (!res.ok) {
        throw new Error('Fallback')
      }

      const json = (await res.json()) as PaymentsResponse
      const apiPayments = json.data || []

      if (apiPayments.length > 0) {
        setPayments(apiPayments)
        setIsDemoMode(false)
      } else {
        throw new Error('Fallback')
      }

      setError('')
    } catch (err) {
      // Fallback to demo mode
      console.warn('Endpoint /payments gagal atau kosong. Mengambil dari demo_payments localStorage.')
      setIsDemoMode(true)
      try {
        const demoData = localStorage.getItem('demo_payments')
        if (demoData) {
          const parsed = JSON.parse(demoData) as Payment[]
          setPayments(parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
        }
      } catch (e) {
        console.error('Gagal membaca demo_payments', e)
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadPayments()
  }, [loadPayments])

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl animate-pulse space-y-6'>
          <div className='h-32 rounded-3xl bg-muted' />
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-32 rounded-2xl bg-muted' />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-4xl space-y-6'>
        
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <BadgeDollarSign className='size-3.5 text-emerald-300' />
                Riwayat Transaksi
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Riwayat Pembayaran</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Lihat riwayat dan detail transaksi pembayaran Anda.
              </p>
            </div>
            {isDemoMode && (
              <Badge variant='outline' className='bg-yellow-500/20 text-yellow-100 border-yellow-500/50 hover:bg-yellow-500/30 font-bold tracking-widest'>
                DEMO MODE
              </Badge>
            )}
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {payments.length === 0 && !error ? (
          <div className='rounded-2xl border border-dashed bg-card p-12 text-center flex flex-col items-center justify-center mt-8'>
            <div className='flex size-20 items-center justify-center rounded-full bg-emerald-50 mb-6 dark:bg-emerald-950/30'>
              <BadgeDollarSign className='size-10 text-emerald-500 opacity-80' />
            </div>
            <h3 className='text-xl font-medium'>Belum ada riwayat pembayaran</h3>
            <p className='text-sm text-muted-foreground mt-2 max-w-md'>
              Anda belum melakukan transaksi apapun. Riwayat pembayaran dari pesanan Anda akan muncul di sini.
            </p>
            <Button className='mt-8 bg-emerald-600 hover:bg-emerald-700 text-white' onClick={() => router.push('/customer/orders')}>
              Lihat Pesanan Aktif
            </Button>
          </div>
        ) : null}

        <div className='space-y-4'>
          {payments.map((payment) => {
            const statusInfo = getPaymentStatusInfo(payment.status)
            const StatusIcon = statusInfo.icon

            return (
              <Card key={payment.id} className='overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'>
                <CardHeader className='border-b bg-muted/30 py-3 sm:py-4'>
                  <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-1.5 font-medium'>
                        <CreditCard className='size-4 text-emerald-600 dark:text-emerald-400' />
                        {payment.payment_method.toUpperCase()}
                      </div>
                      <span className='text-xs text-muted-foreground'>•</span>
                      <span className='text-xs text-muted-foreground'>
                        {new Date(payment.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
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
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                      <h4 className='font-medium'>Pesanan ke {payment.vendor?.name || 'Vendor'}</h4>
                      <p className='text-sm text-muted-foreground mt-1'>
                        ID Pesanan: #{payment.order_id}
                      </p>
                    </div>
                    <div className='text-left sm:text-right'>
                      <p className='text-xs text-muted-foreground'>Nominal Pembayaran</p>
                      <p className='text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5'>{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}

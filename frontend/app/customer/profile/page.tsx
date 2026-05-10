'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, MapPin, Mail, Building2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type ProfileResponse = {
  success: boolean
  message: string
  data: {
    user: {
      id: number
      email: string
      name: string
      role: string
    }
    profile: {
      phone: string
      address: string
      city: string
    }
  }
}

export default function CustomerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  })

  const loadProfile = useCallback(async () => {
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
      const res = await fetch(`${baseUrl}/auth/profile`, {
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

      const json = (await res.json()) as ProfileResponse
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memuat profil')
      }

      const { user, profile } = json.data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        city: profile?.city || ''
      })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat profil')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token || !baseUrl) return

    setSaving(true)
    setError('')
    setSuccessMsg('')

    try {
      // Perhatikan: update nama/email mungkin butuh endpoint berbeda jika PATCH /customers hanya untuk tabel customers.
      // Kita asumsikan PATCH /customers mengubah profil customer.
      const res = await fetch(`${baseUrl}/customers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: formData.phone,
          address: formData.address,
          city: formData.city
        })
      })

      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal menyimpan profil')
      }

      setSuccessMsg('Profil berhasil diperbarui!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl animate-pulse space-y-6'>
          <div className='h-8 w-64 rounded bg-muted' />
          <div className='h-96 rounded-2xl bg-muted' />
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-2xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <User className='size-3.5 text-emerald-300' />
                Pengaturan Akun
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Profil Saya</h1>
              <p className='max-w-xl text-sm text-emerald-50'>
                Atur informasi data diri dan alamat pengiriman utama Anda.
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className='rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400'>
            {successMsg}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Data Akun</CardTitle>
            <CardDescription>Informasi dasar akun Anda (tidak dapat diubah di sini).</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium flex items-center gap-2'>
                  <User className='size-4 text-muted-foreground' />
                  Nama Lengkap
                </label>
                <div className='h-10 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground flex items-center'>
                  {formData.name}
                </div>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium flex items-center gap-2'>
                  <Mail className='size-4 text-muted-foreground' />
                  Alamat Email
                </label>
                <div className='h-10 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground flex items-center'>
                  {formData.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detail Kontak & Alamat</CardTitle>
            <CardDescription>Pastikan alamat dan nomor telepon Anda aktif untuk mempermudah pengantaran catering.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium flex items-center gap-2'>
                <Phone className='size-4 text-muted-foreground' />
                Nomor Telepon
              </label>
              <input
                type='text'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                placeholder='Contoh: 08123456789'
              />
            </div>
            
            <div className='space-y-2'>
              <label className='text-sm font-medium flex items-center gap-2'>
                <Building2 className='size-4 text-muted-foreground' />
                Kota
              </label>
              <input
                type='text'
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                placeholder='Contoh: Jakarta Selatan'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium flex items-center gap-2'>
                <MapPin className='size-4 text-muted-foreground' />
                Alamat Lengkap
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className='flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                placeholder='Masukkan alamat lengkap pengantaran...'
              />
            </div>
          </CardContent>
          <CardFooter className='border-t bg-muted/10 px-6 py-4 flex justify-end'>
            <Button onClick={() => void handleSave()} disabled={saving} className='gap-2'>
              <Save className='size-4' />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

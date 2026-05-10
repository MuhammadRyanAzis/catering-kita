'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Image, MapPin, Phone, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteCookies } from '@/helper/cookies'

type VendorProfile = {
  id: number
  name: string
  description?: string
  address?: string
  city?: string
  phone?: string
  image_url?: string
  banner_url?: string
  subscription_price_7?: number | string
  subscription_price_30?: number | string
}

type ProfileResponse = {
  data?: {
    profile?: VendorProfile | null
  }
  message?: string
}

type UpdateResponse = {
  message?: string
  data?: VendorProfile
}

type FormState = {
  name: string
  description: string
  address: string
  city: string
  image_url: string
  banner_url: string
  subscription_price_7: string
  subscription_price_30: string
}

export default function VendorProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    address: '',
    city: '',
    image_url: '',
    banner_url: '',
    subscription_price_7: '',
    subscription_price_30: '',
  })

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

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
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as ProfileResponse
      if (!res.ok || !json.data?.profile) {
        throw new Error(json.message || 'Profil vendor tidak ditemukan')
      }

      const data = json.data.profile
      setProfile(data)
      setForm({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        image_url: data.image_url || '',
        banner_url: data.banner_url || '',
        subscription_price_7: data.subscription_price_7?.toString() || '',
        subscription_price_30: data.subscription_price_30?.toString() || '',
      })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat profil')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    if (!form.name.trim()) {
      setError('Nama vendor wajib diisi')
      return
    }

    if (!form.address.trim()) {
      setError('Alamat vendor wajib diisi')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const subscriptionPrice7 = form.subscription_price_7.trim()
      const subscriptionPrice30 = form.subscription_price_30.trim()

      const res = await fetch(`${baseUrl}/vendors`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          address: form.address.trim(),
          city: form.city.trim() || undefined,
          image_url: form.image_url.trim() || undefined,
          banner_url: form.banner_url.trim() || undefined,
          subscription_price_7: subscriptionPrice7 ? Number(subscriptionPrice7) : undefined,
          subscription_price_30: subscriptionPrice30 ? Number(subscriptionPrice30) : undefined,
        }),
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as UpdateResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal menyimpan profil vendor')
      }

      setProfile(json.data || profile)
      setSuccess('Profil vendor berhasil diperbarui')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil vendor')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-3xl animate-pulse space-y-6'>
          <div className='h-32 rounded-3xl bg-muted' />
          <div className='h-96 rounded-2xl bg-muted' />
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-indigo-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <div className='inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <Store className='size-3.5 text-amber-300' />
                Profil Vendor
              </div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Identitas Bisnis</h1>
              <p className='max-w-xl text-sm text-sky-50'>
                Lengkapi informasi usaha agar pelanggan mudah mengenal brand kamu.
              </p>
            </div>
            <Button
              variant='outline'
              className='bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20'
              onClick={() => router.push('/vendor/dashboard')}
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

        {success ? (
          <div className='rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
            {success}
          </div>
        ) : null}

        <Card className='border-border/60 shadow-sm'>
          <CardHeader>
            <CardTitle>Informasi Utama</CardTitle>
            <CardDescription>Perbarui profil usaha sesuai identitas brand.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium flex items-center gap-2'>
                <Store className='size-4 text-muted-foreground' />
                Nama Vendor
              </label>
              <Input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder='Nama usaha'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                className='flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
                placeholder='Ceritakan keunggulan bisnis kamu.'
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium flex items-center gap-2'>
                  <MapPin className='size-4 text-muted-foreground' />
                  Alamat
                </label>
                <Input
                  value={form.address}
                  onChange={(event) => updateForm('address', event.target.value)}
                  placeholder='Alamat usaha'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Kota</label>
                <Input
                  value={form.city}
                  onChange={(event) => updateForm('city', event.target.value)}
                  placeholder='Kota'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium flex items-center gap-2'>
                <Phone className='size-4 text-muted-foreground' />
                Nomor Telepon (read-only)
              </label>
              <Input value={profile?.phone || '-'} readOnly className='bg-muted/40 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 shadow-sm'>
          <CardHeader>
            <CardTitle>Media Brand</CardTitle>
            <CardDescription>Gunakan gambar untuk memperkuat tampilan vendor.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium flex items-center gap-2'>
                <Image className='size-4 text-muted-foreground' />
                Banner URL
              </label>
              <Input
                value={form.banner_url}
                onChange={(event) => updateForm('banner_url', event.target.value)}
                placeholder='https://...'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Foto Profil URL</label>
              <Input
                value={form.image_url}
                onChange={(event) => updateForm('image_url', event.target.value)}
                placeholder='https://...'
              />
            </div>
          </CardContent>
          <CardFooter className='border-t bg-muted/10 px-6 py-4 flex justify-end'>
            <Button onClick={() => void handleSave()} disabled={saving} className='gap-2'>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardFooter>
        </Card>

        <Card className='border-border/60 shadow-sm'>
          <CardHeader>
            <CardTitle>Paket Langganan</CardTitle>
            <CardDescription>Atur harga paket langganan 7 hari dan 30 hari.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Harga Paket 7 Hari</label>
              <Input
                type='number'
                min='0'
                value={form.subscription_price_7}
                onChange={(event) => updateForm('subscription_price_7', event.target.value)}
                placeholder='Contoh: 350000'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Harga Paket 30 Hari</label>
              <Input
                type='number'
                min='0'
                value={form.subscription_price_30}
                onChange={(event) => updateForm('subscription_price_30', event.target.value)}
                placeholder='Contoh: 1200000'
              />
            </div>
          </CardContent>
          <CardFooter className='border-t bg-muted/10 px-6 py-4 flex justify-end'>
            <Button onClick={() => void handleSave()} disabled={saving} className='gap-2'>
              {saving ? 'Menyimpan...' : 'Simpan Harga Paket'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteCookies } from '@/helper/cookies'
import { PencilLine, Plus, Search, Tags, Trash2 } from 'lucide-react'

type DashboardUser = {
  id: number
  name: string
  email: string
  role?: string
}

type CategoryItem = {
  id: number
  name: string
  description?: string
  created_at: string
  totalMenus: number
}

type CategoriesResponse = {
  data?: CategoryItem[]
  total?: number
  message?: string
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyCategoryId, setBusyCategoryId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadCategories = useCallback(async () => {
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
      const res = await fetch(`${baseUrl}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as CategoriesResponse
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat kategori menu')
      }

      setCategories(json.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat kategori')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, router])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const filteredCategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return categories.filter((category) => {
      if (!normalizedQuery) return true
      return [category.name, category.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery))
    })
  }, [categories, searchQuery])

  const summary = useMemo(() => {
    const totalMenus = categories.reduce((sum, category) => sum + (category.totalMenus || 0), 0)
    const emptyCategories = categories.filter((category) => (category.totalMenus || 0) === 0).length
    return { totalMenus, emptyCategories }
  }, [categories])

  const startEdit = (category: CategoryItem) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditDescription(category.description || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
  }

  const createCategory = async () => {
    const name = formName.trim()
    const description = formDescription.trim()
    if (!name) {
      setError('Nama kategori wajib diisi')
      return
    }

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setCreating(true)

    try {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description: description || undefined }),
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as { data?: CategoryItem; message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal menambah kategori')
      }

      const created = json.data
      if (created) {
        const normalized: CategoryItem = {
          ...created,
          totalMenus: 0,
        }
        setCategories((prev) =>
          [...prev, normalized].sort((a, b) => a.name.localeCompare(b.name)),
        )
      }

      setFormName('')
      setFormDescription('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah kategori')
    } finally {
      setCreating(false)
    }
  }

  const updateCategory = async (category: CategoryItem) => {
    const name = editName.trim()
    const description = editDescription.trim()
    if (!name) {
      setError('Nama kategori wajib diisi')
      return
    }

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setBusyCategoryId(category.id)

    try {
      const res = await fetch(`${baseUrl}/categories/${category.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description: description || undefined }),
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as { data?: CategoryItem; message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal mengubah kategori')
      }

      if (json.data) {
        setCategories((prev) =>
          prev.map((item) =>
            item.id === category.id ? { ...item, ...json.data, totalMenus: item.totalMenus } : item,
          ),
        )
      }

      cancelEdit()
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah kategori')
    } finally {
      setBusyCategoryId(null)
    }
  }

  const removeCategory = async (category: CategoryItem) => {
    if (!confirm(`Hapus kategori "${category.name}"?`)) return

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setBusyCategoryId(category.id)

    try {
      const res = await fetch(`${baseUrl}/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      if (!res.ok) {
        const json = (await res.json()) as { message?: string }
        throw new Error(json.message || 'Gagal menghapus kategori')
      }

      setCategories((prev) => prev.filter((item) => item.id !== category.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kategori')
    } finally {
      setBusyCategoryId(null)
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
              <p className='text-xs uppercase tracking-[0.3em] text-white/70'>Category Management</p>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Kategori Menu</h1>
              <p className='max-w-xl text-sm text-white/80'>
                Kelola kategori menu agar katalog vendor rapi dan mudah dipahami.
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
              <CardTitle className='text-base'>Total Kategori</CardTitle>
              <p className='text-sm text-muted-foreground'>Jumlah kategori aktif.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#533AB7]'>{categories.length}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Total Menu</CardTitle>
              <p className='text-sm text-muted-foreground'>Menu yang sudah dikategorikan.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#7F77DD]'>{summary.totalMenus}</p>
            </CardContent>
          </Card>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='text-base'>Kategori Kosong</CardTitle>
              <p className='text-sm text-muted-foreground'>Belum dipakai vendor.</p>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-[#4E73D9]'>{summary.emptyCategories}</p>
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4 lg:grid-cols-[1.1fr_1.9fr]'>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Tags className='size-4 text-[#533AB7]' />
                Tambah Kategori
              </CardTitle>
              <p className='text-sm text-muted-foreground'>Masukkan nama dan deskripsi singkat.</p>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Nama Kategori</label>
                <Input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder='Contoh: Breakfast'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Deskripsi (opsional)</label>
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  className='flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  placeholder='Misalnya untuk paket catering acara formal.'
                />
              </div>
              <Button
                className='w-full gap-2'
                onClick={() => void createCategory()}
                disabled={creating}
              >
                <Plus className='size-4' />
                {creating ? 'Menyimpan...' : 'Tambah Kategori'}
              </Button>
            </CardContent>
          </Card>

          <Card className='border-border/60'>
            <CardHeader className='space-y-3'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <CardTitle className='text-base'>Daftar Kategori</CardTitle>
                <Badge variant='outline' className='text-xs'>
                  {filteredCategories.length} kategori tampil
                </Badge>
              </div>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='Cari nama atau deskripsi kategori...'
                  className='pl-9'
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredCategories.length === 0 ? (
                <div className='rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground'>
                  Belum ada kategori yang cocok dengan pencarian.
                </div>
              ) : (
                <div className='space-y-3'>
                  {filteredCategories.map((category) => {
                    const isEditing = editingId === category.id
                    const isBusy = busyCategoryId === category.id
                    return (
                      <div
                        key={category.id}
                        className='rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm'
                      >
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div className='space-y-1'>
                            {isEditing ? (
                              <Input
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                placeholder='Nama kategori'
                              />
                            ) : (
                              <p className='text-base font-semibold'>{category.name}</p>
                            )}
                            {isEditing ? (
                              <textarea
                                value={editDescription}
                                onChange={(event) => setEditDescription(event.target.value)}
                                className='flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                placeholder='Deskripsi singkat kategori'
                              />
                            ) : (
                              <p className='text-sm text-muted-foreground'>
                                {category.description || 'Belum ada deskripsi kategori.'}
                              </p>
                            )}
                          </div>
                          <Badge variant='secondary' className='h-8 px-3 text-xs'>
                            {category.totalMenus || 0} menu
                          </Badge>
                        </div>

                        <div className='mt-4 flex flex-wrap items-center gap-2'>
                          {isEditing ? (
                            <>
                              <Button
                                className='gap-2'
                                size='sm'
                                onClick={() => void updateCategory(category)}
                                disabled={isBusy}
                              >
                                <PencilLine className='size-4' />
                                {isBusy ? 'Menyimpan...' : 'Simpan'}
                              </Button>
                              <Button variant='outline' size='sm' onClick={cancelEdit} disabled={isBusy}>
                                Batal
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant='outline'
                              size='sm'
                              className='gap-2'
                              onClick={() => startEdit(category)}
                            >
                              <PencilLine className='size-4' />
                              Edit
                            </Button>
                          )}
                          <Button
                            variant='destructive'
                            size='sm'
                            className='gap-2'
                            onClick={() => void removeCategory(category)}
                            disabled={isBusy}
                          >
                            <Trash2 className='size-4' />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

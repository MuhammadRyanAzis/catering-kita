'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  CircleOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { deleteCookies } from '@/helper/cookies'

type VendorProfile = {
  id: number
  name: string
}

type MenuItem = {
  id: number
  name: string
  description?: string
  price: number
  calories?: number
  image_url?: string
  available: boolean
  category?: {
    id: number
    name: string
  } | null
}

type CategoryItem = {
  id: number
  name: string
}

type ProfileResponse = {
  data?: {
    profile?: VendorProfile | null
  }
  message?: string
}

type VendorMenusResponse = {
  data?: MenuItem[]
  total?: number
  vendor?: VendorProfile
  message?: string
}

type CategoriesResponse = {
  data?: CategoryItem[]
  message?: string
}

type MenuFormState = {
  name: string
  description: string
  price: string
  calories: string
  image_url: string
  categoryId: string
  available: boolean
}

const EMPTY_FORM: MenuFormState = {
  name: '',
  description: '',
  price: '',
  calories: '',
  image_url: '',
  categoryId: '',
  available: true,
}

function formatCurrency(value: number | string): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

export default function VendorMenusPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [formState, setFormState] = useState<MenuFormState>(EMPTY_FORM)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await deleteCookies('token')
    await deleteCookies('user')
    router.replace('/signin')
  }, [router])

  const loadVendorMenus = useCallback(async (vendorId: number, token: string, baseUrl: string) => {
    const menusRes = await fetch(`${baseUrl}/vendors/${vendorId}/menus`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (menusRes.status === 401) {
      await handleLogout()
      return
    }

    const menusJson = (await menusRes.json()) as VendorMenusResponse
    if (!menusRes.ok) {
      throw new Error(menusJson.message || 'Gagal memuat data menu')
    }

    setMenus(menusJson.data || [])
  }, [handleLogout])

  const loadCategories = useCallback(async (baseUrl: string) => {
    const categoriesRes = await fetch(`${baseUrl}/categories`)
    const categoriesJson = (await categoriesRes.json()) as CategoriesResponse
    if (!categoriesRes.ok) {
      throw new Error(categoriesJson.message || 'Gagal memuat kategori')
    }

    setCategories(categoriesJson.data || [])
  }, [])

  const loadPage = useCallback(async () => {
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

    try {
      const profileRes = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (profileRes.status === 401) {
        await handleLogout()
        return
      }

      const profileJson = (await profileRes.json()) as ProfileResponse
      if (!profileRes.ok || !profileJson.data?.profile) {
        throw new Error(profileJson.message || 'Profil vendor tidak ditemukan')
      }

      const vendorProfile = profileJson.data.profile
      setVendor(vendorProfile)

      await Promise.all([
        loadVendorMenus(vendorProfile.id, token, baseUrl),
        loadCategories(baseUrl),
      ])

      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat menu')
    } finally {
      setLoading(false)
    }
  }, [handleLogout, loadCategories, loadVendorMenus, router])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const filteredMenus = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return menus.filter((menu) => {
      const matchesQuery = normalizedQuery
        ? [menu.name, menu.description, menu.category?.name]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedQuery))
        : true
      const matchesCategory = filterCategory ? menu.category?.id === Number(filterCategory) : true
      return matchesQuery && matchesCategory
    })
  }, [menus, searchQuery, filterCategory])

  const openCreateSheet = () => {
    setEditingMenu(null)
    setFormState(EMPTY_FORM)
    setIsSheetOpen(true)
  }

  const openEditSheet = (menu: MenuItem) => {
    setEditingMenu(menu)
    setFormState({
      name: menu.name,
      description: menu.description || '',
      price: String(menu.price ?? ''),
      calories: menu.calories ? String(menu.calories) : '',
      image_url: menu.image_url || '',
      categoryId: menu.category?.id ? String(menu.category.id) : '',
      available: menu.available,
    })
    setIsSheetOpen(true)
  }

  const updateFormState = (field: keyof MenuFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    if (!formState.name.trim()) {
      setError('Nama menu wajib diisi')
      return
    }

    if (!formState.price) {
      setError('Harga menu wajib diisi')
      return
    }

    setSubmitLoading(true)
    setError('')

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      price: Number(formState.price),
      categoryId: formState.categoryId ? Number(formState.categoryId) : undefined,
      calories: formState.calories ? Number(formState.calories) : undefined,
      image_url: formState.image_url.trim() || undefined,
      ...(editingMenu ? {} : { available: formState.available }),
    }

    try {
      const res = await fetch(
        `${baseUrl}/menus${editingMenu ? `/${editingMenu.id}` : ''}`,
        {
          method: editingMenu ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as { message?: string; data?: MenuItem }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal menyimpan menu')
      }

      if (editingMenu) {
        setMenus((prev) => prev.map((item) => (item.id === editingMenu.id ? (json.data || item) : item)))
      } else {
        setMenus((prev) => [json.data || (payload as unknown as MenuItem), ...prev])
      }

      setIsSheetOpen(false)
      setEditingMenu(null)
      setFormState(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan menu')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleToggleAvailable = async (menu: MenuItem) => {
    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setToggleLoadingId(menu.id)

    try {
      const res = await fetch(`${baseUrl}/menus/${menu.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      const json = (await res.json()) as { data?: MenuItem; message?: string }
      if (!res.ok) {
        throw new Error(json.message || 'Gagal mengubah status menu')
      }

      setMenus((prev) => prev.map((item) => (item.id === menu.id ? (json.data || item) : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status menu')
    } finally {
      setToggleLoadingId(null)
    }
  }

  const handleDeleteMenu = async (menu: MenuItem) => {
    if (!confirm(`Hapus menu "${menu.name}"?`)) return

    const token = localStorage.getItem('token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    setDeleteLoadingId(menu.id)

    try {
      const res = await fetch(`${baseUrl}/menus/${menu.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        await handleLogout()
        return
      }

      if (!res.ok) {
        const json = (await res.json()) as { message?: string }
        throw new Error(json.message || 'Gagal menghapus menu')
      }

      setMenus((prev) => prev.filter((item) => item.id !== menu.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus menu')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  if (loading) {
    return (
      <main className='min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl animate-pulse space-y-6'>
          <div className='h-10 w-64 rounded bg-muted' />
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='h-56 rounded-2xl bg-muted/60' />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-linear-to-b from-background via-muted/20 to-background px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <header className='relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8'>
          <div className='absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl' />
          <div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-indigo-400/20 blur-2xl' />
          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-[0.3em] text-white/70'>Vendor Workspace</p>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl text-white'>Kelola Menu</h1>
              <p className='max-w-xl text-sm text-sky-50'>
                Atur daftar menu, harga, ketersediaan, dan kategorinya dalam satu tempat.
              </p>
            </div>
            <Button
              className='bg-white/10 text-white hover:bg-white/20'
              onClick={openCreateSheet}
            >
              <Plus className='size-4' />
              Tambah Menu
            </Button>
          </div>
        </header>

        {error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        <div className='flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative w-full sm:max-w-md'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Cari menu atau kategori...'
                className='pl-9'
              />
            </div>
            <select
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
              className='h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground'
            >
              <option value=''>Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <Badge variant='outline' className='text-xs'>
            {vendor?.name || 'Vendor'} • {menus.length} menu
          </Badge>
        </div>

        {filteredMenus.length === 0 ? (
          <div className='rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground'>
            Belum ada menu yang cocok. Coba tambah menu baru atau ubah filter pencarian.
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredMenus.map((menu) => (
              <Card key={menu.id} className='overflow-hidden'>
                <CardHeader className='border-b bg-muted/30'>
                  <div className='flex items-start justify-between gap-3'>
                    <CardTitle className='text-base'>{menu.name}</CardTitle>
                    <Badge
                      variant='outline'
                      className={menu.available ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-600'}
                    >
                      {menu.available ? 'Tersedia' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {menu.category?.name || 'Tanpa kategori'}
                  </p>
                </CardHeader>
                <CardContent className='space-y-3 p-4'>
                  {menu.image_url ? (
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className='h-36 w-full rounded-lg object-cover'
                    />
                  ) : (
                    <div className='flex h-36 items-center justify-center rounded-lg bg-muted/40 text-xs text-muted-foreground'>
                      Belum ada foto menu
                    </div>
                  )}
                  <p className='text-sm text-muted-foreground'>
                    {menu.description || 'Belum ada deskripsi menu.'}
                  </p>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='font-semibold text-foreground'>
                      {formatCurrency(menu.price)}
                    </span>
                    <span className='text-muted-foreground'>
                      {menu.calories ? `${menu.calories} kcal` : 'Kalori belum diisi'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className='flex flex-wrap gap-2 border-t bg-muted/10 p-4'>
                  <Button variant='outline' size='sm' onClick={() => openEditSheet(menu)}>
                    <Pencil className='size-4' />
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={toggleLoadingId === menu.id}
                    onClick={() => void handleToggleAvailable(menu)}
                  >
                    {menu.available ? <CircleOff className='size-4' /> : <BadgeCheck className='size-4' />}
                    {menu.available ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    disabled={deleteLoadingId === menu.id}
                    onClick={() => void handleDeleteMenu(menu)}
                  >
                    <Trash2 className='size-4' />
                    Hapus
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}</SheetTitle>
            <SheetDescription>
              Lengkapi informasi menu agar pelanggan mudah menemukan pilihan terbaik.
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-4 px-6 pb-6 pt-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Nama Menu</label>
              <Input
                value={formState.name}
                onChange={(event) => updateFormState('name', event.target.value)}
                placeholder='Contoh: Paket Nasi Kotak'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Deskripsi</label>
              <textarea
                value={formState.description}
                onChange={(event) => updateFormState('description', event.target.value)}
                className='flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
                placeholder='Ceritakan menu singkat agar menarik.'
              />
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Harga</label>
                <Input
                  type='number'
                  value={formState.price}
                  onChange={(event) => updateFormState('price', event.target.value)}
                  placeholder='25000'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Kalori</label>
                <Input
                  type='number'
                  value={formState.calories}
                  onChange={(event) => updateFormState('calories', event.target.value)}
                  placeholder='450'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Kategori</label>
              <select
                value={formState.categoryId}
                onChange={(event) => updateFormState('categoryId', event.target.value)}
                className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
              >
                <option value=''>Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Link Gambar</label>
              <Input
                value={formState.image_url}
                onChange={(event) => updateFormState('image_url', event.target.value)}
                placeholder='https://...'
              />
            </div>
            {!editingMenu && (
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={formState.available}
                  onChange={(event) => updateFormState('available', event.target.checked)}
                />
                Menu langsung aktif
              </label>
            )}
          </div>

          <SheetFooter>
            <Button
              className='w-full'
              onClick={() => void handleSubmit()}
              disabled={submitLoading}
            >
              {submitLoading ? 'Menyimpan...' : editingMenu ? 'Simpan Perubahan' : 'Tambah Menu'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  )
}

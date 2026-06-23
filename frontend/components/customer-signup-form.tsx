'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { storeCookies } from '@/helper/cookies'

export function CustomerSignupForm({ onSwitchToSignin, onSwitchToVendor }: { onSwitchToSignin?: () => void; onSwitchToVendor?: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: '',
    city: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) newErrors.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email tidak valid'

    if (!formData.password) newErrors.password = 'Password wajib diisi'
    else if (formData.password.length < 8) newErrors.password = 'Password minimal 8 karakter'
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(formData.password))
      newErrors.password = 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial'

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Konfirmasi password wajib diisi'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Password tidak sesuai'

    if (!formData.name) newErrors.name = 'Nama wajib diisi'
    if (!formData.phone) newErrors.phone = 'Nomor telepon wajib diisi'
    if (!formData.address) newErrors.address = 'Alamat wajib diisi'
    if (!formData.city) newErrors.city = 'Kota wajib diisi'
    if (!agreed) newErrors.agreed = 'Anda harus menyetujui syarat dan ketentuan'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    const url = process.env.NEXT_PUBLIC_API_URL
    try {
      const response = await fetch(`${url}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'CUSTOMER',
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user in cookies (httpOnly, server-accessible)
        await storeCookies('token', data.data.access_token)
        await storeCookies('user', JSON.stringify(data.data.user))
        // Also keep in localStorage for client-side access
        localStorage.setItem('token', data.data.access_token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        toast.success(`Berhasil Mendaftar!`, {
          description: `Selamat datang ${formData.name}, mengalihkan ke dashboard...`,
        });

        // Redirect to dashboard
        router.push('/customer/dashboard')
      } else {
        const errorMsg = data.message || 'Gagal mendaftar';
        setErrors({ submit: errorMsg })
        toast.error('Pendaftaran Gagal', { description: errorMsg })
      }
    } catch (error) {
      setErrors({ submit: 'Terjadi kesalahan koneksi jaringan' })
      toast.error('Terjadi Kesalahan', { description: 'Tidak dapat terhubung ke server.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-2 sm:p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="space-y-2 lg:space-y-2.5">
          {/* Email */}
          <div className="space-y-1 lg:space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.email ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Nama */}
          <div className="space-y-1 lg:space-y-1.5">
            <Label htmlFor="name" className="text-sm">Nama Lengkap</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.name ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1 lg:space-y-1.5">
            <Label htmlFor="phone" className="text-sm">Nomor Telepon</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.phone ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div className="space-y-1 lg:space-y-1.5">
            <Label htmlFor="address" className="text-sm">Alamat Lengkap</Label>
            <Input
              id="address"
              name="address"
              type="text"
              placeholder="Alamat lengkap"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.address ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
          </div>

          {/* City */}
          <div className="space-y-1 lg:space-y-1.5">
            <Label htmlFor="city" className="text-sm">Kota</Label>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="Kota"
              value={formData.city}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.city ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1 lg:space-y-1.5">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={`${errors.password ? 'border-red-500 pr-9' : 'pr-9'} h-9 text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1 lg:space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Konfirmasi password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`${errors.confirmPassword ? 'border-red-500 pr-9' : 'pr-9'} h-9 text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          {/* Agreement */}
          <div className="flex items-start space-x-2 mt-1">
            <Checkbox
              id="agreed"
              checked={agreed}
              onCheckedChange={(checked) => {
                setAgreed(checked as boolean)
                if (checked && errors.agreed) {
                  setErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.agreed
                    return newErrors
                  })
                }
              }}
              disabled={isLoading}
              className="mt-0.5"
            />
            <label htmlFor="agreed" className="text-xs text-muted-foreground leading-tight cursor-pointer">
              Saya setuju dengan syarat dan ketentuan CateringKita
            </label>
          </div>
          {errors.agreed && <p className="text-xs text-red-500">{errors.agreed}</p>}

          {errors.submit && <p className="text-xs text-red-500 text-center">{errors.submit}</p>}

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-9 text-sm" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Mendaftar...
              </>
            ) : (
              'Daftar Sekarang'
            )}
          </Button>

          {/* Switch to Vendor */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 text-sm"
            onClick={onSwitchToVendor}
            disabled={isLoading}
          >
            Daftar sebagai Vendor
          </Button>

          {/* Switch to Signin */}
          <p className="text-center text-xs text-muted-foreground">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={onSwitchToSignin}
              className="text-primary hover:underline font-semibold"
            >
              Masuk di sini
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import { storeCookies } from '@/helper/cookies'

export function VendorSignupForm({ onSwitchToSignin, onSwitchToCustomer }: { onSwitchToSignin?: () => void; onSwitchToCustomer?: () => void }) {
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
    vendorName: '',
    vendorAddress: '',
    vendorCity: '',
    vendorPhone: '',
    description: '',
    vendorImageUrl: '',
    vendorBannerUrl: '',
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

    if (!formData.name) newErrors.name = 'Nama pemilik wajib diisi'
    if (!formData.vendorName) newErrors.vendorName = 'Nama catering wajib diisi'
    if (!formData.vendorPhone) newErrors.vendorPhone = 'Nomor telepon catering wajib diisi'
    if (!formData.vendorAddress) newErrors.vendorAddress = 'Alamat catering wajib diisi'
    if (!formData.vendorCity) newErrors.vendorCity = 'Kota catering wajib diisi'
    if (!formData.description) newErrors.description = 'Deskripsi catering wajib diisi'
    if (!formData.vendorBannerUrl) newErrors.vendorBannerUrl = 'URL banner vendor wajib diisi'
    else if (!/^https?:\/\//i.test(formData.vendorBannerUrl)) {
      newErrors.vendorBannerUrl = 'URL banner harus diawali http:// atau https://'
    }
    if (formData.vendorImageUrl && !/^https?:\/\//i.test(formData.vendorImageUrl)) {
      newErrors.vendorImageUrl = 'URL foto harus diawali http:// atau https://'
    }
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
          role: 'VENDOR',
          vendor_name: formData.vendorName,
          vendor_address: formData.vendorAddress,
          vendor_city: formData.vendorCity,
          vendor_phone: formData.vendorPhone,
          description: formData.description,
          vendor_image_url: formData.vendorImageUrl || undefined,
          vendor_banner_url: formData.vendorBannerUrl,
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
        
        // Redirect to vendor dashboard
        router.push('/vendor/dashboard')
      } else {
        setErrors({ submit: data.message || 'Gagal mendaftar' })
      }
    } catch (error) {
      setErrors({ submit: 'Terjadi kesalahan, silakan coba lagi' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-2 sm:p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="space-y-1.5 lg:space-y-2">
          {/* Email */}
          <div className="space-y-0.5 lg:space-y-1">
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

          {/* Nama Pemilik */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="name" className="text-sm">Nama Pemilik</Label>
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

          {/* Nama Catering */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="vendorName" className="text-sm">Nama Catering</Label>
            <Input
              id="vendorName"
              name="vendorName"
              type="text"
              placeholder="Nama Catering"
              value={formData.vendorName}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.vendorName ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.vendorName && <p className="text-xs text-red-500">{errors.vendorName}</p>}
          </div>

          {/* Nomor Telepon Catering */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="vendorPhone" className="text-sm">Nomor Telepon Catering</Label>
            <Input
              id="vendorPhone"
              name="vendorPhone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={formData.vendorPhone}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.vendorPhone ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.vendorPhone && <p className="text-xs text-red-500">{errors.vendorPhone}</p>}
          </div>

          {/* Alamat Catering */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="vendorAddress" className="text-sm">Alamat Catering</Label>
            <Input
              id="vendorAddress"
              name="vendorAddress"
              type="text"
              placeholder="Alamat lengkap"
              value={formData.vendorAddress}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.vendorAddress ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.vendorAddress && <p className="text-xs text-red-500">{errors.vendorAddress}</p>}
          </div>

          {/* Kota Catering */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="vendorCity" className="text-sm">Kota Catering</Label>
            <Input
              id="vendorCity"
              name="vendorCity"
              type="text"
              placeholder="Kota"
              value={formData.vendorCity}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.vendorCity ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.vendorCity && <p className="text-xs text-red-500">{errors.vendorCity}</p>}
          </div>

          {/* Deskripsi Catering */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="description" className="text-sm">Deskripsi Catering</Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Deskripsi catering"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.description ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Foto Profil Vendor (URL) */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="vendorImageUrl" className="text-sm">URL Foto Profil Vendor (Opsional)</Label>
            <Input
              id="vendorImageUrl"
              name="vendorImageUrl"
              type="url"
              placeholder="https://contoh.com/foto-vendor.jpg"
              value={formData.vendorImageUrl}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.vendorImageUrl ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.vendorImageUrl && <p className="text-xs text-red-500">{errors.vendorImageUrl}</p>}
          </div>

          {/* Banner Vendor (URL) */}
          <div className="space-y-0.5 lg:space-y-1">
            <Label htmlFor="vendorBannerUrl" className="text-sm">URL Banner Vendor (Wajib, rasio 16:9)</Label>
            <Input
              id="vendorBannerUrl"
              name="vendorBannerUrl"
              type="url"
              placeholder="https://contoh.com/banner-vendor.jpg"
              value={formData.vendorBannerUrl}
              onChange={handleChange}
              disabled={isLoading}
              className={`${errors.vendorBannerUrl ? 'border-red-500' : ''} h-9 text-sm`}
            />
            {errors.vendorBannerUrl && <p className="text-xs text-red-500">{errors.vendorBannerUrl}</p>}
          </div>

          {/* Password */}
          <div className="space-y-0.5 lg:space-y-1">
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
          <div className="space-y-0.5 lg:space-y-1">
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
          <div className="flex items-start space-x-2">
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

          {/* Switch to Customer */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 text-sm"
            onClick={onSwitchToCustomer}
            disabled={isLoading}
          >
            Daftar sebagai Pelanggan
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

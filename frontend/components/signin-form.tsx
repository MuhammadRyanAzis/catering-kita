"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { storeCookies } from "@/helper/cookies"

export function SigninForm({ onSwitchToSignin }: { onSwitchToSignin?: () => void }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
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

        // Redirect based on role
        if (data.data.user.role === 'CUSTOMER') {
          router.push('/customer/dashboard')
        } else if (data.data.user.role === 'VENDOR') {
          router.push('/vendor/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(data.message || 'Email atau password salah')
      }
    } catch (err) {
      setError('Terjadi kesalahan, silakan coba lagi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-5">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-1.5 lg:space-y-2">
        <Label htmlFor="email" className="text-sm lg:text-base font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="contoh@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="h-10 lg:h-12 text-sm lg:text-base"
        />
      </div>

      <div className="space-y-1.5 lg:space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm lg:text-base font-medium">
            Kata Sandi
          </Label>
          <a href="#" className="text-xs lg:text-sm text-primary hover:underline">
            Lupa kata sandi?
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan kata sandi"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="h-10 lg:h-12 text-sm lg:text-base pr-10 lg:pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="h-4 lg:h-5 w-4 lg:w-5" /> : <Eye className="h-4 lg:h-5 w-4 lg:w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-0.5 lg:pt-1">
        <Checkbox
          id="rememberMe"
          checked={formData.rememberMe}
          onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
          Ingat saya
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-10 lg:h-12 text-sm lg:text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 lg:h-5 w-4 lg:w-5 animate-spin" />
            Masuk...
          </>
        ) : (
          "Masuk"
        )}
      </Button>

      <p className="text-center text-sm lg:text-base text-muted-foreground">
        Belum punya akun?{" "}
        <button
          type="button"
          onClick={onSwitchToSignin}
          className="text-primary hover:underline font-semibold"
        >
          Daftar sekarang
        </button>
      </p>
    </form>
  )
}
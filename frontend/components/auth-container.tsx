"use client"

import React, { useState, useEffect, useRef } from "react"
import { SigninForm } from "@/components/signin-form"
import { CustomerSignupForm } from "@/components/customer-signup-form"
import { VendorSignupForm } from "@/components/vendor-signup-form"
import { UtensilsCrossed, Shield, Clock, Star, Sparkles } from "lucide-react"

type AuthMode = "signup-customer" | "signup-vendor" | "signin"

export function AuthContainer({ initialMode = "signup-customer" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Reset scroll position when mode changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [mode])

  const isSignup = mode !== "signin"
  const isCustomerSignup = mode === "signup-customer"

  return (
    <div className="min-h-screen flex bg-background overflow-hidden relative">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />

      {/* Brand Panel - Slides left/right */}
      <div
        className={`
          hidden lg:flex absolute inset-y-4 w-[48%] z-10
          transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)
          ${isSignup ? "left-4" : "left-[50%]"}
        `}
      >
        <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] shadow-2xl">
          {/* Dynamic Background based on mode */}
          <div className={`absolute inset-0 transition-colors duration-1000 ${
            mode === 'signup-vendor' ? 'bg-hero-blue' :
            mode === 'signup-customer' ? 'bg-hero-green' : 'bg-hero-purple'
          }`} />

          {/* Animated decorative elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white blur-3xl animate-float-slow" />
            <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-white blur-3xl animate-float-medium delay-300" />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white blur-3xl animate-float-fast delay-700" />
          </div>

          <div className="relative z-20 flex flex-col justify-center min-h-full px-10 xl:px-14 py-12 lg:py-16 text-white overflow-y-auto custom-scrollbar">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 lg:mb-14 animate-slide-down">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl transition-transform hover:scale-105 duration-500">
                <UtensilsCrossed className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">CateringKita</span>
            </div>

            {/* Headline - Changes based on mode */}
            <div className="grid mb-10 lg:mb-14">
              {/* Signup Text */}
              <div className={`col-start-1 row-start-1 flex flex-col justify-start transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSignup ? "opacity-100 translate-y-0 z-10 delay-100" : "opacity-0 translate-y-8 pointer-events-none -z-10"}`}>
                <div className="inline-flex items-center self-start gap-2 bg-white/10 hover:bg-white/20 transition-all duration-500 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium mb-6 text-white border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-default">
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                  <span>Mulai Perjalanan Anda</span>
                </div>
                <h1 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] xl:text-[3.5rem] font-bold leading-[1.15] mb-5 text-balance text-white tracking-tight">
                  Pesan Catering Berkualitas untuk Setiap Momen
                </h1>
                <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-[90%] font-normal">
                  Bergabunglah dengan ribuan pelanggan yang mempercayakan kebutuhan catering mereka kepada kami.
                </p>
              </div>
              
              {/* Signin Text */}
              <div className={`col-start-1 row-start-1 flex flex-col justify-start transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${!isSignup ? "opacity-100 translate-y-0 z-10 delay-100" : "opacity-0 -translate-y-8 pointer-events-none -z-10"}`}>
                <div className="inline-flex items-center self-start gap-2 bg-white/10 hover:bg-white/20 transition-all duration-500 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium mb-6 text-white border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-default">
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                  <span>Selamat Datang Kembali</span>
                </div>
                <h1 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] xl:text-[3.5rem] font-bold leading-[1.15] mb-5 text-balance text-white tracking-tight">
                  Nikmati Kemudahan Catering Terbaik
                </h1>
                <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-[90%] font-normal">
                  Kami siap melayani kebutuhan catering Anda dengan menu lezat dan pelayanan prima yang tak terlupakan.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <FeatureItem
                icon={<Shield className="h-5 w-5" />}
                title="Terjamin Kualitasnya"
                description="Makanan segar dengan bahan berkualitas tinggi"
                delay="delay-100"
              />
              <FeatureItem
                icon={<Clock className="h-5 w-5" />}
                title="Pengiriman Tepat Waktu"
                description="Pesanan sampai sesuai jadwal yang ditentukan"
                delay="delay-200"
              />
              <FeatureItem
                icon={<Star className="h-5 w-5" />}
                title="Layanan Terbaik"
                description="Dukungan pelanggan 24/7 untuk kebutuhan Anda"
                delay="delay-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div
        ref={scrollContainerRef}
        className={`
          absolute inset-y-0 w-full lg:w-[50%] z-20 overflow-y-auto custom-scrollbar
          transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)
          ${isSignup ? "lg:left-[50%]" : "lg:left-0"}
        `}
      >
        <div className="min-h-full flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-20 py-8 lg:py-12">
          <div className="w-full max-w-[420px] bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500" />
            
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-800">
                CateringKita
              </span>
            </div>

            {/* Form Content with Crossfade */}
            <div className="relative">
              {/* Customer Signup Form */}
              <div
                className={`
                  transition-all duration-500 ease-in-out
                  ${isCustomerSignup
                    ? "opacity-100 translate-x-0 relative z-10" 
                    : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
                  }
                `}
              >
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Buat Akun Baru
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    Daftar sebagai pelanggan untuk memesan catering
                  </p>
                </div>
                <CustomerSignupForm 
                  onSwitchToSignin={() => setMode("signin")}
                  onSwitchToVendor={() => setMode("signup-vendor")}
                />
              </div>

              {/* Vendor Signup Form */}
              <div
                className={`
                  transition-all duration-500 ease-in-out
                  ${mode === "signup-vendor"
                    ? "opacity-100 translate-x-0 relative z-10" 
                    : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
                  }
                `}
              >
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Daftar Vendor
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    Buka catering Anda dan raih lebih banyak pelanggan
                  </p>
                </div>
                <VendorSignupForm 
                  onSwitchToSignin={() => setMode("signin")}
                  onSwitchToCustomer={() => setMode("signup-customer")}
                />
              </div>

              {/* Signin Form */}
              <div
                className={`
                  transition-all duration-500 ease-in-out
                  ${mode === "signin"
                    ? "opacity-100 translate-x-0 relative z-10" 
                    : "opacity-0 -translate-x-8 absolute inset-0 pointer-events-none"
                  }
                `}
              >
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Selamat Datang
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    Masuk ke akun Anda untuk melanjutkan
                  </p>
                </div>
                <SigninForm 
                  onSwitchToSignin={() => setMode("signup-customer")} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({
  icon,
  title,
  description,
  delay
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: string
}) {
  return (
    <div className={`group flex items-start gap-4 animate-slide-up ${delay} cursor-default`}>
      <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shrink-0 border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
        {icon}
      </div>
      <div className="pt-0.5 group-hover:-translate-y-0.5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <h3 className="font-semibold text-lg text-white tracking-tight group-hover:text-emerald-50 transition-colors duration-300">{title}</h3>
        <p className="text-white/70 text-sm mt-1 leading-relaxed group-hover:text-white/90 transition-colors duration-300">{description}</p>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useEffect, useRef } from "react"
import { SigninForm } from "@/components/signin-form"
import { CustomerSignupForm } from "@/components/customer-signup-form"
import { VendorSignupForm } from "@/components/vendor-signup-form"
import { UtensilsCrossed, Shield, Clock, Star } from "lucide-react"

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
    <div className="min-h-screen flex bg-primary overflow-hidden">
      {/* Green Panel - Slides left/right */}
      <div
        className={`
          hidden lg:flex absolute inset-y-0 w-[45%] z-10
          transition-all duration-700 ease-in-out
          ${isSignup ? "left-0" : "left-[55%]"}
        `}
      >
        <div className="relative w-full h-full overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20" />
            <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15" />
          </div>

          <div className="relative z-10 flex flex-col justify-center h-full px-12 xl:px-20 text-primary-foreground">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="p-3 bg-white/20 rounded-xl">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
              <span className="text-3xl font-bold">CateringKita</span>
            </div>

            {/* Headline - Changes based on mode */}
            <div className="overflow-hidden">
              <h1 
                className={`
                  text-4xl xl:text-5xl font-bold leading-tight mb-6 text-balance
                  transition-all duration-500 ease-in-out
                `}
              >
                {isSignup 
                  ? "Pesan Catering Berkualitas untuk Setiap Momen"
                  : "Nikmati Kemudahan Catering Terbaik"
                }
              </h1>
            </div>
            <p 
              className={`
                text-lg xl:text-xl text-white/80 mb-12 leading-relaxed max-w-lg
                transition-all duration-500 ease-in-out
              `}
            >
              {isSignup
                ? "Bergabunglah dengan ribuan pelanggan yang mempercayakan kebutuhan catering mereka kepada kami."
                : "Kami siap melayani kebutuhan catering Anda dengan menu lezat dan pelayanan prima."
              }
            </p>

            {/* Features */}
            <div className="space-y-6">
              <FeatureItem
                icon={<Shield className="h-5 w-5" />}
                title="Terjamin Kualitasnya"
                description="Makanan segar dengan bahan berkualitas"
              />
              <FeatureItem
                icon={<Clock className="h-5 w-5" />}
                title="Pengiriman Tepat Waktu"
                description="Pesanan sampai sesuai jadwal yang ditentukan"
              />
              <FeatureItem
                icon={<Star className="h-5 w-5" />}
                title="Layanan Terbaik"
                description="Dukungan pelanggan 24/7 untuk kebutuhan Anda"
              />
            </div>
          </div>
        </div>
      </div>

      {/* White Panel - Form Container */}
      <div
        ref={scrollContainerRef}
        className={`
          absolute inset-y-0 w-full lg:w-[55%] bg-card z-20 overflow-y-auto
          transition-all duration-700 ease-in-out
          ${isSignup 
            ? "lg:left-[45%] lg:rounded-l-[3rem]" 
            : "lg:left-0 lg:rounded-r-[3rem] lg:overflow-y-hidden"
          }
        `}
      >
        <div className="min-h-full flex items-center justify-center p-3 sm:p-4 lg:p-8 xl:p-12 py-6 lg:py-0">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">CateringKita</span>
            </div>

            {/* Form Content with Crossfade */}
            <div className="relative">
              {/* Customer Signup Form */}
              <div
                className={`
                  transition-all duration-500 ease-in-out
                  ${isCustomerSignup
                    ? "opacity-100 translate-x-0" 
                    : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
                  }
                `}
              >
                <div className="mb-2 mt-2 lg:mb-3 lg:mt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                    Buat Akun Baru
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
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
                    ? "opacity-100 translate-x-0" 
                    : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
                  }
                `}
              >
                <div className="mb-2 mt-2 lg:mb-3 lg:mt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                    Daftar Vendor
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
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
                    ? "opacity-100 translate-x-0" 
                    : "opacity-0 -translate-x-8 absolute inset-0 pointer-events-none"
                  }
                `}
              >
                <div className="mb-2 mt-2 lg:mb-3 lg:mt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                    Selamat Datang Kembali
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Masuk ke akun Anda untuk melanjutkan pemesanan
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
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-white/20 rounded-lg shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-white/70 text-sm">{description}</p>
      </div>
    </div>
  )
}

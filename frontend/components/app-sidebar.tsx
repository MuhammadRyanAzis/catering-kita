"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BadgeDollarSign,
  Building2,
  ChefHat,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Tags,
  Users,
  UtensilsCrossed,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { deleteCookies } from "@/helper/cookies"
import { UserRole } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type SidebarRole = UserRole | "GUEST"

type SidebarItem = {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  soon?: boolean
}

type SidebarSection = {
  label: string
  items: SidebarItem[]
}

const NAV_BY_ROLE: Record<SidebarRole, SidebarSection[]> = {
  ADMIN: [
    {
      label: "Utama",
      items: [
        { title: "Dashboard Admin", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Roadmap Halaman",
      items: [
        { title: "Manajemen Vendor", href: "/dashboard/vendors", icon: Building2 },
        { title: "Manajemen Customer", href: "/dashboard/customers", icon: Users },
        { title: "Kategori Menu", href: "/dashboard/categories", icon: Tags },
        { title: "Pembayaran", href: "/dashboard/payments", icon: BadgeDollarSign },
      ],
    },
  ],
  VENDOR: [
    {
      label: "Utama",
      items: [
        { title: "Dashboard Vendor", href: "/vendor/dashboard", icon: Store },
      ],
    },
    {
      label: "Roadmap Halaman",
      items: [
        { title: "Pesanan Masuk", href: "/vendor/orders", icon: ClipboardList },
        { title: "Kelola Menu", href: "/vendor/menus", icon: ChefHat },
        { title: "Ulasan Pelanggan", href: "/vendor/reviews", icon: MessageSquareText },
        { title: "Profil Vendor", href: "/vendor/profile", icon: Settings },
      ],
    },
  ],
  CUSTOMER: [
    {
      label: "Utama",
      items: [
        { title: "Dashboard Customer", href: "/customer/dashboard", icon: ShoppingCart },
      ],
    },
    {
      label: "Navigasi",
      items: [
        { title: "Pesanan Saya", href: "/customer/orders", icon: ClipboardList },
        { title: "Langganan", href: "/customer/subscriptions", icon: Sparkles },
        { title: "Riwayat Pembayaran", href: "/customer/payments", icon: BadgeDollarSign },
        { title: "Ulasan Saya", href: "/customer/reviews", icon: MessageSquareText },
        { title: "Profil", href: "/customer/profile", icon: Settings },
      ],
    },
  ],
  GUEST: [
    {
      label: "Akun",
      items: [
        { title: "Masuk", href: "/signin", icon: LayoutDashboard },
      ],
    },
  ],
}

const ROLE_ACCENT: Record<SidebarRole, {
  brand: string
  activeBg: string
  activeText: string
  activeBorder: string
  avatarBg: string
}> = {
  ADMIN: {
    brand: "bg-gradient-to-br from-indigo-500 to-purple-600",
    activeBg: "bg-indigo-50/80 dark:bg-indigo-500/10",
    activeText: "text-indigo-600 dark:text-indigo-400",
    activeBorder: "border-indigo-600 dark:border-indigo-400",
    avatarBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
  },
  VENDOR: {
    brand: "bg-gradient-to-br from-blue-500 to-cyan-600",
    activeBg: "bg-blue-50/80 dark:bg-blue-500/10",
    activeText: "text-blue-600 dark:text-blue-400",
    activeBorder: "border-blue-600 dark:border-blue-400",
    avatarBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
  },
  CUSTOMER: {
    brand: "bg-gradient-to-br from-emerald-500 to-teal-600",
    activeBg: "bg-emerald-50/80 dark:bg-emerald-500/10",
    activeText: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-emerald-600 dark:border-emerald-400",
    avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  GUEST: {
    brand: "bg-gradient-to-br from-slate-500 to-slate-700",
    activeBg: "bg-slate-100 dark:bg-slate-800",
    activeText: "text-slate-800 dark:text-slate-200",
    activeBorder: "border-slate-800 dark:border-slate-200",
    avatarBg: "bg-gradient-to-br from-slate-500 to-slate-700",
  },
}

const ROLE_LABEL: Record<SidebarRole, string> = {
  ADMIN: "Administrator",
  VENDOR: "Vendor Partner",
  CUSTOMER: "Pelanggan Setia",
  GUEST: "Pengunjung",
}

type SidebarUser = {
  name: string
  email: string
  initials: string
}

type ProfileResponse = {
  data?: {
    user?: {
      name?: string
      email?: string
    }
  }
  message?: string
}

const GUEST_USER: SidebarUser = {
  name: "Tamu",
  email: "",
  initials: "G",
}

function getInitials(name?: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const letters = parts.slice(0, 2).map((part) => part[0]).join("")
  return letters.toUpperCase() || "?"
}

function buildUser(name?: string, email?: string): SidebarUser {
  if (!name && !email) return GUEST_USER
  return {
    name: name || "Pengguna",
    email: email || "",
    initials: getInitials(name || email || ""),
  }
}

function getRoleFromStorage(): SidebarRole {
  if (typeof window === "undefined") return "GUEST"
  try {
    const rawUser = localStorage.getItem("user")
    if (!rawUser) return "GUEST"
    const parsed = JSON.parse(rawUser) as { role?: string }
    if (parsed.role === UserRole.ADMIN) return UserRole.ADMIN
    if (parsed.role === UserRole.VENDOR) return UserRole.VENDOR
    if (parsed.role === UserRole.CUSTOMER) return UserRole.CUSTOMER
    return "GUEST"
  } catch {
    return "GUEST"
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<SidebarRole>("GUEST")
  const [user, setUser] = useState<SidebarUser>(GUEST_USER)

  const handleLogout = useCallback(async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    await deleteCookies("token")
    await deleteCookies("user")
    setRole("GUEST")
    setUser(GUEST_USER)
    router.replace("/signin")
  }, [router])

  const handleSwitchAccount = useCallback(async () => {
    await handleLogout()
  }, [handleLogout])

  useEffect(() => {
    const nextRole = getRoleFromStorage()
    setRole(nextRole)

    if (typeof window === "undefined") return
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as { name?: string; email?: string }
        setUser(buildUser(parsed.name, parsed.email))
      } catch {
        setUser(GUEST_USER)
      }
    }
  }, [])

  useEffect(() => {
    if (role === "GUEST") return
    if (typeof window === "undefined") return

    const token = localStorage.getItem("token")
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!token || !baseUrl) return

    let isMounted = true

    const loadProfile = async () => {
      try {
        const response = await fetch(`${baseUrl}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          await handleLogout()
          return
        }

        const json = (await response.json()) as ProfileResponse
        if (!response.ok) {
          return
        }

        if (isMounted) {
          setUser(buildUser(json.data?.user?.name, json.data?.user?.email))
        }
      } catch {
        if (isMounted) {
          setUser((prev) => (prev.name ? prev : GUEST_USER))
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [handleLogout, role])

  const sections = useMemo(() => NAV_BY_ROLE[role], [role])
  const accent = ROLE_ACCENT[role]

  return (
    <Sidebar className="border-r border-border/50 bg-card/40 backdrop-blur-xl">
      {/* ── Header ── */}
      <SidebarHeader className="p-4 pb-2">
        <div className={cn(accent.brand, "rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5")}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UtensilsCrossed className="w-16 h-16 -mr-4 -mt-4 transform rotate-12" />
          </div>
          <div className="relative flex items-center gap-3 z-10">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white font-bold shadow-inner backdrop-blur-md border border-white/10">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-white/70 animate-pulse-glow" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  CateringKita
                </p>
              </div>
              <h2 className="truncate text-sm font-bold leading-tight mt-0.5 text-white drop-shadow-sm">
                {ROLE_LABEL[role]}
              </h2>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent className="px-3 py-2 space-y-4">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="px-0">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
              {section.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    !!item.href &&
                    (pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href + "/")))

                  return (
                    <SidebarMenuItem key={item.title}>
                      {item.href ? (
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            "group h-10 rounded-xl text-[13px] font-semibold transition-all duration-300",
                            isActive
                              ? cn(
                                  accent.activeBg,
                                  accent.activeText,
                                  accent.activeBorder,
                                  "border-l-4 rounded-l-md shadow-sm"
                                )
                              : item.soon
                              ? "cursor-default text-muted-foreground/40 hover:bg-transparent"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                          )}
                        >
                          <Link href={item.soon ? "#" : item.href} tabIndex={item.soon ? -1 : undefined} className="flex items-center gap-3 px-3 w-full">
                            <item.icon
                              className={cn(
                                "size-4 shrink-0 transition-all duration-300",
                                isActive
                                  ? "opacity-100 scale-110"
                                  : item.soon
                                  ? "opacity-30"
                                  : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                              )}
                            />
                            <span className="truncate flex-1">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          aria-disabled
                          tooltip={item.title}
                          className="h-10 cursor-default text-muted-foreground/40 flex items-center gap-3 px-3"
                        >
                          <item.icon className="size-4 shrink-0 opacity-30" />
                          <span className="truncate">{item.title}</span>
                        </SidebarMenuButton>
                      )}

                      {item.soon && (
                        <SidebarMenuBadge className="rounded-full border border-border/40 bg-muted/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground shadow-sm">
                          Segera
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer: User Card ── */}
      <SidebarFooter className="p-4">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-3 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                accent.avatarBg,
                "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-inner"
              )}
            >
              {user.initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight text-foreground">
                {user.name}
              </p>
              {user.email && (
                <p className="truncate text-xs leading-tight text-muted-foreground mt-0.5">
                  {user.email}
                </p>
              )}
            </div>

            <ChevronDown className="size-4 shrink-0 text-muted-foreground/50" />
          </div>

          {role === "GUEST" ? (
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
              onClick={() => router.push("/signin")}
            >
              Masuk / Daftar
            </button>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleSwitchAccount()}
                className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-accent hover:text-foreground hover:shadow-sm"
              >
                Ganti Akun
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground hover:shadow-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
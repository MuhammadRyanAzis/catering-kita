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
    brand: "bg-[#533AB7]",
    activeBg: "bg-[#EEEDFE]",
    activeText: "text-[#533AB7]",
    activeBorder: "border-l-[#7F77DD]",
    avatarBg: "bg-[#7F77DD]",
  },
  VENDOR: {
    brand: "bg-[#185FA5]",
    activeBg: "bg-[#E6F1FB]",
    activeText: "text-[#185FA5]",
    activeBorder: "border-l-[#378ADD]",
    avatarBg: "bg-[#378ADD]",
  },
  CUSTOMER: {
    brand: "bg-[#1D9E75]",
    activeBg: "bg-[#E1F5EE]",
    activeText: "text-[#0F6E56]",
    activeBorder: "border-l-[#1D9E75]",
    avatarBg: "bg-[#1D9E75]",
  },
  GUEST: {
    brand: "bg-sidebar-accent",
    activeBg: "bg-sidebar-accent",
    activeText: "text-sidebar-accent-foreground",
    activeBorder: "border-l-sidebar-accent-foreground",
    avatarBg: "bg-sidebar-accent",
  },
}

const ROLE_LABEL: Record<SidebarRole, string> = {
  ADMIN: "Admin",
  VENDOR: "Vendor",
  CUSTOMER: "Customer",
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
    <Sidebar>
      {/* ── Header ── */}
      <SidebarHeader className="p-3 pb-2">
        <div className={cn(accent.brand, "rounded-xl p-3 text-white")}>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-semibold">
              C
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-white/50" />
                <p className="text-[9px] font-semibold uppercase tracking-widest text-white/50">
                  CateringKita
                </p>
              </div>
              <h2 className="truncate text-[13.5px] font-semibold leading-tight">
                {ROLE_LABEL[role]}
              </h2>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent className="px-2 py-1">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="px-0">
            <SidebarGroupLabel className="px-2 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-sidebar-foreground/35">
              {section.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
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
                            "group h-9 rounded-lg text-[13px] font-medium transition-all duration-150",
                            isActive
                              ? cn(
                                  accent.activeBg,
                                  accent.activeText,
                                  accent.activeBorder,
                                  "border-l-2 rounded-l-none shadow-none"
                                )
                              : item.soon
                              ? "cursor-default text-sidebar-foreground/30 hover:bg-transparent hover:text-sidebar-foreground/30"
                              : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <Link href={item.soon ? "#" : item.href} tabIndex={item.soon ? -1 : undefined}>
                            <item.icon
                              className={cn(
                                "size-3.75 shrink-0 transition-opacity",
                                isActive
                                  ? "opacity-100"
                                  : item.soon
                                  ? "opacity-25"
                                  : "opacity-45 group-hover:opacity-70"
                              )}
                            />
                            <span className="truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          aria-disabled
                          tooltip={item.title}
                          className="h-9 cursor-default text-sidebar-foreground/25"
                        >
                          <item.icon className="size-3.75 shrink-0 opacity-25" />
                          <span className="truncate">{item.title}</span>
                        </SidebarMenuButton>
                      )}

                      {item.soon && (
                        <SidebarMenuBadge className="rounded-full border border-border/30 bg-muted/60 px-2 py-0 text-[9px] font-semibold tracking-wide text-muted-foreground/50">
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
      <SidebarFooter className="p-2">
        <div className="rounded-lg border border-sidebar-border/60 bg-sidebar/40 px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                accent.avatarBg,
                "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              )}
            >
              {user.initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-tight text-sidebar-foreground">
                {user.name}
              </p>
              {user.email && (
                <p className="truncate text-[10.5px] leading-tight text-sidebar-foreground/45">
                  {user.email}
                </p>
              )}
            </div>

            <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/30" />
          </div>

          {role === "GUEST" ? (
            <button
              type="button"
              className="mt-2 w-full rounded-md border border-sidebar-border/70 px-2.5 py-1.5 text-[11px] font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              onClick={() => router.push("/signin")}
            >
              Masuk
            </button>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleSwitchAccount()}
                className="rounded-md border border-sidebar-border/70 px-2.5 py-1.5 text-[11px] font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              >
                Ganti Akun
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-md border border-rose-200/60 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
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
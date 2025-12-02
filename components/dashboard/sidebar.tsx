"use client"

import Link from "next/link"
import { usePathname } from "next/navigation" // 👈 App Router hook
import {
  Home,
  ShoppingCart,
  Wallet,
  ClipboardList,
  AlertTriangle,
  FileText,
  MessageSquare,
  Users,
  X,
} from "lucide-react"

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingCart, label: "Products", href: "/dashboard/products" },
  { icon: Wallet, label: "Fund Wallet", href: "/dashboard/fund-wallet" },
  { icon: ClipboardList, label: "My Orders", href: "/dashboard/orders" },
  { icon: AlertTriangle, label: "Rules", href: "/dashboard/rules" },
  { icon: FileText, label: "Terms Of Use", href: "/dashboard/terms" },
  { icon: MessageSquare, label: "Verify SMS", href: "/dashboard/verify-sms" },
  { icon: Users, label: "Join Group 1", href: "#" },
  { icon: Users, label: "Join Group 2", href: "#" },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname() // 👈 get current path

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">YB</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-violet-600 leading-tight">Young</span>
              <span className="text-xs font-semibold text-violet-600 leading-tight">Blog</span>
              <span className="text-[10px] text-gray-500 leading-tight">Marketplace</span>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href !== "#" && pathname.startsWith(item.href) 

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "text-violet-600 bg-violet-50 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Help Center */}
        <div className="p-4">
          <div className="bg-linear-to-r from-violet-100 to-cyan-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Help Center</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">K</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">kuipid</p>
                <p className="text-xs text-gray-500">kuipid01@gmail.com</p>
              </div>
              <button className="p-2 hover:bg-white/50 rounded-lg">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

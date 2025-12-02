"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { ProductCard } from "./product-card"

const categories = ["All Categories", "Countries Facebook", "USA Facebook", "UK Facebook", "Nigeria Facebook"]

const products = [
  {
    id: 1,
    title:
      "Czech Republic FACEBOOK (30-5000 friend) ( market very good) (No 2fa ) | format uid|pass|email|pass email|cookie",
    price: 9353.0,
    stock: 1635,
    category: "Countries Facebook",
    inStock: true,
  },
  {
    id: 2,
    title:
      "EGYPT FACEBOOK ( 30+ friends) YEAR 2017-2023 (ACCOUNT LOCATION IN NIGERIA BUT HAS MANY FRIENDS OVERSEAS) | format uid|pass|2fa|email|pass email",
    price: 5845.0,
    stock: 0,
    category: "Countries Facebook",
    inStock: false,
  },
  {
    id: 3,
    title: "GERMANY FACEBOOK (50-500 friends) YEAR 2015-2022 | format uid|pass|email|pass email|cookie",
    price: 12500.0,
    stock: 842,
    category: "Countries Facebook",
    inStock: true,
  },
  {
    id: 4,
    title: "USA FACEBOOK (100+ friends) MARKETPLACE ENABLED | format uid|pass|2fa|email|pass email",
    price: 15000.0,
    stock: 256,
    category: "USA Facebook",
    inStock: true,
  },
]

export function DashboardContent() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 h-48 lg:h-56">
        <img src="/megaphone-announcement-marketing-blue-cyan.jpg" alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4">
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Telegram group
          </button>
        </div>
      </div>

      {/* Shop by Categories Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full max-w-2xl mx-auto bg-violet-600 hover:bg-violet-700 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
        >
          Shop by Categories
          <ChevronDown className={`w-5 h-5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setDropdownOpen(false)
                }}
                className={`w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedCategory === category ? "bg-violet-50 text-violet-600" : "text-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Products */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          Our Recent Products
          <span className="text-2xl">👌</span>
        </h2>

        {/* Category Header */}
        <div className="bg-violet-600 text-white px-6 py-3 rounded-t-xl font-medium">COUNTRIES FACEBOOK</div>

        {/* Products List */}
        <div className="bg-white rounded-b-xl shadow-sm divide-y divide-gray-100">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

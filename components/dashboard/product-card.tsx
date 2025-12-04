"use client"

import { ShoppingCart } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  inStock: boolean
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    })
      .format(price)
      .replace("NGN", "₦")
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center gap-4">
      {/* Facebook Icon */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-relaxed">{product.name}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-violet-600 text-white text-xs px-3 py-1 rounded-md font-medium">
            {formatPrice(product.price)}
          </span>
          <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-md font-medium">{product.stock}pcs</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0">
        {product.inStock ? (
          <button className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-xl transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </button>
        ) : (
          <button
            disabled
            className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-not-allowed opacity-80"
          >
            Not in stock
          </button>
        )}
      </div>
    </div>
  )
}

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { ProductCard } from "./product-card";
// Assuming ProductType is imported correctly
import { ProductType } from "../../lib/schema";
import { toast } from "sonner";

// --- START: New Skeleton Component ---
const ProductCardSkeleton = () => (
  <div className="flex items-center justify-between p-4 animate-pulse">
    <div className="flex items-center gap-4">
      {/* Flag/Icon Skeleton */}
      <div className="w-8 h-6 bg-gray-200 rounded-sm"></div>

      <div className="space-y-2">
        {/* Title Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        {/* Subtitle/Category Skeleton */}
        <div className="h-3 bg-gray-100 rounded w-32"></div>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="space-y-2 text-right">
        {/* Price Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        {/* Stock Status Skeleton */}
        <div className="h-3 bg-gray-100 rounded w-20"></div>
      </div>
      {/* Buy Button Skeleton */}
      <div className="w-16 h-8 bg-violet-200 rounded-full"></div>
    </div>
  </div>
);
// --- END: New Skeleton Component ---

const categories = [
  "All Categories",
  "Countries Facebook",
  "USA Facebook",
  "UK Facebook",
  "Nigeria Facebook",
];

// Define how many skeleton items to show (e.g., 5 cards)
const SKELETON_COUNT = 5;

export function DashboardContent() {
  // We use `null` initially to distinguish between 'not loaded' and 'empty array'
  const [products, setProducts] = useState<ProductType[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Kept for explicit control

  // 1. Optimization: Memoize data fetching function using useCallback
  const getProducts = useCallback(async () => {
 
    try {
      const res = await fetch("/api/products", { method: "GET" });
      const data = await res.json();

      // console.log("data from caller", data);

      if (!res.ok) {
        toast.error(data.message || "Failed to fetch products.");
        setProducts([]); // Set to empty array on error
        return;
      }

      setProducts(data.data);
    } catch (error) {
      toast.error("An unexpected error occurred while loading products.");
      setProducts([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Recreate if `products` changes from null to array

  useEffect(() => {
    getProducts();
  }, [getProducts]); // Dependency array includes the memoized function

  // 2. Improvement: Implement product filtering logic
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    if (selectedCategory === "All Categories") {
      return products;
    }

    // Assuming product objects have a 'category' field matching the categories list
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const currentCategoryDisplay = selectedCategory.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 h-48 lg:h-56">
        <img
          src="/megaphone-announcement-marketing-blue-cyan.jpg"
          alt="Banner"
          className="w-full h-full object-cover"
        />
      
      </div>
  

      {/* Shop by Categories Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full max-w-2xl mx-auto bg-violet-600 hover:bg-violet-700 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
        >
          {selectedCategory}
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setDropdownOpen(false);
                }}
                className={`w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedCategory === category
                    ? "bg-violet-50 text-violet-600 font-semibold"
                    : "text-gray-700"
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
          {selectedCategory === "All Categories"
            ? "All Products"
            : currentCategoryDisplay}
          <span className="text-2xl">👌</span>
        </h2>

        {/* Category Header (Using the selected category for display) */}
        <div className="bg-violet-600 text-white px-6 py-3 rounded-t-xl font-medium">
          {currentCategoryDisplay}
        </div>

        {/* Products List (with Skeleton Loader) */}
        <div className="bg-white rounded-b-xl shadow-sm divide-y divide-gray-100 min-h-[300px]">
          {/* SKELETON LOADER IMPLEMENTATION */}
          {isLoading && products === null ? (
            // Show skeleton loaders when loading for the first time
            Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : filteredProducts.length > 0 ? (
            // Show filtered products
            filteredProducts.map((product) => {
              // 3. Optimization: Clean up data manipulation inside map
              const formattedProduct = {
                ...product,
                price: Number(product.price),
                stock: Number(product.stock),
                inStock: Number(product.stock) > 5,
              };
              return (
                <ProductCard key={product.id} product={formattedProduct} />
              );
            })
          ) : (
            // Show empty state
            <div className="text-center py-10 text-gray-500">
              No products found for {selectedCategory}.
            </div>
          )}
        </div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
          <svg
            className="w-7 h-7 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

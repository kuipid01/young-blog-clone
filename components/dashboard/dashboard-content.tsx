"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { ProductCard } from "./product-card";
// Assuming ProductType is imported correctly
import { ProductType } from "../../lib/schema";
import { toast } from "sonner";
import { useFetchProductsAndCategories } from "../../app/shopclone/products";
import { set } from "react-hook-form";
import ProductsAndCatgories, { Category } from "../products-and-categories";

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
  // console.log(productsAndCategories, "api response");
  // We use `null` initially to distinguish between 'not loaded' and 'empty array'
  const [products, setProducts] = useState<ProductType[] | null>(null);
  const [productsAndCategories, setProductsAndCategories] = useState<
    Category[] | null
  >(null);
  const [allCategories, setAllCategories] = useState<Category[] | null>(null);
  const [distinctCategories, setDistinctCategories] = useState<
    { name: string }[] | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Kept for explicit control

  // 1. Optimization: Memoize data fetching function using useCallback
  const getProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products", { method: "GET" });
      const res2 = await fetch("/api/shop-products", { method: "GET" });
      const data = await res.json();
      const data2 = await res2.json();
      console.log(data2);
      // console.log("data from caller", data);

      if (!res.ok) {
        toast.error(data.message || "Failed to fetch products.");
        setProducts([]); // Set to empty array on error
        return;
      }
      const categories = data2.categories.map((cat: { name: string }) => ({
        name: cat.name,
      }));
      categories.unshift({ name: "All Categories" });
      setDistinctCategories(categories);
      setProductsAndCategories(data2.categories);
      setAllCategories(data2.categories);
      localStorage.setItem(
        "shopProducts",
        JSON.stringify(
          data2.categories.flatMap((cat: { products: any }) => cat.products)
        )
      );
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

  useEffect(() => {
    // 1. Handle the "All Categories" case directly
    if (selectedCategory === "All Categories") {
      // Reset the displayed data to the full list
      setProductsAndCategories(allCategories);
      return;
    }

    // 2. Filter the original data based on the selection
    const filteredCategories = allCategories?.filter(
      (category) => category.name === selectedCategory
    );

    // 3. Update the state with the filtered list
    setProductsAndCategories(filteredCategories || []);
  }, [selectedCategory, allCategories, setProductsAndCategories]);

  console.log("products and categories", productsAndCategories);

  const currentCategoryDisplay = selectedCategory.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-linear-to-r from-gray-200 to-gray-300 h-48 lg:h-56">
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
            {distinctCategories?.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setSelectedCategory(category.name);
                  setDropdownOpen(false);
                }}
                className={`w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedCategory === category.name
                    ? "bg-violet-50 text-violet-600 font-semibold"
                    : "text-gray-700"
                }`}
              >
                {category.name}
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
        </h2>

        {/* Category Header (Using the selected category for display) */}
        <div className="bg-violet-600 text-white px-6 py-3 rounded-t-xl font-medium">
          {currentCategoryDisplay}
        </div>

        <ProductsAndCatgories
          categories={productsAndCategories}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

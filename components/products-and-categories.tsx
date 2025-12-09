import { ShoppingCart } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserWallet } from "../app/utils/get-wallet";
import { PurchaseConfirmModal } from "./product-confirm-modal";
import { getNigerianPrice } from "../app/utils/get-nigerian-price";

type Product = {
  id: string;
  name: string;
  price: string;
  amount: number;
  description: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  products: Product[];
};

type Props = {
  categories: Category[] | null;
  loading?: boolean;
};

const ProductsAndCategories: React.FC<Props> = ({
  categories,
  loading = false,
}) => {
  const [convertedPrices, setConvertedPrices] = useState<
    Record<string, string>
  >({});

  const [product, setProduct] = useState<any>(null);
  const skeletonArray = Array.from({ length: 4 });
  const { wallet, loading: fetchingWallet, refetchWallet } = useUserWallet();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Convert all prices on mount
    const convertPrices = async () => {
      if (!categories) return;
      const prices: Record<string, string> = {};

      for (const category of categories) {
        for (const product of category.products) {
          const response = await fetch("/api/convert-prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usdPrice: Number(product.price) }),
          });
          const { ngnPrice } = await response.json();
          prices[product.id] = ngnPrice;
        }
      }

      setConvertedPrices(prices);
    };

    convertPrices();
  }, [categories]);
  // console.log(convertedPrices, "converted prices");

  if (loading) {
    // Show skeleton loaders
    return (
      <div className="p-6 md:p-8 bg-white rounded-xl shadow-lg space-y-8">
        {skeletonArray.map((_, index) => (
          <div
            key={index}
            className="border border-gray-100 rounded-lg p-4 animate-pulse"
          >
            <div className="flex items-center pb-3 mb-4 border-b border-gray-200">
              <div className="w-6 h-6 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {skeletonArray.map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg shadow-sm flex flex-col space-y-2"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-24 mt-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 self-end mt-1"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No categories or products available.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-white rounded-xl shadow-lg">
      <div className="space-y-8">
        {categories.map((category) => (
          <section
            key={category.id}
            className="border border-gray-100 rounded-lg p-4 transition duration-300 hover:shadow-md"
          >
            {/* Category Header */}
            <header className="flex items-center pb-3 mb-4 border-b border-gray-200">
              <div className="p-2 mr-3 bg-indigo-50 rounded-full">
                <img
                  src={category.icon}
                  alt={`${category.name} icon`}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <h2 className="text-xl font-extrabold text-indigo-700 tracking-wide">
                {category.name}
              </h2>
              <span className="ml-3 text-sm font-medium text-gray-500">
                ({category.products.length} Items)
              </span>
            </header>

            {/* Products List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {category.products?.map((product) => {
                const isOutOfStock = product.amount <= 0;
                const priceValue = convertedPrices?.[product.id];

                const productPriceNgn =
                  priceValue !== undefined ? Number(priceValue) : 0;
                return (
                  <article
                    key={product.id}
                    className={`p-4 border rounded-lg shadow-sm transition duration-200 flex flex-col justify-between
                      ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:shadow-md"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      {/* Name and Price */}
                      <div>
                        <h3
                          className={`text-base font-semibold leading-tight ${
                            isOutOfStock ? "text-gray-400" : "text-gray-800"
                          }`}
                        >
                          {product.name}
                        </h3>
                        <span
                          className={`text-lg font-bold mt-1 block ${
                            isOutOfStock ? "text-gray-400" : "text-green-600"
                          }`}
                        >
                          <span>
                            ₦
                            {productPriceNgn === 0
                              ? "..."
                              : Number(productPriceNgn).toFixed(2)}
                          </span>
                        </span>
                      </div>

                      {/* Buy Button */}
                      <button
                        onClick={() => {
                          if (isOutOfStock) return;

                          refetchWallet();
                          if (
                            parseFloat(wallet?.walletBalance) >
                            Number(productPriceNgn)
                          ) {
                            setOpen(true);
                            setProduct({ ...product, price: productPriceNgn });
                          } else {
                            toast.error(
                              "Please fund your account to make purchase"
                            );
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`flex items-center text-nowrap space-x-1 px-3 py-2 text-sm font-medium rounded-full shadow-md transition duration-150
                          ${
                            isOutOfStock
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                      >
                        <ShoppingCart size={14} />
                        <span>Buy Now</span>
                      </button>
                    </div>

                    {/* Description */}
                    <p
                      className={`text-sm mt-1 line-clamp-2 ${
                        isOutOfStock ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {product.description}
                    </p>

                    {/* Stock Info */}
                    <div className="mt-2 text-xs text-right">
                      <span
                        className={`font-medium ${
                          isOutOfStock ? "text-red-400" : "text-green-500"
                        }`}
                      >
                        {product.amount} in stock
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {category.products.length === 0 && (
              <p className="text-center text-gray-400 italic p-4">
                No products found in this category.
              </p>
            )}
          </section>
        ))}
      </div>
      <PurchaseConfirmModal open={open} setOpen={setOpen} product={product} />
    </div>
  );
};

export default ProductsAndCategories;

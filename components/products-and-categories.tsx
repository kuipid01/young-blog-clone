import { ShoppingCart } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUserWallet } from "../app/utils/get-wallet";
import { PurchaseConfirmModal } from "./product-confirm-modal";
import useRateStore from "../app/stores/conversion-store";
import useWalletStore from "../app/stores/wallet-stores";

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
  const { wallet, loading: fetchingWallet, refetchWallet } = useUserWallet();
  const { rate } = useRateStore();
  const { setWalletBalance } = useWalletStore();

  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<any>(null);

  /** --------------------------------------------------
   * Convert product prices using `rate`
   * -------------------------------------------------- */
  const convertedPrices = useMemo(() => {
    if (!categories || !rate) return {};

    const prices: Record<string, string> = {};

    categories.forEach((category) => {
      category.products.forEach((product) => {
        const base = Number(product.price) * rate;
        //TODO MOVE MARKUP TO ENV
        const markup = base * 0.65;
        prices[product.id] = (base + markup).toFixed(2);
      });
    });

    return prices;
  }, [categories, rate]);

  /** --------------------------------------------------
   * Show skeleton if loading
   * -------------------------------------------------- */
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center pb-3 mb-4 border-b">
              <div className="w-6 h-6 bg-gray-200 rounded-full mr-3"></div>
              <div className="w-32 h-5 bg-gray-200 rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="p-4 border rounded-lg shadow-sm space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-24 mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  /** --------------------------------------------------
   * No categories
   * -------------------------------------------------- */
  if (!categories?.length) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No categories or products available.
      </div>
    );
  }

  /** --------------------------------------------------
   * Component UI
   * -------------------------------------------------- */
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {categories.map((category) => (
        <section
          key={category.id}
          className="border p-4 rounded-lg mb-8 hover:shadow transition"
        >
          {/* Category Header */}
          <header className="flex items-center pb-3 mb-4 border-b">
            <div className="p-2 mr-3 bg-indigo-50 rounded-full">
              <img
                src={category.icon}
                alt={category.name}
                className="w-6 h-6 object-contain"
              />
            </div>
            <h2 className="text-xl font-extrabold text-indigo-700">
              {category.name}
            </h2>
            <span className="ml-3 text-sm text-gray-500">
              ({category.products.length} items)
            </span>
          </header>

          {/* Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {category.products.map((product) => {
              const isOut = product.amount <= 0;
              const price = convertedPrices[product.id];

              return (
                <article
                  key={product.id}
                  className={`p-4 border rounded-lg shadow-sm flex flex-col justify-between 
                    ${isOut ? "opacity-50" : "hover:shadow-md"} transition`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold">{product.name}</h3>
                      <span className="text-lg font-bold text-green-600 block">
                        ₦{price ?? "..."}
                      </span>
                    </div>

                    <button
                      disabled={isOut}
                      className={`px-3 py-2 rounded-full text-sm flex items-center space-x-1
                        ${isOut
                          ? "bg-gray-300 text-gray-500"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      onClick={async () => {
                        if (!rate) return toast.error("Rate unavailable.");

                        await refetchWallet();

                        const priceN = Number(price);
                        if (Number(wallet?.walletBalance) < priceN) {
                          return toast.error("Insufficient wallet balance.");
                        }

                        setWalletBalance(wallet.walletBalance);
                        setProduct({ ...product, price: priceN });
                        setOpen(true);
                      }}
                    >
                      <ShoppingCart size={14} />
                      <span className=" text-nowrap">Buy Now</span>
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="text-xs text-right mt-2 text-green-500">
                    {product.amount} in stock
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <PurchaseConfirmModal open={open} setOpen={setOpen} product={product} />
    </div>
  );
};

export default ProductsAndCategories;

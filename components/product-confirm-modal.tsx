"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Product } from "./dashboard/product-card";
import { Loader2, CheckCircle, Package, Copy, Minus, Plus } from "lucide-react"; // Added icons
import { Separator } from "@/components/ui/separator"; // Assuming you have this Shadcn component
import useWalletStore from "../app/stores/wallet-stores";

// Define a minimal Order structure for better type safety
interface Order {
  id: string;
  logId: string;
  totalPrice: string;
  log?: {
    logDetails: string;
    // ... potentially other log fields
  };
  data: string[]; // In case multiple logs are returned
}

interface PurchaseConfirmModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  product: Product;
}

export function PurchaseConfirmModal({
  open,
  setOpen,
  product,
}: PurchaseConfirmModalProps) {

  if (!product) return null;

  const { setWalletBalance, walletBalance } = useWalletStore();
  // Use the new Order interface
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  // Reset state when the dialog is opened for a new purchase attempt
  useEffect(() => {
    if (open) {
      setOrder(null);
      setQuantity(1);
    }
  }, [open]);

  const increment = () => {
    console.log("Incrementing quantity...", product);
    if (quantity < product.amount) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    let previousBalance = walletBalance;
    const totalCost = Number(product.price) * quantity;

    try {
      if (walletBalance === undefined || walletBalance === null) {
        return;
      }

      if (walletBalance < totalCost) {
        toast.error("Insufficient wallet balance for this quantity.");
        setLoading(false);
        return;
      }

      setWalletBalance(walletBalance - totalCost);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required. Redirecting to login.");
        router.push("/auth/login");
        return;
      }

      let userId: string;

      try {
        const decoded: { id: string; exp?: number } = jwtDecode(token);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          toast.error("Session expired. Please log in again.");
          router.push("/auth/login");
          return;
        }

        userId = decoded.id;
      } catch (err) {
        // This catches malformed token or other jwtDecode errors
        console.error("Token decoding error:", err);
        toast.error("Invalid session data. Please log in.");
        router.push("/auth/login");
        return;
      }
      // Create FormData
      const formData = new FormData();
      formData.append("action", "buyProduct");
      formData.append("id", product.id);
      formData.append("amount", quantity.toString());
      //call external api then use data returned to create order with log id
      const externalRes = await fetch("/api/shop-products/buy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData, // Send FormData directly
      });
      if (!externalRes.ok) {
        const errorData = await externalRes.json();
        toast.error(errorData.message || "Purchase failed at external API.");
        return;
      }
      const externalData = await externalRes.json();
      console.log("External API response data:", externalData);
      // ---- API CALL ----
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use 'Authorization' header for the API call
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          productId: product.id,
          quantity: quantity,
          status: externalData.status.toString(),
          trans_id: externalData.trans_id.toString(),
          data: externalData.data,
          price: product.price.toString(),
          stock: quantity.toString(),
        }),
      });

      const data = await res.json();

      // Check for success key or standard failure (res.ok is false)
      if (!res.ok || data.success === false) {
        toast.error(data.message || "Order failed due to an unknown error.");
        return;
      }

      // 1. Destructure the 'order' object (which now includes the log) and message
      const { order: finalOrder, message } = data;

      // 2. Set the state with the final order data
      setOrder(finalOrder);

      // 3. Use the message for the toast (clearer message for the user)
      toast.success(message || "Order created and log successfully assigned!", {
        description: `Order ID: ${finalOrder.id}. Log details are now available.`,
      });
    } catch (error) {
      if (previousBalance) {
        setWalletBalance(previousBalance);
      } else {
        console.log("BUG HERE");
      }

      console.error(error);
      toast.error("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Optional: Refresh the dashboard/product list if stock needs to update immediately
    // router.refresh();
  };

  // --- Rendering Logic ---
  const handleCopy = () => {
    navigator.clipboard
      .writeText(order?.data.join("") || order?.log?.logDetails || "")
      .then(() => {
        toast.success("Log copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy log.");
      });
  };
  const logDetails = order?.log?.logDetails || order?.data[0] || "";
  // Renders the content after a successful order
  const renderSuccessView = () => (
    <div className="space-y-4 sm:max-w-[425px]  pt-2 text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
      <h2 className="text-xl font-bold">Order Successful!</h2>
      <p className="text-sm text-muted-foreground">
        Order <strong className="font-mono">{order?.id}</strong> is complete. A
        log has been assigned to your purchase.
      </p>

      <Separator />

      <div className="text-left  bg-gray-50 dark:bg-gray-800 p-4 rounded-md space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold flex items-center gap-2 text-primary/80">
            <Package className="w-4 h-4" /> Log Details:
          </h1>

          {/* 📋 The Copy Button */}
          <button
            onClick={handleCopy}
            aria-label="Copy log details"
            className="p-1 cursor-pointer rounded-md text-primary/60 hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm font-mono text-wrap break-all  text-gray-700 dark:text-gray-300">
          {logDetails}{" "}
        </p>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        You can view this log and more order information on the Orders page.
      </p>
    </div>
  );

  // Renders the initial confirmation prompt
  const renderConfirmationView = () => (
    <div className="space-y-4">
      <p className="text-base text-gray-700 dark:text-gray-300">
        Are you sure you want to purchase{" "}
        <strong className="text-primary mx-1">{product.name}</strong>?
      </p>

      {/* Quantity Selector */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={decrement}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-bold w-4 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={increment}
            disabled={quantity >= product.amount}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center border-t pt-2">
        <span className="text-sm text-gray-500">Unit Price:</span>
        <span className="font-medium">₦{product.price}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-base font-bold">Total Cost:</span>
        <strong className="text-xl text-green-600 dark:text-green-400">
          ₦{(Number(product.price) * quantity).toFixed(2)}
        </strong>
      </div>

      <p className="text-sm text-orange-500">
        This action will debit your wallet and assign available logs.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {order ? "Purchase Confirmed" : "Confirm Purchase"}
          </DialogTitle>
        </DialogHeader>

        {/* Display Success View or Confirmation View */}
        {order ? renderSuccessView() : renderConfirmationView()}

        <DialogFooter className="mt-4">
          {/* Cancel/Done Button */}
          <Button
            variant={order ? "default" : "ghost"}
            onClick={handleClose}
            disabled={loading}
          >
            {order ? "Done" : "Cancel"}
          </Button>

          {/* Confirm/Processing Button - Hide once successful */}
          {!order && (
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

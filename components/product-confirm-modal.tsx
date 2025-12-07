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
import { Loader2, CheckCircle, Package } from "lucide-react"; // Added icons
import { Separator } from "@/components/ui/separator"; // Assuming you have this Shadcn component

// Define a minimal Order structure for better type safety
interface Order {
  id: string;
  logId: string;
  totalPrice: string;
  log?: {
    logDetails: string;
    // ... potentially other log fields
  };
}

interface PurchaseConfirmModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  product: Product;
}

export function PurchaseConfirmModal({ open, setOpen, product }: PurchaseConfirmModalProps) {
  // Use the new Order interface
  const [order, setOrder] = useState<Order | null>(null); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Reset state when the dialog is opened for a new purchase attempt
  useEffect(() => {
    if (open) {
      setOrder(null);
    }
  }, [open]);


  const handleConfirm = async () => {
    setLoading(true);

    try {
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
          quantity: 1, // Assuming quantity is 1 for log purchases
        }),
      });
      
      const data = await res.json();

      // Check for success key or standard failure (res.ok is false)
      if (!res.ok || (data.success === false)) {
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
  }

  // --- Rendering Logic ---

  // Renders the content after a successful order
  const renderSuccessView = () => (
    <div className="space-y-4 pt-2 text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
      <h2 className="text-xl font-bold">Order Successful!</h2>
      <p className="text-sm text-muted-foreground">
        Order <strong className="font-mono">{order?.id}</strong> is complete. A log has been assigned to your purchase.
      </p>

      <Separator />

      <div className="text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-md space-y-2">
        <h1 className="text-lg font-semibold flex items-center gap-2 text-primary/80">
            <Package className="w-4 h-4" /> Log Details:
        </h1>
        <p className="text-sm font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {order?.log?.logDetails || "Log details not available."}
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
        Are you sure you want to purchase 
        <strong className="text-primary mx-1">{product.name}</strong> 
        for <strong className="text-green-600 dark:text-green-400">₦{product.price}</strong>?
      </p>
      <p className="text-sm text-orange-500">
        This action will debit your wallet and assign an available log.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
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
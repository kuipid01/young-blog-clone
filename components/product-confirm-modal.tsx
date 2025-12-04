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
import { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Product } from "./dashboard/product-card";

export function PurchaseConfirmModal({
  open,
  setOpen,
  product,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  product: Product;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please log in.");
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
        console.error("Token error:", err);
        toast.error("Invalid session. Please log in.");
        router.push("/auth/login");
        return;
      }

      // ---- API CALL ----
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          productId: product.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Order failed");
        return;
      }

      toast.success("Order created successfully!");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-700">
          Are you sure you want to order <strong>{product.name}</strong>?
        </p>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

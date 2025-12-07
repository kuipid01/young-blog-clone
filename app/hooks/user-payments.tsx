import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useGetLoggedInUserId } from "../utils/getloggedinuser";

interface Payment {
  id: string;
  amount: number;
  createdAt: string;

  paymentType: "bank_transfer" | "another";
  proof: string;
  status: "funded" | "non_funded";

}

export function usePayments() {
  const { userId } = useGetLoggedInUserId();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getPayments = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/payments/${userId}`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        // toast.error(data.message || "Failed to fetch payments.");
        setPayments([]); // Reset on error
        return;
      }
      setPayments(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("An unexpected error occurred while loading payments.");
      setPayments([]); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch payments on hook usage
  useEffect(() => {
    if (!userId) return;
    getPayments();
  }, [userId, getPayments]);

  return { payments, isLoading, getPayments };
}

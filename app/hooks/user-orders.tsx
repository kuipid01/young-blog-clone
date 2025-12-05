"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useGetLoggedInUserId } from "../utils/getloggedinuser";

export function useUserOrders() {
  const { userId } = useGetLoggedInUserId();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    const controller = new AbortController();

    try {
      const res = await fetch(`/api/orders/${userId}`, {
        method: "GET",
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to fetch orders.");
        setOrders([]);
        return;
      }

      setOrders(data);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("An unexpected error occurred while loading orders.");
        setOrders([]);
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [userId]);

  // auto-fetch when userId becomes available
  useEffect(() => {
    if (!userId) return;
    fetchOrders();
  }, [userId, fetchOrders]);

  return {
    orders,
    isLoading,
    reloadOrders: fetchOrders, // manually refetch if needed
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useUserWallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchWallet = useCallback(async () => {
    setLoading(true);

    const token = typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

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
      console.error("Token decoding failed:", err);
      localStorage.removeItem("token");
      toast.error("Invalid session data. Please log in.");
      router.push("/auth/login");
      return;
    }

    try {
      const res = await fetch(`/api/wallet/${userId}`);

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to fetch wallet.");
        setWallet(null);
        return;
      }

      setWallet(data);
    } catch (err) {
      toast.error("Unexpected error loading wallet.");
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {
    wallet,
    loading,
    refetchWallet: fetchWallet,
  };
}

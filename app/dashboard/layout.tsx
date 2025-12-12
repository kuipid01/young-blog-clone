"use client";

import { useCallback, useEffect, useRef } from "react";
import useWalletStore from "../stores/wallet-stores";
import useRateStore from "../stores/conversion-store";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
  const setRateState = useRateStore((s) => s.setRateState);
  const router = useRouter();

  // Prevent double-fetch (React strict mode)
  const initialized = useRef(false);

  /** ------------------------------
   * Validate token and extract userId
   * -------------------------------*/
  const getValidUserId = useCallback((): string | null => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Authentication expired. Please log in.");
      router.push("/auth/login");
      return null;
    }

    try {
      const decoded: { id: string; exp?: number } = jwtDecode(token);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        router.push("/auth/login");
        return null;
      }

      return decoded.id;
    } catch (error) {
      console.error("Token decode failed:", error);
      localStorage.removeItem("token");
      toast.error("Invalid session data. Please log in.");
      router.push("/auth/login");
      return null;
    }
  }, [router]);

  /** ------------------------------
   * Fetch Wallet Balance
   * -------------------------------*/
  const fetchWallet = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/wallet/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Failed to fetch wallet.");
          return;
        }

        setWalletBalance(data.walletBalance);
      } catch (error) {
        console.error("Wallet fetch error:", error);
        toast.error("An error occurred while loading wallet.");
      }
    },
    [setWalletBalance]
  );

  /** ------------------------------
   * Fetch Conversion Rate
   * -------------------------------*/
  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch("/api/get-rate");
      const { rate } = await res.json();
      setRateState(Number(rate));
    } catch (error) {
      console.error("Rate fetch error:", error);
      toast.error("Failed to fetch conversion rate.");
    }
  }, [setRateState]);

  /** ------------------------------
   * Initialize App Data on Mount
   * -------------------------------*/
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const userId = getValidUserId();
    if (!userId) return;

    fetchWallet(userId);
    fetchRate();
  }, [getValidUserId, fetchWallet, fetchRate]);

  return <>{children}</>;
}

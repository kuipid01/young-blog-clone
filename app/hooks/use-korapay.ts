"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface KoraFundingData {
  amount: number;
  currency: string;
  reference: string;
  customer: {
    email: string;
    name: string;
  };
  metadata: {
    user_id: string;
  };
  merchant_bears_cost: boolean;
  redirect_url?: string;
}

export const useKoraPay = () => {
  const [isInitiating, setIsInitiating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const initiateKoraFunding = useCallback(async (fundingData: KoraFundingData) => {
    setIsInitiating(true);
    try {
      const response = await fetch("/api/korapay/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fundingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to initialize KoraPay charge");
      }

      if (result.status && result.data.checkout_url) {
        toast.success("Redirecting to payment gateway...");
        window.location.href = result.data.checkout_url;
      }
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown funding error.";
      toast.error(errorMessage);
      console.error("KoraPay Funding Initiation Failed:", error);
      return null;
    } finally {
      setIsInitiating(false);
    }
  }, []);

  const verifyPayment = useCallback(async (reference: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/korapay/verify?reference=${reference}`);
      const result = await res.json();
      if (res.ok && result.status === true && result.data.status === "success") {
        setIsSuccess(true);
        // Optionally clear the query param from URL without refreshing
        const url = new URL(window.location.href);
        url.searchParams.delete("reference");
        window.history.replaceState({}, "", url.pathname);
        return true;
      } else {
        console.error("Payment verification failed", result);
        return false;
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return {
    initiateKoraFunding,
    verifyPayment,
    isInitiating,
    isVerifying,
    isSuccess,
    setIsSuccess,
  };
};

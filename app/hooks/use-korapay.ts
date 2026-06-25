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

    const poll = async (ref: string, attempt = 0): Promise<boolean> => {
      if (attempt >= 5) { 
        toast.info("Transaction is still processing. You can safely leave this page; your wallet will be credited automatically once confirmed.");
        return false;
      }

      try {
        const res = await fetch(`/api/korapay/verify?reference=${ref}`);
        const result = await res.json();

        if (res.ok && result.status === true) {
          const koraStatus = result.data.status;

          if (koraStatus === "success") {
            setIsSuccess(true);
            // Optionally clear the query param from URL without refreshing
            const url = new URL(window.location.href);
            url.searchParams.delete("reference");
            window.history.replaceState({}, "", url.pathname);
            return true;
          } else if (koraStatus === "processing") {
            console.log("Processing this shii")
            // Wait 3 seconds and retry
            await new Promise((resolve) => setTimeout(resolve, 3000));
            return poll(ref, attempt + 1);
          }
        }
        console.error("Payment verification failed", result);
        return false;
      } catch (error) {
        console.error("Error verifying payment:", error);
        return false;
      }
    };

    const finalResult = await poll(reference);
    setIsVerifying(false);
    return finalResult;
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

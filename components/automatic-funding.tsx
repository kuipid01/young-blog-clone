"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useKoraPay } from "../app/hooks/use-korapay";
import { useGetLoggedInUser } from "../app/hooks/use-get-logged-in-user";
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from "./custom-modal";

export function AutomaticFundingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedAmount = searchParams.get("amount") || "0";
  const reference = searchParams.get("reference");

  const { 
    initiateKoraFunding, 
    verifyPayment, 
    isInitiating, 
    isVerifying, 
    isSuccess,
    setIsSuccess
  } = useKoraPay();
  
  const { user } = useGetLoggedInUser() as any;
  const [userWallet, setuserWallet] = useState<any>(null);

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/wallet/${user.id}`);
      const data = await res.json();
      if (res.ok) setuserWallet(data);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (reference && !isVerifying && !isSuccess) {
      verifyPayment(reference);
    }
  }, [reference, verifyPayment, isVerifying, isSuccess]);

  const handlePayNow = async () => {
    if (!user?.id || !user?.email) {
      toast.error("User session data is missing.");
      return;
    }

    const amount = Number(requestedAmount);
    if (amount < 100) {
      toast.error("Minimum funding amount is ₦100.");
      return;
    }

    const trxRef = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const koraFundingData = {
      amount,
      currency: "NGN",
      reference: trxRef,
      customer: {
        email: user.email,
        name: userWallet?.firstName ? `${userWallet.firstName} ${userWallet.lastName}` : user.email,
      },
      metadata: {
        user_id: user.id,
      },
      merchant_bears_cost: true,
      redirect_url: window.location.href // Redirect back to this page
    };

    await initiateKoraFunding(koraFundingData);
  };

  const amountDisplay = Number(requestedAmount).toLocaleString("en-US", {
    style: "currency",
    currency: "NGN",
  });

  return (
    <div className="flex flex-col items-center p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Automatic Wallet Funding</h1>
          <p className="text-gray-500">Pay securely using Card, USSD, or Bank Transfer</p>
        </div>

        <div className="bg-violet-50 rounded-2xl p-8 border border-violet-100 text-center">
          <p className="text-sm text-violet-600 font-medium mb-1">Amount to Pay</p>
          <h2 className="text-4xl font-extrabold text-violet-900">{amountDisplay}</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Instant Activation</h3>
              <p className="text-sm text-gray-500">Your wallet will be funded automatically once payment is successful.</p>
            </div>
          </div>

          <button
            onClick={handlePayNow}
            disabled={isInitiating || isVerifying || isSuccess}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-bold text-lg hover:from-violet-700 hover:to-purple-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isInitiating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Initiating...
              </>
            ) : isVerifying ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Verifying Payment...
              </>
            ) : (
              "PAY NOW"
            )}
          </button>
          
          <button 
            onClick={() => router.push('/dashboard/fund-wallet')}
            className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <CustomModal open={isSuccess} onOpenChange={setIsSuccess}>
        <CustomModalHeader onClose={() => setIsSuccess(false)}>
          Payment Successful
        </CustomModalHeader>
        <CustomModalBody>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Wallet Funded Successfully!
            </h3>
            <p className="text-gray-600">
              Your transaction has been verified and your wallet balance has been updated.
            </p>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}

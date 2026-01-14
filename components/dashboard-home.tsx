"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProfileModal from "./wallet-virtual";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from "./custom-modal";
// import { user, wallets } from "../lib/schema"; // <-- Not needed in component logic
import { WalletCardSkeleton } from "./wallet-card-loader";
import { useUserOrders } from "../app/hooks/user-orders";
import { usePayments } from "../app/hooks/user-payments";
import clsx from "clsx";
import useWalletStore from "../app/stores/wallet-stores";
import { useGetLoggedInUser } from "../app/hooks/use-get-logged-in-user";

// Define the assumed structure of the logged-in user with necessary ID and email
interface LoggedInUser {
  id: string;
  email: string;
  // Add other properties that might be needed, e.g., first_name
}

export function DashboardHome() {
  // Cast user to ensure type safety for 'id' and 'email'
  const { user } = useGetLoggedInUser() as { user: LoggedInUser | null };
  const { walletBalance } = useWalletStore();
  const { payments } = usePayments();
  const [userWallet, setuserWallet] = useState<any>(null);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0); // Ensure amount is number type
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [fetchingWallet, setfetchingWallet] = useState(false);
  const { orders } = useUserOrders();

  // NEW STATE: Control visibility of the amount input field
  const [showAmountInput, setShowAmountInput] = useState(false);
  const searchParams = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const totalDeposit = payments
    ?.filter((payment) => payment.status === "funded")
    .reduce((acc, val) => Number(val.amount) + acc, 0);

  // ... (getWallet function remains the same)
  const getWallet = useCallback(async () => {
    setfetchingWallet(true);
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
    } catch (authError) {
      console.error("Token decoding failed:", authError);
      localStorage.removeItem("token");
      toast.error("Invalid session data. Please log in.");
      router.push("/auth/login");
      return;
    }
    try {
      const res = await fetch(`/api/wallet/${userId}`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to fetch wallet.");
        setuserWallet(null);
        return;
      }

      setuserWallet(data);
    } catch (error) {
      toast.error("An unexpected error occurred while loading products.");
      setuserWallet([]);
    } finally {
      setfetchingWallet(false);
    }
  }, [router]);

  // ... (checkWallet function remains the same)
  const checkWallet = () => {
    if (
      !userWallet?.firstName || // Use optional chaining to avoid errors if userWallet is null/undefined
      !userWallet?.lastName ||
      !userWallet?.phoneNumber
    ) {
      return true;
    }
    if (userWallet.accountNumber) {
      //we will display accout details
    }
    return false;
  };

  // --- Interfaces and initiateTemporaryWalletFunding function (Moved to component body for scope) ---

  interface PaystackInitResponse {
    status: boolean;
    message: string;
    data: {
      authorization_url?: string;
      access_code?: string;
      reference: string;
      account_number?: string;
      bank_name?: string;
      bank_code?: string;
    };
  }

  interface FundingRequestData {
    userId: string;
    email: string;
    amount: number; // Amount in kobo/cents
  }

  const initiateKoraFunding = useCallback(
    async (fundingData: any): Promise<any | null> => {
      console.log("Starting KoraPay funding process...");

      try {
        setCreatingAccount(true);
        const response = await fetch("/api/korapay/initialize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
        setCreatingAccount(false);
      }
    },
    []
  );

  // --- NEW HANDLER FUNCTION ---
  const handleFundWalletClick = async () => {
    if (checkWallet()) {
      setIsOpen(true);
      return;
    }

    if (!showAmountInput) {
      setShowAmountInput(true);
      return;
    }

    if (!user?.id || !user?.email) {
      toast.error("User session data is missing.");
      return;
    }

    if (amount < 100) {
      toast.error("Minimum funding amount is ₦100.");
      return;
    }

    const reference = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const koraFundingData = {
      amount,
      currency: "NGN",
      reference,
      customer: {
        email: user.email,
        name: userWallet?.firstName ? `${userWallet.firstName} ${userWallet.lastName}` : user.email,
      },
      metadata: {
        user_id: user.id,
      },
      merchant_bears_cost: true,
    };

    const result = await initiateKoraFunding(koraFundingData);

    if (result) {
      setShowAmountInput(false);
      setAmount(0);
    }
  };

  useEffect(() => {
    getWallet();
  }, [getWallet]);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference && !verifying) {
      const verifyPayment = async () => {
        setVerifying(true);
        try {
          const res = await fetch(`/api/korapay/verify?reference=${reference}`);
          const result = await res.json();
          if (res.ok && result.status === true && result.data.status === "success") {
            setShowSuccessModal(true);
            // Optionally clear the query param from URL without refreshing
            const url = new URL(window.location.href);
            url.searchParams.delete("reference");
            window.history.replaceState({}, "", url.pathname);
          } else {
            console.error("Payment verification failed or status not success", result);
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
        } finally {
          setVerifying(false);
        }
      };
      verifyPayment();
    }
  }, [searchParams, verifying]);

  return (
    <div className="space-y-6">
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Wallet Card (Remains the same) */}
        {fetchingWallet ? (
          <WalletCardSkeleton />
        ) : (
          <div className="bg-linear-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
            <h2 className="text-lg font-medium mb-2">My wallet</h2>
            <p className="text-3xl font-bold mb-6">
              ₦{walletBalance ?? "0.00"}
            </p>
            <div className="flex gap-3">
              <Link
                href="/dashboard/fund-wallet"
                className="px-6 py-2.5 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Fund Wallet
              </Link>
              <Link
                href="/dashboard/wallet-history"
                className="px-6 py-2.5 bg-violet-700 text-white rounded-lg font-medium hover:bg-violet-800 transition-colors"
              >
                Wallet History
              </Link>
            </div>
          </div>
        )}

        {/* Payment Card - NOW WITH TOGGLE AND INPUT */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Payment</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Top Up Your Wallet (KoraPay)
          </h3>

          {/* New: Conditional Input Field */}
          {showAmountInput && (
            <div className="mb-4">
              <label
                htmlFor="fund-amount"
                className="text-sm font-medium text-gray-700 block mb-1"
              >
                Enter Amount (NGN)
              </label>
              <input
                id="fund-amount"
                type="number"
                value={amount === 0 ? "" : amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="e.g., 5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                min="100" // Minimum funding amount
              />
            </div>
          )}

          {/* Button: Toggles input / Submits funding */}
          <button
            onClick={handleFundWalletClick}
            className="w-full py-3 bg-linear-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:from-violet-600 hover:to-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={creatingAccount || fetchingWallet}
          >
            {creatingAccount
              ? "Initiating Checkout..."
              : checkWallet()
                ? "Complete Profile to Fund"
                : showAmountInput
                  ? `Pay ₦${amount.toLocaleString()}`
                  : "Direct Top-Up"}
          </button>
        </div>
      </div>

      {/* Stats Cards Row (Remains the same) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Orders Card */}
        {/* ... (JSX for Total Orders) ... */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            {orders?.length ?? 0}
          </p>
          <button
            onClick={() => {
              router.push("/dashboard/products");
            }}
            className="w-full py-3 bg-linear-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:from-violet-600 hover:to-purple-700 transition-colors"
          >
            Buy Log
          </button>
        </div>

        {/* Total Deposits Card */}
        {/* ... (JSX for Total Deposits) ... */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Deposits</p>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            ₦{totalDeposit ?? "0.00"}
          </p>
          <button
            onClick={() => {
              router.push("/dashboard/wallet-history");
            }}
            className="w-full py-3 bg-linear-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:from-violet-600 hover:to-purple-700 transition-colors"
          >
            Wallet History
          </button>
        </div>
      </div>

      {/* Latest Payments History (Remains the same) */}
      {/* ... (JSX for Latest Payments History) ... */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Latest Payments History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  TRX
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  TIME
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  AMOUNT
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    Data not found
                  </td>
                </tr>
              ) : (
                payments?.map((item, index: number) => (
                  <tr key={index} className="border-b border-gray-50">
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.id.slice(0, 4)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item?.createdAt && (
                        <span>
                          {new Date(item?.createdAt).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.amount}
                    </td>
                    <td>
                      <button
                        className={clsx(
                          " uppercase w-fit h-fit px-3 py-1 font-bold  rounded-md text-sm text-gray-600",
                          item.status === "funded"
                            ? "bg-green-500 text-white"
                            : " bg-red-500 text-white"
                        )}
                      >
                        {" "}
                        {item.status}
                      </button>{" "}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProfileModal isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Success Modal */}
      <CustomModal open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <CustomModalHeader onClose={() => setShowSuccessModal(false)}>
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
            onClick={() => setShowSuccessModal(false)}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Great, thanks!
          </button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}

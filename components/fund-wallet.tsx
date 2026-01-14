"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import clsx from "clsx";
import { usePayments } from "../app/hooks/user-payments";

const paymentHistory = [
  {
    action: "Wallet Credit",
    gateway: "Manuel HF354HF300D8",
    type: "2025-12-02 11:15 AM",
    timeAgo: "16 minutes ago",
    amount: "20,000.00 + 0.00",
    total: "20,000.00",
    status: "completed",
  },
];

export function FundWalletContent() {
  const { payments } = usePayments();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // const paymentMethods = ["Bank Transfer", "Card Payment", "USSD", "Crypto"]
  const paymentMethods = ["Bank Transfer"];

  useEffect(() => {
    if (paymentMethod === "Bank Transfer") {
      if (!amount) {
        toast.error("please add amount to fund");
        setPaymentMethod("");
      } else {
        router.push(`/dashboard/manual-deposit?amount=${amount}`);
      }
    }
  }, [paymentMethod, amount]);

  return (
    <div className="space-y-6">
      {/* Fund Wallet Form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Top up your wallet easily
        </h1>

        <button onClick={() => {
          toast.info("Tutorial been made👍👍")
        }} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors mb-8">
          Learn how to fund your wallet
        </button>

        <div className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Amount (NGN)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder=""
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
            />
          </div>

          {/* Payment Gateway Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payment Gateway
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white hover:border-gray-400 transition-colors"
              >
                <span
                  className={paymentMethod ? "text-gray-900" : "text-gray-500"}
                >
                  {paymentMethod || "Select Payment Method"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {paymentMethods.map((method) => (
                    <button
                      key={method}
                      onClick={() => {
                        setPaymentMethod(method);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {method}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <button className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-semibold hover:from-violet-600 hover:to-purple-700 transition-colors">
            Continue
          </button>
        </div>
      </div>

      {/* Latest Payments History */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Latest Payments History
          </h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200">

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
      </div>
    </div>
  );
}

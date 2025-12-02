"use client";
import Link from "next/link";
import { useState } from "react";
import ProfileModal from "./wallet-virtual";
import { useRouter } from "next/navigation";

const paymentHistory: any[] = [
  // Empty for now - matches "Data not found" state
];

export function DashboardHome() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-6">
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Wallet Card */}
        <div className="bg-linear-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-medium mb-2">My wallet</h2>
          <p className="text-3xl font-bold mb-6">₦0.00</p>
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

        {/* Payment Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Payment</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Top Up With Your Virtual Account
          </h3>
          <button
            onClick={() => {
              setIsOpen(true);
            }}
            className="w-full py-3 bg-linear-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:from-violet-600 hover:to-purple-700 transition-colors"
          >
            Create Your Account
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Orders Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mb-4">0</p>
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
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Deposits</p>
          <p className="text-3xl font-bold text-gray-900 mb-4">0.00</p>
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

      {/* Latest Payments History */}
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
              {paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    Data not found
                  </td>
                </tr>
              ) : (
                paymentHistory.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-50">
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.trx}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.time}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.amount}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ProfileModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

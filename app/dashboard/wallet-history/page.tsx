import React from "react";
import { DashboardLayout } from "../../../components/dashboard/dashboard-layout";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

// Sample data to match the screenshot
const transactionData = [
  {
    actionGateway: "Wallet Credit",
    trx: "Manuel HF354HF300D8",
    initiatedDate: "2025-12-02",
    initiatedTime: "11:15 AM",
    initiatedAgo: "5 hours ago",
    amountNaira: "₦20,000.00 + 0.00",
    amountValue: "20,000.00 Naira",
    status: "Disabled", // Status used for styling
  },
];

// Define the component
const TransactionHistory = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Back to Dashboard Link */}
        <Link href={"/dashboard"} className="text-sm flex items-center gap-2 text-Linkurple-600 font-medium mb-5 cursor-pointer hover:text-purple-700">
          <ChevronLeft /> Back to Dashboard
        </Link>

        {/* Table Container (The Card) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* --- Table Header --- */}
          <div className="grid grid-cols-10 gap-4 pb-3 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
            <span className="col-span-3">ACTION | GATEWAY | TRx</span>
            <span className="col-span-2">INITIATED</span>
            <span className="col-span-3">AMOUNT</span>
            <span className="col-span-1">STATUS</span>
            <span className="col-span-1 text-center">ACTION</span>
          </div>

          {/* --- Table Body (Mapping the data) --- */}
          {transactionData.map((transaction, index) => (
            <div
              key={index}
              className="grid grid-cols-10 gap-4 py-4 border-b border-gray-100 items-center last:border-b-0"
            >
              {/* ACTION | GATEWAY | TRx Column (col-span-3) */}
              <div className="col-span-3">
                <div className="font-medium text-gray-800">
                  {transaction.actionGateway}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {transaction.trx}
                </div>
              </div>

              {/* INITIATED Column (col-span-2) */}
              <div className="col-span-2 text-sm text-gray-700">
                <div className="text-sm">
                  {transaction.initiatedDate} {transaction.initiatedTime}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {transaction.initiatedAgo}
                </div>
              </div>

              {/* AMOUNT Column (col-span-3) */}
              <div className="col-span-3 text-sm text-gray-700">
                <div className="font-mono">{transaction.amountNaira}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {transaction.amountValue}
                </div>
              </div>

              {/* STATUS Column (col-span-1) */}
              <div className="col-span-1">
                {/* Conditional Tailwind styling for the 'Disabled' status */}
                <span className="inline-block px-3 py-1 text-xs font-semibold leading-none rounded-md bg-yellow-100 text-yellow-800">
                  {transaction.status}
                </span>
              </div>

              {/* ACTION (Icon) Column (col-span-1) */}
              <div className="col-span-1 text-center">
                {/* Monitor Icon */}
                <svg
                  className="w-5 h-5 text-gray-500 mx-auto cursor-pointer hover:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1v-3.25m-7.25 0h10.5m-10.5 0h-2.5a.75.75 0 01-.75-.75v-10.5c0-.414.336-.75.75-.75h14.5c.414 0 .75.336.75.75v10.5a.75.75 0 01-.75.75h-2.5m-10.5 0v3.25"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransactionHistory;

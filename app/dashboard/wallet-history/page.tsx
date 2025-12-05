"use client";
import React from "react";
import { DashboardLayout } from "../../../components/dashboard/dashboard-layout";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePayments } from "../../hooks/user-payments";
import clsx from "clsx";
import { Skeleton } from "../../../components/ui/skeleton";

const TransactionHistory = () => {
  const { payments, isLoading } = usePayments();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Back to Dashboard Link */}
        <Link
          href={"/dashboard"}
          className="text-sm flex items-center gap-2 text-Linkurple-600 font-medium mb-5 cursor-pointer hover:text-purple-700"
        >
          <ChevronLeft /> Back to Dashboard
        </Link>

        {/* Table Container (The Card) */}
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
              {isLoading ? (
                // Skeleton loader rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-50">
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    Data not found
                  </td>
                </tr>
              ) : (
                payments.map((item, index: number) => (
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
                          "uppercase w-fit h-fit px-3 py-1 font-bold rounded-md text-sm text-gray-600",
                          item.status === "funded"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        )}
                      >
                        {item.status}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransactionHistory;

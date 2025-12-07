"use client";

import { useState } from "react";
import { Copy, Check, Users, Wallet, TrendingUp, Gift } from "lucide-react";
import { useGetLoggedInUser } from "../app/hooks/use-get-logged-in-user";
import { useFetch } from "../app/hooks/use-fetch";
import { ReferralType } from "../app/api/referrals/[userId]/route";
import { bonuses } from "../lib/schema";
import { BonusType } from "../app/api/bonuses/[userId]/route";
import { getDate } from "../app/utils/getdatefromstring";

const referralHistory = [
  {
    username: "john_doe",
    email: "john***@gmail.com",
    deposited: 50000,
    earned: 1000,
    date: "2025-12-01 14:30",
    status: "credited",
  },
  {
    username: "mary_jane",
    email: "mary***@gmail.com",
    deposited: 25000,
    earned: 500,
    date: "2025-11-28 09:15",
    status: "credited",
  },
  {
    username: "alex_smith",
    email: "alex***@gmail.com",
    deposited: 100000,
    earned: 2000,
    date: "2025-11-25 16:45",
    status: "credited",
  },
];

export function ReferralContent() {
  const { user } = useGetLoggedInUser();

  const [copied, setCopied] = useState(false);
  const referralCode = user?.referralCode ?? "";
  const referralLink = `https://jemilmarketplace.com/register?ref=${user?.referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    data: bonusObj,
    loading,
    error,
    refetch,
  } = useFetch<{
    success: boolean;
    bonuses: BonusType[];
  }>(user?.id ? `/api/bonuses/${user.id}` : "", "user-bonuses", {
    enabled: !!user?.id,
    deps: [user?.id],
  });

  const bonusEarned =
    bonusObj?.bonuses?.reduce((acc, bns) => Number(bns.bonusAmount) + acc, 0) ??
    0.0;

  const { data: referrals, loading: referralsLoading } = useFetch<{
    success: boolean;
    referrals: ReferralType[];
  }>(`/api/referrals/${user?.id}`, "user-refferrals", {
    enabled: !!user?.id,
    deps: [user?.id],
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Referral Program</h1>
        </div>
        <p className="text-violet-100 max-w-xl">
          Earn <span className="font-bold text-yellow-300">2%</span> of every
          deposit made by users you refer. Share your unique link and start
          earning passive income today!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-gray-500 text-sm">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {referrals?.referrals?.length ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-green-600">₦{bonusEarned}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-gray-500 text-sm">Commission Rate</span>
          </div>
          <p className="text-2xl font-bold text-cyan-600">2%</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Your Referral Link
        </h2>

        <div className="space-y-4">
          {/* Referral Link */}
          <div>
            <label className="text-sm text-gray-500 mb-2 block">
              Share this link with friends
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm"
              />
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <label className="text-sm text-gray-500 mb-2 block">
              Your Referral Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-mono text-lg font-semibold tracking-wider"
              />
              <button
                onClick={() => copyToClipboard(referralCode)}
                className="px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 p-4 bg-violet-50 rounded-lg border border-violet-100">
          <h3 className="font-semibold text-violet-800 mb-2">How it works</h3>
          <ol className="text-sm text-violet-700 space-y-1 list-decimal list-inside">
            <li>Share your referral link or code with friends</li>
            <li>They sign up using your link/code</li>
            <li>When they fund their wallet, you earn 2% of their deposit</li>
            <li>Earnings are automatically credited to your wallet</li>
          </ol>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Referral Earnings History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Earnings (2%)
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bonusObj?.bonuses?.length && bonusObj?.bonuses?.length > 0 ? (
                bonusObj?.bonuses?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          "USERNAME GOES HERE"
                        </p>
                        <p className="text-xs text-gray-500">"USER MAIL</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      ₦{item.bonusAmount.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {getDate(item?.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    No referral earnings yet. Start sharing your link!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

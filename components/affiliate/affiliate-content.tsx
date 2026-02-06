
"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    Link as LinkIcon,
    Wallet,
    Settings,
    CheckCircle,
    AlertCircle,
    Copy,
    DollarSign,
    ArrowUpRight,
    ShieldCheck,
    BarChart3
} from "lucide-react";
import { useGetLoggedInUser } from "../../app/hooks/use-get-logged-in-user";
import { useFetch } from "../../app/hooks/use-fetch";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AffiliateProfile {
    id: string;
    status: "pending_payment" | "pending_approval" | "active" | "rejected" | "suspended";
    commissionRate: string;
    totalEarnings: string;
    currentBalance: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
}

export function AffiliateContent() {
    const { user } = useGetLoggedInUser();
    const [activeTab, setActiveTab] = useState("dashboard");
    const router = useRouter();

    const { data: statusData, loading: statusLoading, refetch, error } = useFetch<{
        success: boolean;
        affiliate: AffiliateProfile | null;
    }>(user?.id ? `/api/affiliate/status/${user.id}` : "", "affiliate-status", {
        enabled: !!user?.id,
    });
    console.log("StatusData:", statusData, "Loading:", statusLoading, "Error:", error);
    const profile = statusData?.affiliate;
    const isAffiliate = profile && profile.status === "active";


    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">
                <p className="font-semibold">Failed to load affiliate status</p>
                <p className="text-sm mt-1 mb-3 text-red-500">{String(error.message || error)}</p>
                <button onClick={refetch} className="px-4 py-2 bg-white border border-red-200 rounded-lg hover:bg-gray-50">
                    Retry
                </button>
            </div>
        )
    }




    if (statusLoading) {
        return <div className="p-8 text-center text-gray-500">Loading affiliate status...</div>;
    }

    if (!isAffiliate) {
        return <RegistrationView user={user} profile={profile} refetch={refetch} />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                    <TabButton id="dashboard" label="Dashboard" icon={BarChart3} activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton id="links" label="Affiliate Links" icon={LinkIcon} activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton id="earnings" label="Earnings & Wallet" icon={Wallet} activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton id="settings" label="Settings" icon={Settings} activeTab={activeTab} onClick={setActiveTab} />
                </div>
            </div>

            {activeTab === "dashboard" && <OverviewTab profile={profile} user={user} />}
            {activeTab === "links" && <LinksTab user={user} />}
            {activeTab === "earnings" && <EarningsTab profile={profile} />}
            {activeTab === "settings" && <SettingsTab profile={profile} />}
        </div>
    );
}

function TabButton({ id, label, icon: Icon, activeTab, onClick }: any) {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "text-gray-600 hover:bg-gray-50"
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

function RegistrationView({ user, profile, refetch }: any) {
    const [activating, setActivating] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleActivate = async () => {
        setActivating(true);
        setError("");
        try {
            const res = await fetch("/api/affiliate/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Failed to activate");
            } else {
                refetch();
            }
        } catch (err: any) {
            setError("Activation failed. Please try again.");
        } finally {
            setActivating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-violet-100 rounded-2xl mb-2">
                    <TrendingUp className="w-8 h-8 text-violet-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Become a Partner Affiliate</h1>
                <p className="text-gray-500 max-w-xl mx-auto">
                    Unlock exclusive earning potential with our premium affiliate program.
                    Earn generous commissions, track detailed analytics, and get paid directly to your wallet.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <FeatureItem icon={DollarSign} title="High Commission Rates" desc="Earn up to 20% on every referral sale you generate." />
                    <FeatureItem icon={BarChart3} title="Advanced Analytics" desc="Track clicks, conversions, and earnings in real-time." />
                    <FeatureItem icon={Wallet} title="Instant Withdrawals" desc="Withdraw your earnings to your bank account anytime." />
                    <FeatureItem icon={ShieldCheck} title="Dedicated Support" desc="Get priority support and marketing assets to help you succeed." />
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-full -z-0" />

                    <div className="relative z-10 space-y-6">
                        <div>
                            <span className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Early Access</span>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-5xl font-bold text-gray-900">₦1,000</span>
                                <span className="text-gray-500 font-medium">/ lifetime</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Instant Account Activation</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Access to Marketing Dashboard</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Generic Link Generation</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleActivate}
                            disabled={activating}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {activating ? "Activating..." : "Activate Affiliate Account"}
                        </button>

                        <p className="text-xs text-center text-gray-400">
                            Payment will be deducted from your wallet balance.
                            <Link href="/dashboard/fund-wallet" className="text-violet-600 hover:underline ml-1">Fund Wallet</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-violet-100 transition-colors">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-violet-600" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

function OverviewTab({ profile, user }: any) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Earnings" value={`₦${profile.totalEarnings}`} icon={DollarSign} color="green" />
                <StatCard label="Current Balance" value={`₦${profile.currentBalance}`} icon={Wallet} color="violet" />
                <StatCard label="Commission Rate" value={`${profile.commissionRate}%`} icon={TrendingUp} color="blue" />
                <StatCard label="Pending Withdrawals" value="₦0.00" icon={AlertCircle} color="orange" />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Performance</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-400">Performance Chart Placeholder</p>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        green: "bg-green-50 text-green-600",
        violet: "bg-violet-50 text-violet-600",
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
    }
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">{label}</span>
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    )
}

function LinksTab({ user }: any) {
    const [copied, setCopied] = useState(false);
    const referralLink = `https://jemilmarketplace.com/register?ref=${user?.referralCode}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Default Affiliate Link</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-500 mb-2 block">Your Unique Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={referralLink}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-violet-300"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
                            >
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        Share this link on social media, blogs, or emails. When user registers via this link, they are attributed to you.
                    </p>
                </div>
            </div>
        </div>
    )
}

function EarningsTab({ profile }: any) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-linear-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 mb-1">Available for Withdrawal</p>
                        <h2 className="text-4xl font-bold">₦{profile.currentBalance}</h2>
                    </div>
                    <button className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Request Withdrawal
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Transaction History</h3>
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No transactions found.
                </div>
            </div>
        </div>
    )
}

function SettingsTab({ profile }: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-semibold text-gray-800 mb-6">Payment Settings</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Bank Name</label>
                    <input type="text" placeholder="e.g. GTBank" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 transition-colors" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Account Number</label>
                    <input type="text" placeholder="0123456789" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 transition-colors" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Account Name</label>
                    <input type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 transition-colors" />
                </div>
                <div className="pt-4">
                    <button className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

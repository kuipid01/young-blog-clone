
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
    BarChart3,
    Upload
} from "lucide-react";
import { useGetLoggedInUser } from "../../app/hooks/use-get-logged-in-user";
import { useFetch } from "../../app/hooks/use-fetch";
import { uploadToCloudinary } from "../../app/utils/upload-to-cloundinary";
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
    paymentProof?: string;
    paymentReference?: string;
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

    const profile = statusData?.affiliate;
    // Prioritize the boolean flag isAffiliate from the user object as requested
    const isAffiliate = user?.isAffiliate === true || (profile && profile.status === "active");

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
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse">Checking affiliate status...</p>
            </div>
        );
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
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isPending, setIsPending] = useState(profile?.status === "pending_approval" || profile?.status === "pending_payment");
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setError("");
        }
    };

    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setError("Please upload your payment receipt");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            // STEP 1: Upload to Cloudinary
            const proofUrl = await uploadToCloudinary(selectedFile);

            // STEP 2: Submit to backend
            const res = await fetch("/api/affiliate/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    paymentReference: proofUrl, // Using URL as reference
                    paymentProof: proofUrl
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Failed to submit request");
            } else {
                setIsPending(true);
                refetch();
            }
        } catch (err: any) {
            setError(err.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isPending) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center space-y-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="inline-flex p-4 bg-orange-50 rounded-full">
                    <AlertCircle className="w-12 h-12 text-orange-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Application Pending Approval</h2>
                <p className="text-gray-500">
                    We've received your payment proof and reference. Our team is currently reviewing your registration.
                    This usually takes 24-48 hours.
                </p>
                <div className="p-4 bg-gray-50 rounded-xl text-left space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Information Submitted</p>
                    <p className="text-sm font-medium text-gray-700">Ref: <span className="font-mono">{profile?.paymentReference || "N/A"}</span></p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-6 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                    Refresh Status
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-violet-100 rounded-2xl mb-2">
                    <TrendingUp className="w-8 h-8 text-violet-600" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Partner Affiliate Program</h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Join our network of successful partners and start earning high commissions today.
                </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Why become an affiliate?</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FeatureItem icon={DollarSign} title="20% Commission" desc="Earn industry-leading rates on every single referral." />
                        <FeatureItem icon={BarChart3} title="Deep Analytics" desc="Track your conversion funnel with detailed stats." />
                        <FeatureItem icon={Wallet} title="Fast Payouts" desc="Request your earnings anytime to your local bank." />
                        <FeatureItem icon={ShieldCheck} title="Trusted Brand" desc="Promote a platform your audience will love." />
                    </div>

                    <div className="mt-8 p-6 bg-violet-50 rounded-2xl border border-violet-100">
                        <h3 className="font-bold text-violet-900 mb-2">Registration Instructions</h3>
                        <ul className="space-y-3 text-sm text-violet-800">
                            <li className="flex gap-2">
                                <span className="font-bold">1.</span>
                                <span>Pay the ₦1,000 registration fee to Jemil Marketplace Account.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold">2.</span>
                                <span>Take a screenshot or save the payment receipt.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold">3.</span>
                                <span>Upload the receipt on the right and submit for approval.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-full -z-0 opacity-50" />

                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Activate Account</h3>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-4xl font-extrabold text-violet-600">₦1,000</span>
                                    <span className="text-gray-400 font-medium">/ lifetime access</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitProof} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 block">Payment Receipt</label>
                                    <div className="relative group">
                                        <label className="flex flex-col items-center justify-center w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className={`w-8 h-8 mb-3 ${selectedFile ? 'text-green-500' : 'text-gray-400'}`} />
                                                <p className="mb-1 text-sm text-gray-700">
                                                    <span className="font-semibold">{selectedFile ? selectedFile.name : 'Click to upload receipt'}</span>
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center text-balance">Please ensure the receipt is clear and shows payment status.</p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2 border border-red-100">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : "Submit for Approval"}
                                </button>
                            </form>

                            <div className="pt-2 border-t border-dashed border-gray-100">
                                <p className="text-xs text-center text-gray-400 leading-relaxed">
                                    By submitting, you agree to our affiliate terms. Approval typically takes 24 hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-300">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">{desc}</p>
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

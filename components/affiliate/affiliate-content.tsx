

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
    Upload,
    History,
    ExternalLink,
    Search
} from "lucide-react";
import { useGetLoggedInUser } from "../../app/hooks/use-get-logged-in-user";
import { useFetch } from "../../app/hooks/use-fetch";
import { uploadToCloudinary } from "../../app/utils/upload-to-cloundinary";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WithdrawalModal } from "./withdrawal-modal";

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
    const isAffiliate = !!user?.isAffiliate || profile?.status === "active";

    const { data: commissionsData, loading: commissionsLoading, refetch: refetchCommissions } = useFetch<{
        success: boolean;
        data: {
            commissions: any[];
            summary: {
                totalEarnings: number;
                currentBalance: number;
                availableBalance: number;
                lockedAmount: number;
            }
        }
    }>(user?.id ? `/api/affiliate/commissions/${user.id}` : "", "affiliate-commissions", {
        enabled: !!(user?.id && isAffiliate),
    });

    const handleRefetchAll = () => {
        refetch();
        if (isAffiliate) refetchCommissions();
    };

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
                    <TabButton id="withdrawals" label="Withdrawals" icon={History} activeTab={activeTab} onClick={setActiveTab} />
                    {/* <TabButton id="settings" label="Settings" icon={Settings} activeTab={activeTab} onClick={setActiveTab} /> */}
                </div>
            </div>

            {activeTab === "dashboard" && <OverviewTab profile={profile} user={user} commissionsSummary={commissionsData?.data?.summary} />}
            {activeTab === "links" && <LinksTab user={user} />}
            {activeTab === "earnings" && <EarningsTab profile={profile} refetch={handleRefetchAll} commissionsData={commissionsData?.data} loading={commissionsLoading} />}
            {activeTab === "withdrawals" && <WithdrawalsTab profile={profile} user={user} />}
            {/* {activeTab === "settings" && <SettingsTab profile={profile} />} */}
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
    const [isPending, setIsPending] = useState(profile?.status === "pending_approval" || profile?.status === "pending_payment" || (profile && profile.status !== "rejected" && profile.status !== "active"));
    const [hasAgreedToRules, setHasAgreedToRules] = useState(false);
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
                    <p className="text-sm font-medium text-gray-700">Status: <span className="font-mono capitalize">{profile?.status?.replace('_', ' ') || "Pending"}</span></p>
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

    if (!hasAgreedToRules) {
        return <RulesView onAccept={() => setHasAgreedToRules(true)} />;
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
                                    <label htmlFor="receipt-upload" className="text-sm font-semibold text-gray-700 block">Payment Receipt</label>
                                    <div className="relative group">
                                        <label htmlFor="receipt-upload" className="flex flex-col items-center justify-center w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className={`w-8 h-8 mb-3 ${selectedFile ? 'text-green-500' : 'text-gray-400'}`} />
                                                <p className="mb-1 text-sm text-gray-700">
                                                    <span className="font-semibold">{selectedFile ? selectedFile.name : 'Click to upload receipt'}</span>
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                                            </div>
                                            <input
                                                id="receipt-upload"
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

function RulesView({ onAccept }: { onAccept: () => void }) {
    const rules = [
        {
            title: "Ethical Promotion",
            desc: "Spamming, misleading claims, or unsolicited emails are strictly prohibited. Promote Jemil Marketplace honestly."
        },
        {
            title: "No Self-Referrals",
            desc: "Registering yourself under your own affiliate link to gain commission is not allowed and will lead to suspension."
        },
        {
            title: "Accuracy of Information",
            desc: "You must provide accurate payment information (Bank Name, Account Number) to ensure successful payouts."
        },
        {
            title: "Commission Structure",
            desc: "Earnings are calculated based on valid sales made through your unique link. Rates are subject to periodic review."
        },
        {
            title: "Payout Schedule",
            desc: "Standard payouts are processed upon request, provided you have reached the minimum withdrawal threshold."
        },
        {
            title: "Compliance",
            desc: "Any violation of these terms may result in account termination and forfeiture of unpaid commissions."
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-violet-100 rounded-2xl mb-2">
                    <ShieldCheck className="w-8 h-8 text-violet-600" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Affiliate Rules & Terms</h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Before joining our partner program, please review our guidelines to ensure a fair and profitable partnership.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-8">
                        {rules.map((rule, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-bold text-gray-900">{rule.title}</h3>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed pl-9">
                                    {rule.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-800 font-medium text-center">
                                By clicking 'I Understand & Proceed', you agree to abide by all the rules listed above.
                            </p>
                        </div>

                        <button
                            onClick={onAccept}
                            className="px-12 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 transition-all active:scale-[0.98] flex items-center gap-2 group"
                        >
                            <span>I Understand & Proceed</span>
                            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
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


function OverviewTab({ profile, user, commissionsSummary }: any) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Earnings"
                    value={`₦${commissionsSummary?.totalEarnings || profile.totalEarnings}`}
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    label="Pending (Locked)"
                    value={`₦${commissionsSummary?.lockedAmount?.toFixed(2) || "0.00"}`}
                    icon={AlertCircle}
                    color="orange"
                />
                <StatCard
                    label="Available Balance"
                    value={`₦${commissionsSummary?.availableBalance?.toFixed(2) || profile.currentBalance}`}
                    icon={Wallet}
                    color="violet"
                />
                <StatCard
                    label="Commission Rate"
                    value={`${profile.commissionRate}%`}
                    icon={TrendingUp}
                    color="blue"
                />
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

function EarningsTab({ profile, refetch, commissionsData, loading }: any) {
    const summary = commissionsData?.summary;
    const commissions = commissionsData?.commissions || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-linear-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 mb-1 text-sm font-medium">Available for Withdrawal</p>
                        <h2 className="text-4xl font-bold">₦{summary?.availableBalance?.toFixed(2) || profile.currentBalance}</h2>
                        {summary?.lockedAmount > 0 && (
                            <p className="text-xs text-violet-300 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                ₦{summary.lockedAmount.toFixed(2)} is currently locked (12h cooling period)
                            </p>
                        )}
                    </div>
                    <WithdrawalModal
                        currentBalance={Number(summary?.availableBalance || profile.currentBalance)}
                        affiliateId={profile.id}
                        onSuccess={() => refetch()}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Commission History</h3>
                    <span className="text-xs text-gray-400">Updates every 12 hours</span>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : commissions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {commissions.map((c: any) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">#{c.orderId.slice(-8)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₦{Number(c.amount).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            {c.isLocked ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">
                                                    <Settings className="w-3 h-3 animate-spin-slow" />
                                                    LOCKED
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">
                                                    <CheckCircle className="w-3 h-3" />
                                                    AVAILABLE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400 bg-gray-50/50">
                        No transactions found.
                    </div>
                )}
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

function WithdrawalsTab({ profile, user }: any) {
    const [filterStatus, setFilterStatus] = useState("all");
    const { data: withdrawalsData, loading, refetch } = useFetch<{
        success: boolean;
        data: any[];
    }>(user?.id ? `/api/affiliate/withdrawals/${user.id}` : "", "affiliate-withdrawals", {
        enabled: !!user?.id,
    });

    const withdrawals = withdrawalsData?.data || [];
    const filteredWithdrawals = filterStatus === "all"
        ? withdrawals
        : withdrawals.filter((w: any) => w.status === filterStatus);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-50 text-green-600 border-green-100";
            case "rejected": return "bg-red-50 text-red-600 border-red-100";
            case "processing": return "bg-blue-50 text-blue-600 border-blue-100";
            case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Withdrawal History</h2>
                    <p className="text-sm text-gray-500">Track and manage your payout requests</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                    {["all", "pending", "processing", "approved", "rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${filterStatus === status
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-24 space-y-4">
                        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-400">Loading withdrawals...</p>
                    </div>
                ) : filteredWithdrawals.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Bank Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredWithdrawals.map((w: any) => (
                                    <tr key={w.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-mono text-gray-600 font-medium">#{w.id.slice(-8).toUpperCase()}</span>
                                                <span className="text-[10px] text-gray-400 capitalize">{w.type} payout</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-base font-bold text-gray-900">₦{Number(w.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-700 font-medium">{w.bankName}</span>
                                                <span className="text-xs text-gray-400">{w.accountNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(w.status)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${w.status === 'approved' ? 'bg-green-500' :
                                                        w.status === 'rejected' ? 'bg-red-500' :
                                                            w.status === 'processing' ? 'bg-blue-500' : 'bg-amber-500'
                                                    }`} />
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs text-gray-500">
                                                {new Date(w.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {w.adminProof ? (
                                                <Link
                                                    href={w.adminProof}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-lg text-xs font-bold hover:bg-violet-100 transition-all border border-violet-100 shadow-xs"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    View Proof
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-300 italic">No proof yet</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-24 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-2">
                            <History className="w-8 h-8 text-gray-300" />
                        </div>
                        <div>
                            <p className="text-gray-900 font-bold">No withdrawals found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {filterStatus === 'all'
                                    ? "You haven't made any withdrawal requests yet."
                                    : `You don't have any ${filterStatus} withdrawal requests.`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Withdrawals Tip */}
            <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-violet-900">Security & Processing</h4>
                    <p className="text-xs text-violet-700 leading-relaxed mt-1">
                        Manual withdrawals are reviewed by our team and processed within 24-48 hours.
                        Always ensure your bank details are correct to avoid delays or rejections.
                    </p>
                </div>
            </div>
        </div>
    );
}

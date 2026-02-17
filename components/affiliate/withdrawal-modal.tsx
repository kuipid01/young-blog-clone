"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used, or alerts. I see alert.tsx in ui but toast is better. I'll stick to basic UI if toast isn't obvious, but likely it is. I'll use standard alert for errors inside modal.

interface Bank {
    name: string;
    slug: string;
    code: string;
    nibss_bank_code: string;
    country: string;
}

interface WithdrawalModalProps {
    currentBalance: number;
    affiliateId: string;
    onSuccess: () => void;
}

export function WithdrawalModal({ currentBalance, affiliateId, onSuccess }: WithdrawalModalProps) {
    const [open, setOpen] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);

    // Form States
    const [selectedBankCode, setSelectedBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [amount, setAmount] = useState("");

    // Status States
    const [isResolving, setIsResolving] = useState(false);
    const [resolutionError, setResolutionError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Fetch Banks on Open
    useEffect(() => {
        if (open && banks.length === 0) {
            setLoadingBanks(true);
            fetch("/api/banks")
                .then((res) => res.json())
                .then((data) => {
                    if (data.status && Array.isArray(data.data)) {
                        setBanks(data.data);
                    }
                })
                .catch(() => setSubmitError("Failed to load banks"))
                .finally(() => setLoadingBanks(false));
        }
    }, [open, banks.length]);

    // Resolve Account when Bank + Account Number (10 digits) are ready
    useEffect(() => {
        if (selectedBankCode && accountNumber.length === 10) {
            resolveAccount();
        } else {
            setAccountName("");
            setResolutionError("");
        }
    }, [selectedBankCode, accountNumber]);

    const resolveAccount = async () => {
        setIsResolving(true);
        setResolutionError("");
        setAccountName("");

        try {
            const res = await fetch("/api/banks/resolve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bank: selectedBankCode, account: accountNumber }),
            });
            const data = await res.json();

            if (data.status) {
                setAccountName(data.data.account_name);
            } else {
                setResolutionError("Could not resolve account name");
            }
        } catch (error) {
            setResolutionError("Error resolving account");
        } finally {
            setIsResolving(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitError("");

        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            setSubmitError("Please enter a valid amount");
            return;
        }

        if (numAmount > currentBalance) {
            setSubmitError("Amount exceeds current balance");
            return;
        }

        if (!accountName) {
            setSubmitError("Please provide valid account details");
            return;
        }

        setIsSubmitting(true);

        try {
            // Find selected bank object for full details
            const selectedBank = banks.find(b => b.code === selectedBankCode);

            const res = await fetch("/api/withdrawals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    affiliateId,
                    amount: numAmount,
                    bankDetails: {
                        bank_name: selectedBank?.name,
                        bank_code: selectedBankCode,
                        account_number: accountNumber,
                        account_name: accountName
                    }
                }),
            });

            const data = await res.json();
            console.log(data, "data from submissions")
            if (res.ok) {
                setOpen(false);
                onSuccess();
                // Reset form
                setAmount("");
                setAccountNumber("");
                setSelectedBankCode("");
                setAccountName("");
            } else {
                setSubmitError(data.error || "Withdrawal failed");
            }
        } catch (error) {
            setSubmitError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                    disabled={currentBalance <= 0}
                >
                    Request Withdrawal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                    <DialogDescription>
                        Enter your bank details to withdraw your earnings.
                        <br />
                        <span className="font-semibold text-violet-600">Available Balance: ₦{currentBalance}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Bank Selection */}
                    <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedBankCode}
                            onChange={(e) => setSelectedBankCode(e.target.value)}
                            disabled={loadingBanks || isSubmitting}
                        >
                            <option value="">Select Bank</option>
                            {banks.map((bank) => (
                                <option key={bank.code} value={bank.code}>
                                    {bank.name}
                                </option>
                            ))}
                        </select>
                        {loadingBanks && <p className="text-xs text-muted-foreground">Loading banks...</p>}
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                        <Label>Account Number</Label>
                        <div className="relative">
                            <Input
                                placeholder="0123456789"
                                value={accountNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setAccountNumber(val);
                                }}
                                disabled={isSubmitting}
                            />
                            {isResolving && (
                                <div className="absolute right-3 top-2.5">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resolved Name Display */}
                    {accountName && (
                        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>{accountName}</span>
                        </div>
                    )}

                    {resolutionError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>{resolutionError}</span>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <Label>Amount (₦)</Label>
                        <Input
                            type="number"
                            placeholder="Min. 100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isSubmitting}
                        />
                        {Number(amount) > currentBalance && (
                            <p className="text-xs text-red-500">Amount exceeds available balance</p>
                        )}
                    </div>

                    {submitError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                            {submitError}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        variant="default"
                        disabled={isSubmitting || isResolving || !accountName || !amount || Number(amount) > currentBalance}
                        onClick={handleSubmit}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Confirm Withdrawal"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

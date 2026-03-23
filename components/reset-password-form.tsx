"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success("Password reset successfully! Redirecting...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("Reset Password Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-2">Invalid Reset Link</h2>
        <p className="text-gray-600 mb-8">
          The password reset link is invalid or has already been used.
        </p>
        <Link 
          href="/auth/forgot-password" 
          className="inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex flex-col leading-tight">
          <span className="text-indigo-600 font-semibold text-sm">Jemil</span>
          <span className="text-indigo-600 font-semibold text-sm">Marketplace</span>
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Set New Password</h1>
      <p className="text-gray-600 mb-8">
        Choose a strong password you haven't used before.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 rounded-lg border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-12 rounded-lg border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-base flex items-center justify-center transition-all"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Update Password"
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

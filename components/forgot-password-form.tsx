"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success("Instructions sent to your email!");
      setIsSent(true);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-600 mb-8">
          We've sent password reset instructions to <span className="font-semibold text-gray-900">{email}</span>.
        </p>
        <Link 
          href="/auth/login" 
          className="inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Return to login
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

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Forgot Password?</h1>
      <p className="text-gray-600 mb-8">
        No worries, we'll send you reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            "Reset Password"
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

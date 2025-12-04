"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true); // start loader

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("login_time", Date.now().toString());

      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false); // stop loader
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex flex-col leading-tight">
          <span className="text-indigo-600 font-semibold text-sm">Jemil</span>
          <span className="text-indigo-600 font-semibold text-sm">
            Marketplace
          </span>
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Login with your email
      </h1>
      <p className="text-gray-600 mb-6">
        Don't have an Account?{" "}
        <Link
          href="/auth/register"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Create Account
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Username / Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-lg border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
        />

        <Input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-lg border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
        />

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label
              htmlFor="remember"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Remember me?
            </label>
          </div>

          <Link
            href="/forgot-password"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-base flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </div>
  );
}

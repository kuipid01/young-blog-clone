"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Check,
  X,
  Code2,
  Gift,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // NEW
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "", // NEW
    referralCode: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // ⛔ Handle API errors here
      if (!res.ok) {
        toast.error(data.message || "Registration failed");
        return;
      }

      // ✅ Success
      toast.success("Registration successful");
      router.push("/auth/login");
    } catch (error) {
      console.log(error);
      toast.error("Couldn't proceed — network error");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    const { password } = formData;
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 10) return 2;
    return 3;
  };

  const strengthColors = [
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
  ];
  const strengthLabels = ["", "Weak", "Medium", "Strong"];

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#6C5CE7]/10 rounded-full mb-4">
          <div className="w-10 h-10 bg-[#6C5CE7] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Create Account
        </h1>
        <p className="text-muted-foreground text-sm">
          Join our marketplace for unique social accounts
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Username
          </Label>
          <div className="relative">
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                focusedField === "name"
                  ? "text-[#6C5CE7]"
                  : "text-muted-foreground"
              }`}
            >
              <User className="w-5 h-5" />
            </div>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value,
                })
              }
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              className="pl-11 h-12 border-2 border-border bg-muted/30 rounded-xl transition-all duration-200 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              required
            />
            {formData.username.length > 2 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in duration-200">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email Address
          </Label>
          <div className="relative">
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                focusedField === "email"
                  ? "text-[#6C5CE7]"
                  : "text-muted-foreground"
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="pl-11 h-12 border-2 border-border bg-muted/30 rounded-xl transition-all duration-200 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              required
            />
            {formData.email.includes("@") && formData.email.includes(".") && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in duration-200">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                focusedField === "password"
                  ? "text-[#6C5CE7]"
                  : "text-muted-foreground"
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="pl-11 pr-11 h-12 border-2 border-border bg-muted/30 rounded-xl transition-all duration-200 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Strength */}
          {formData.password.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength() >= level
                        ? strengthColors[passwordStrength()]
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength:{" "}
                <span
                  className={`font-medium ${
                    passwordStrength() === 3
                      ? "text-green-500"
                      : passwordStrength() === 2
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {strengthLabels[passwordStrength()]}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Re-enter Password
          </Label>
          <div className="relative">
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                focusedField === "confirmPassword"
                  ? "text-[#6C5CE7]"
                  : "text-muted-foreground"
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>

            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
              className="pl-11 pr-11 h-12 border-2 border-border bg-muted/30 rounded-xl transition-all duration-200 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {showConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>

            {/* Checkmark or Error */}
            {formData.confirmPassword.length > 0 && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                {passwordsMatch ? (
                  <Check className="w-5 h-5 text-green-500 animate-in fade-in zoom-in" />
                ) : (
                  <X className="w-5 h-5 text-red-500 animate-in fade-in zoom-in" />
                )}
              </div>
            )}
          </div>

          {/* Match Error */}
          {formData.confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-2">
              Passwords do not match
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Referal Code
          </Label>
          <div className="relative">
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                focusedField === "referalCode"
                  ? "text-[#6C5CE7]"
                  : "text-muted-foreground"
              }`}
            >
              <Gift className="w-5 h-5" />
            </div>

            <Input
              id="referalCode"
              type="text"
              placeholder="Enter Referal Code"
              value={formData.referralCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  referralCode: e.target.value,
                })
              }
              onFocus={() => setFocusedField("referralCode")}
              onBlur={() => setFocusedField(null)}
              className="pl-11 pr-11 h-12 border-2 border-border bg-muted/30 rounded-xl transition-all duration-200 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              
            />
          </div>
        </div>

        {/* Terms */}
        {/* <p className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our{" "}
          <Link href="#" className="text-[#6C5CE7] hover:underline font-medium">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-[#6C5CE7] hover:underline font-medium">
            Privacy Policy
          </Link>
        </p> */}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading || !passwordsMatch}
          className="w-full h-12 bg-[#F5C842] hover:bg-[#E5B832] text-[#2D3436] font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#F5C842]/30 disabled:opacity-70"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-[#2D3436]/30 border-t-[#2D3436] rounded-full animate-spin" />
              <span>Creating account...</span>
            </div>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <p className="text-center relative text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Button
          onClick={() => {
            router.push("/auth/login");
          }}
          className="text-[#6C5CE7]  bg-transparent hover:bg-transparent cursor-pointer hover:underline font-semibold transition-colors duration-200"
        >
          Sign in
        </Button>
      </p>
    </div>
  );
}

"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic
    console.log({ email, password, rememberMe })
  }

  return (
    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
  
        <div className="flex flex-col leading-tight">
          <span className="text-indigo-600 font-semibold text-sm">Jemil</span>
           <span className="text-indigo-600 font-semibold text-sm">Marketplace</span>
        </div>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Login with your email</h1>
      <p className="text-gray-600 mb-6">
        Don't have an Account?{" "}
        <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Create Account
        </Link>
      </p>

      {/* Form */}
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
              Remember me?
            </label>
          </div>
          <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-base"
        >
          Login
        </Button>
      </form>
    </div>
  )
}

function YBLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Y shape forming into B */}
      <path
        d="M10 10 L25 28 L25 40"
        stroke="#6366f1"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M25 10 L25 28"
        stroke="#6366f1"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M25 18 C35 18 40 22 40 28 C40 34 35 38 25 38"
        stroke="#6366f1"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M25 28 C33 28 36 31 36 34 C36 37 33 40 25 40"
        stroke="#6366f1"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function HeroSection() {
  const router = useRouter();
  return (
    <section className="relative bg-[#6C5CE7] px-10 min-h-screen py-2 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-12 left-6 w-3 h-3 border-2 border-white/30 rounded-full" />
      <div className="absolute top-20 left-[45%] text-white/40">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <div className="absolute bottom-32 left-8 w-3 h-3 border-2 border-white/30 rounded-sm rotate-45" />

      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6C5CE7] rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">JM</span>
            </div>
            <span className="text-[#6C5CE7] font-semibold text-sm">
              Jemil  Marketplace
              <br />
              marketplace
            </span>
          </div>
        </div>
        <Button
          onClick={() => router.push("/auth/login")}
          className="bg-[#6C5CE7] hover:bg-[#5B4ED6] text-white border border-white/30 rounded-full px-6"
        >
          Log In
        </Button>
      </header>

      {/* Hero Content */}
      <div className="container mx-auto px-6 py-12 grid lg:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-6">
          <p className="text-sm font-medium tracking-wide">
            Best • Long Lasting • Strong
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
            Marketplace
            <br />
            for Unique Accounts
          </h1>
          <p className="text-white/80 text-lg">
            One stop shop for all social accounts.
          </p>
          <div className="flex gap-4 pt-4">
            <Button
              onClick={() => router.push("/auth/register")}
              className="bg-[#F5C842] hover:bg-[#E5B832] cursor-pointer text-[#2D3436] font-semibold px-8 rounded-lg"
            >
              Register
            </Button>
            <Button
              onClick={() => router.push("/auth/login")}
              variant="outline"
              className="bg-transparent border-2 border-white cursor-pointer text-white hover:bg-white/10 px-8 rounded-lg"
            >
              Login
            </Button>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative flex justify-center lg:justify-end">
          {/* <Image
            src="/startup-team-with-rocket-laptop-coins-illustration.jpg"
            alt="Marketplace illustration"
            width={450}
            height={350}
            className="object-contain"
          /> */}
          {/* Green checkmark */}
          <div className="absolute top-4 right-[30%] w-8 h-8 bg-[#00B894] rounded-full flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Curved bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path
            d="M0 80V60C240 20 480 0 720 0C960 0 1200 20 1440 60V80H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

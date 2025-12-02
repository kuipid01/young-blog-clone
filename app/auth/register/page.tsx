import { RegisterForm } from "@/components/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#6C5CE7] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-4 h-4 border-2 border-white/20 rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-3 h-3 border-2 border-white/30 rounded-sm rotate-45 animate-bounce" />
      <div className="absolute bottom-40 left-20 w-5 h-5 border-2 border-white/20 rounded-full" />
      <div className="absolute top-60 left-[30%] text-white/20">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <div className="absolute bottom-60 right-[25%] text-white/15">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 transition-transform duration-300 group-hover:scale-105">
            <div className="w-6 h-6 bg-[#6C5CE7] rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">JM</span>
            </div>
            <span className="text-[#6C5CE7] font-semibold text-sm leading-tight">
              Jemil
              <br />
              marketplace
            </span>
          </div>
        </Link>
        <Link href="/" className="text-white/80 hover:text-white transition-colors duration-200 text-sm font-medium">
          Back to Home
        </Link>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-lg">
          <RegisterForm />
        </div>
      </div>

      {/* Curved bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path d="M0 120V80C360 20 720 0 1080 20C1260 30 1380 50 1440 80V120H0Z" fill="white" fillOpacity="0.1" />
        </svg>
      </div>
    </main>
  )
}

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

function ResetPasswordPageContent() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image - matching login page style */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/shanghai-skyline-at-dusk-with-city-lights-and-rive.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-indigo-900/20" />

      {/* Reset Password Card */}
      <ResetPasswordForm />
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  )
}

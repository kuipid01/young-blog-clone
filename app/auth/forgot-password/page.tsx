import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
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

      {/* Forgot Password Card */}
      <ForgotPasswordForm />
    </main>
  );
}

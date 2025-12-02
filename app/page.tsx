import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/shanghai-skyline-at-dusk-with-city-lights-and-rive.jpg')",
        }}
      />

      {/* Login Card */}
      <LoginForm />
    </main>
  )
}

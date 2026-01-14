import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardHome } from "../../components/dashboard-home"
import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading Dashboard...</div>}>
        <DashboardHome />
      </Suspense>
    </DashboardLayout>
  )
}

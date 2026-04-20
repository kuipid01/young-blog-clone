import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AutomaticFundingContent } from "../../../components/automatic-funding"
import { Suspense } from "react"

const AutomaticFundingLoader = () => (
  <div className="flex justify-center items-center h-96 w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse">
    <p className="text-xl text-gray-400">Loading Payment Details...</p>
  </div>
);

export default function AutomaticFundingPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<AutomaticFundingLoader />}>
        <AutomaticFundingContent />
      </Suspense>
    </DashboardLayout>
  )
}

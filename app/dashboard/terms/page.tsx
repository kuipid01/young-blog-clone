import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { OrdersContent } from "../../../components/order-component"
import { TermsContent } from "../../../components/terms-component"

export default function ReferralPage() {
  return (
    <DashboardLayout>
      <TermsContent />
    </DashboardLayout>
  )
}

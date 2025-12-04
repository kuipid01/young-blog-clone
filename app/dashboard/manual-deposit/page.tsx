import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ManualDepositContent } from "../../../components/manual-eposit";
import { Suspense } from "react";

const DepositLoader = () => (
  <div className="flex justify-center items-center h-96 w-full max-w-4xl bg-white rounded-xl shadow-lg animate-pulse">
    <p className="text-xl text-gray-400">Loading Deposit Instructions...</p>
  </div>
);

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<DepositLoader />}>
     
        <ManualDepositContent />
      </Suspense>
    </DashboardLayout>
  );
}

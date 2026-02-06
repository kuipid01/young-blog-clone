
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AffiliateContent } from "@/components/affiliate/affiliate-content";

export default function AffiliatePage() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <AffiliateContent />
            </div>
        </DashboardLayout>
    );
}

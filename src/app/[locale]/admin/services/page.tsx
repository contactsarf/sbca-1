import { getServices } from "./actions";
import { Plus, Info } from "lucide-react";
import { getLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ServicesList from "@/components/admin/ServicesList";

export default async function ServicesPage() {
    const services = await getServices();
    const locale = await getLocale();

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Services"
                description="Manage the services you offer to your clients."
                action={{
                    href: `/${locale}/admin/services/new`,
                    label: "Add Service",
                    icon: Plus,
                }}
            />

            {/* Important reminder about cleanup time */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Service Duration Best Practice</p>
                    <p className="text-sm text-blue-700 mt-1">
                        When setting service durations, remember to include cleanup and preparation time between appointments. 
                        This ensures smooth operations and prevents scheduling conflicts in the booking system.
                    </p>
                </div>
            </div>

            <ServicesList services={services} locale={locale} />
        </div>
    );
}

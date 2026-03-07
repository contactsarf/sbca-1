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



            <ServicesList services={services} locale={locale} />
        </div>
    );
}

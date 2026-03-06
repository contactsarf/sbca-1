import { getServices } from "./actions";
import Link from "next/link";
import { Plus, Clock, DollarSign } from "lucide-react";
import { getLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

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

            {services.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                    <p className="text-tertiary mb-4">You haven't added any services yet.</p>
                    <Link
                        href={`/${locale}/admin/services/new`}
                        className="text-primary font-medium hover:underline"
                    >
                        Create your first service
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">{service.name}</h3>
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shadow-sm ${service.is_paused ? 'bg-danger' : 'bg-success'}`}
                                        title={service.is_paused ? 'Paused' : 'Active'}
                                    />
                                </div>
                                <p className="text-sm text-tertiary mb-4 line-clamp-2 h-10">
                                    {service.description || "No description provided."}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-foreground font-medium border-t border-slate-50 pt-4">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-tertiary" />
                                        {service.duration_minutes} min
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-tertiary" />
                                        ${service.price}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-b-xl flex items-center justify-between border-t border-slate-200">
                                <div className="text-xs text-tertiary">
                                    {service.deposit_percentage
                                        ? `${service.deposit_percentage}% deposit required`
                                        : "No deposit required"}
                                </div>
                                <Link
                                    href={`/${locale}/admin/services/${service.id}`}
                                    className="text-sm font-medium text-primary hover:text-primary-dark"
                                >
                                    Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, DollarSign, X } from "lucide-react";

type Service = {
    id: string;
    name: string;
    description?: string | null;
    duration_minutes: number;
    price: number;
    deposit_percentage?: number | null;
    is_paused: boolean;
};

interface ServicesListProps {
    services: Service[];
    locale: string;
}

export default function ServicesList({ services, locale }: ServicesListProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredServices = services.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!services || services.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                <p className="text-tertiary mb-4">You haven't added any services yet.</p>
                <Link
                    href={`/${locale}/admin/services/new`}
                    className="text-primary font-medium hover:underline"
                >
                    Create your first service
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Search Box */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {filteredServices.length === 0 && searchTerm ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/10 rounded-2xl bg-white/50">
                    <Clock className="w-8 h-8 text-tertiary mb-3" />
                    <h3 className="text-sm font-medium text-tertiary">No results found</h3>
                    <p className="text-xs text-tertiary/70 text-center mt-1">
                        No services match "{searchTerm}"
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="relative bg-gradient-to-br from-white via-white to-primary/5 border border-slate-200 rounded-xl shadow-sm hover:border-primary/30 transition-all flex flex-col overflow-hidden"
                        >
                            {/* Gradient overlay in corner */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
                            
                            <div className="relative p-6 flex-1">
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
                            <div className="relative p-4 bg-slate-50 rounded-b-xl flex items-center justify-between border-t border-slate-200">
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
        </>
    );
}

"use client";

import { useTransition, useState, useEffect } from "react";
import { upsertService, getService, deleteService } from "../actions";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Info, Trash2 } from "lucide-react";
import Link from "next/link";
import { Service } from "@/types";
import { DURATION_OPTIONS } from "@/constants/durations";

export default function EditServicePage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [service, setService] = useState<Service | null>(null);
    const [selectedDeposit, setSelectedDeposit] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;
    const id = params.id as string;

    useEffect(() => {
        async function loadService() {
            const data = await getService(id);
            if (data) {
                setService(data);
                setSelectedDeposit(data.deposit_percentage?.toString() || "");
            } else {
                setError("Service not found");
            }
            setLoading(false);
        }
        loadService();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await upsertService(formData, locale, id);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return;

        startTransition(async () => {
            const result = await deleteService(id, locale);
            if (result?.error) {
                setError(result.error);
            } else {
                router.push(`/${locale}/admin/services`);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!service && !loading) {
        return (
            <div className="text-center py-12">
                <p className="text-tertiary">Service not found.</p>
                <Link href={`/${locale}/admin/services`} className="text-primary hover:underline mt-4 inline-block">
                    Back to services
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    href={`/${locale}/admin/services`}
                    className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to services
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 text-sm text-danger hover:text-danger-dark transition-colors font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Service
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h1 className="text-2xl font-semibold text-foreground">Edit Service</h1>
                    <p className="text-sm text-tertiary">Update the details and configuration for this service.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Service Name */}
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                                Service Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                defaultValue={service?.name}
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                defaultValue={service?.description}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Duration */}
                            <div>
                                <label htmlFor="duration_minutes" className="block text-sm font-semibold text-foreground mb-2">
                                    Duration
                                </label>
                                <select
                                    id="duration_minutes"
                                    name="duration_minutes"
                                    defaultValue={service?.duration_minutes}
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    {DURATION_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price */}
                            <div>
                                <label htmlFor="price" className="block text-sm font-semibold text-foreground mb-2">
                                    Price ($)
                                </label>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={service?.price}
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Deposit Required Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                Deposit Required
                            </label>
                            <div className="flex overflow-x-auto pb-2 gap-3 scrollbar-hide -mx-1 px-1">
                                {[
                                    { label: "None", value: "" },
                                    { label: "10%", value: "10" },
                                    { label: "25%", value: "25" },
                                    { label: "50%", value: "50" },
                                    { label: "100%", value: "100" },
                                ].map((option) => (
                                    <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => setSelectedDeposit(option.value)}
                                        className={`py-2 px-6 text-sm font-medium rounded-lg border whitespace-nowrap transition-all flex-shrink-0 ${selectedDeposit === option.value
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-white text-tertiary border-slate-200 hover:border-primary hover:text-primary"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="deposit_percentage" value={selectedDeposit} />
                            <p className="mt-2 text-xs text-tertiary flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Percentage of price required upfront.
                            </p>
                        </div>

                        {/* Pause Flag */}
                        <div className="flex items-end pb-2">
                            <label className="flex items-center cursor-pointer gap-3">
                                <input
                                    type="checkbox"
                                    name="is_paused"
                                    defaultChecked={service?.is_paused}
                                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-foreground">
                                    Pause service
                                </span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm italic">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-4 border-t border-slate-100 pt-8">
                        <Link
                            href={`/${locale}/admin/services`}
                            className="h-10 px-6 rounded-lg font-medium text-tertiary hover:bg-slate-50 transition-colors flex items-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-primary text-white hover:bg-primary-dark h-10 px-8 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

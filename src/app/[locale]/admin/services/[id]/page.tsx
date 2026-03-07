"use client";

import { useTransition, useState, useEffect } from "react";
import { upsertService, getService, deleteService } from "../actions";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Info, Trash2, FileText, HandCoins, Users, Activity, Check, Phone } from "lucide-react";
import Link from "next/link";
import { Service } from "@/types";
import { DURATION_OPTIONS } from "@/constants/durations";
import { createClient } from "@/lib/supabase/client";

type TeamMemberOption = {
    id: string;
    name: string;
    avatar_url?: string | null;
};

export default function EditServicePage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [service, setService] = useState<Service | null>(null);
    const [selectedDeposit, setSelectedDeposit] = useState<string>("");
    const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
    const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);
    const [loading, setLoading] = useState(true);
    const [paymentsConfigured, setPaymentsConfigured] = useState(false);
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

    useEffect(() => {
        const fetchTeamMembers = async () => {
            const supabase = createClient();
            const [
                { data: membersData, error: membersError },
                { data: mappingData, error: mappingError },
                { data: tenantData }
            ] = await Promise.all([
                supabase.from("teams").select("id, name, avatar_url").order("name", { ascending: true }),
                supabase.from("service_team_members").select("team_member_id").eq("service_id", id),
                supabase.from("tenants").select("stripe_connect_status, interac_email").single()
            ]);

            if (membersError) {
                console.error("Error loading team members:", membersError);
            } else {
                setTeamMembers(membersData ?? []);
            }

            if (mappingError) {
                console.error("Error loading service assignments:", mappingError);
            } else {
                setSelectedTeamMembers((mappingData ?? []).map((row) => row.team_member_id));
            }

            const hasStripe = tenantData?.stripe_connect_status === "active";
            const hasInterac = !!tenantData?.interac_email;
            setPaymentsConfigured(hasStripe || hasInterac);

            setLoadingTeamMembers(false);
        };

        fetchTeamMembers();
    }, [id]);

    const toggleTeamMember = (teamMemberId: string) => {
        setSelectedTeamMembers((prev) =>
            prev.includes(teamMemberId)
                ? prev.filter((memberId) => memberId !== teamMemberId)
                : [...prev, teamMemberId]
        );
    };

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

            <div className="relative bg-white border border-primary/10 rounded-[40px] shadow-sm overflow-hidden translate-z-0">
                <div className="relative p-6 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-primary tracking-tight">Edit Service</h1>
                        <p className="text-sm text-tertiary font-medium">Configure your service details and preferences.</p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-bold text-xs ${service?.is_paused ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                        <div className={`w-2 h-2 rounded-full ${service?.is_paused ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                        {service?.is_paused ? "Paused" : "Active"}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="relative p-8 space-y-12">
                    {/* Section: General Details */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-primary/5">
                            <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h2 className="font-black text-primary uppercase tracking-widest text-xs">General Details</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Service Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    defaultValue={service?.name}
                                    required
                                    className="w-full p-4 rounded-2xl bg-background border-none focus:ring-2 focus:ring-primary font-medium transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="description" className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    defaultValue={service?.description}
                                    className="w-full p-4 rounded-2xl bg-background border-none focus:ring-2 focus:ring-primary font-medium transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="prep_notes" className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Appointment Preparation</label>
                                <textarea
                                    id="prep_notes"
                                    name="prep_notes"
                                    rows={2}
                                    defaultValue={service?.prep_notes ?? ""}
                                    placeholder="Notes for clients (e.g. Please arrive 10 mins early)"
                                    className="w-full p-4 rounded-2xl bg-background border-none focus:ring-2 focus:ring-primary font-medium transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Pricing & Duration */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-primary/5">
                            <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                <HandCoins className="w-4 h-4" />
                            </div>
                            <h2 className="font-black text-primary uppercase tracking-widest text-xs">Pricing & Duration</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="duration_minutes" className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Duration</label>
                                <select
                                    id="duration_minutes"
                                    name="duration_minutes"
                                    defaultValue={service?.duration_minutes}
                                    required
                                    className="w-full p-4 rounded-2xl bg-background border-none focus:ring-2 focus:ring-primary font-medium appearance-none transition-all"
                                >
                                    {DURATION_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-primary/40 font-bold uppercase tracking-wider px-1">Include cleanup/prep time to prevent overlaps.</p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="price" className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Price ($)</label>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={service?.price}
                                    required
                                    className="w-full p-4 rounded-2xl bg-background border-none focus:ring-2 focus:ring-primary font-medium transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Required Deposit</label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
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
                                        className={`p-4 rounded-2xl border-2 transition-all text-xs font-bold ${selectedDeposit === option.value
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                            : "bg-background text-tertiary border-transparent hover:border-primary/20"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="deposit_percentage" value={selectedDeposit} />

                            {!paymentsConfigured && selectedDeposit !== "" && (
                                <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 space-y-4 animate-in zoom-in duration-300">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-primary">Payment Method Required</p>
                                            <p className="text-xs text-tertiary font-medium leading-relaxed">
                                                To collect deposits, you must configure at least one payment method (Stripe or Interac e-Transfer) in your settings.
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/${locale}/admin/settings?tab=public`}
                                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-primary/10 text-xs font-black text-primary uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm"
                                    >
                                        <HandCoins className="w-4 h-4" /> Setup Payments
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Team Assignment */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-primary/5">
                            <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                <Users className="w-4 h-4" />
                            </div>
                            <h2 className="font-black text-primary uppercase tracking-widest text-xs">Team Assignment</h2>
                        </div>

                        {loadingTeamMembers ? (
                            <div className="h-20 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {teamMembers.map((member) => {
                                    const isSelected = selectedTeamMembers.includes(member.id);
                                    return (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => toggleTeamMember(member.id)}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${isSelected
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                : "bg-background text-foreground border-transparent hover:border-primary/20"
                                                }`}
                                        >
                                            <div className="relative">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.name} className="w-12 h-12 rounded-xl object-cover" />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${isSelected ? "bg-white text-primary" : "bg-primary/10 text-primary"}`}>
                                                        {member.name.charAt(0)}
                                                    </div>
                                                )}
                                                {isSelected && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center shadow-lg border border-primary animate-in zoom-in">
                                                        <Check className="w-3 h-3" strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold truncate">{member.name}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${isSelected ? "text-white" : "text-tertiary"}`}>
                                                    {isSelected ? "Assigned" : "Tap to assign"}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <input type="hidden" name="team_member_ids" value={JSON.stringify(selectedTeamMembers)} />
                    </div>

                    {/* Section: Service Status */}
                    <div className="p-8 rounded-[32px] bg-primary text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl transition-transform group-hover:scale-150 duration-700" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-widest">Service Visibility</h3>
                                <p className="text-sm text-white/70 font-medium max-w-sm">
                                    When paused, clients won't be able to book this service online. You can still manage it from the admin panel.
                                </p>
                            </div>

                            <label className="relative flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_paused"
                                    defaultChecked={service?.is_paused}
                                    className="sr-only peer"
                                />
                                <div className="w-16 h-8 bg-white/20 rounded-full peer peer-focus:ring-4 peer-focus:ring-white/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-emerald-500 shadow-inner" />
                                <span className="ml-4 text-lg font-black uppercase tracking-widest">
                                    {service?.is_paused ? "Paused" : "Active"}
                                </span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm italic">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-6 border-t border-primary/10 pt-10">
                        <Link
                            href={`/${locale}/admin/services`}
                            className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs text-tertiary hover:bg-background transition-all flex items-center"
                        >
                            Cancel Changes
                        </Link>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-primary text-white shadow-xl shadow-primary/30 h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isPending ? "Saving..." : "Save Service"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

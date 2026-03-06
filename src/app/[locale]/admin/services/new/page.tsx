"use client";

import { useEffect, useTransition, useState } from "react";
import { upsertService } from "../actions";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import Link from "next/link";
import { DURATION_OPTIONS } from "@/constants/durations";
import { createClient } from "@/lib/supabase/client";

type TeamMemberOption = {
    id: string;
    name: string;
    avatar_url?: string | null;
};

export default function NewServicePage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [selectedDeposit, setSelectedDeposit] = useState<string>("");
    const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
    const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;

    useEffect(() => {
        const fetchTeamMembers = async () => {
            const supabase = createClient();
            const { data, error: fetchError } = await supabase
                .from("teams")
                .select("id, name, avatar_url")
                .order("name", { ascending: true });

            if (fetchError) {
                console.error("Error loading team members:", fetchError);
                setTeamMembers([]);
            } else {
                setTeamMembers(data ?? []);
            }
            setLoadingTeamMembers(false);
        };

        fetchTeamMembers();
    }, []);

    const toggleTeamMember = (teamMemberId: string) => {
        setSelectedTeamMembers((prev) =>
            prev.includes(teamMemberId)
                ? prev.filter((id) => id !== teamMemberId)
                : [...prev, teamMemberId]
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await upsertService(formData, locale);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link
                href={`/${locale}/admin/services`}
                className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to services
            </Link>

            <div className="relative bg-gradient-to-br from-white via-white to-primary/5 border border-primary/10 rounded-xl shadow-sm overflow-hidden">
                {/* Gradient overlay in corner */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="relative p-6 border-b border-primary/10 bg-primary/5">
                    <h1 className="text-2xl font-semibold text-foreground">Add New Service</h1>
                    <p className="text-sm text-tertiary">Define the details and pricing for your new offering.</p>
                </div>

                <form onSubmit={handleSubmit} className="relative p-8 space-y-8">
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
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="e.g. Full Facial Treatment"
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
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="Describe what the service includes..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="prep_notes" className="block text-sm font-semibold text-foreground mb-2">
                               Appointment Preparation (notes for clients)
                            </label>
                            <textarea
                                id="prep_notes"
                                name="prep_notes"
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="Any preparation notes or guidance clients should know before booking."
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
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    defaultValue="60"
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
                                <div className="relative">
                                    <input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="95.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deposit Required Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                Deposit Required
                            </label>
                            <div className="flex flex-wrap gap-3">
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

                        {/* Assigned Staff */}
                        <div className="md:col-span-2 mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-foreground">
                                    Assigned Staff
                                </label>
                                <span className="text-xs text-tertiary">
                                    {selectedTeamMembers.length} selected
                                </span>
                            </div>
                            {loadingTeamMembers ? (
                                <div className="text-sm text-tertiary">
                                    Loading team members...
                                </div>
                            ) : teamMembers.length === 0 ? (
                                <div className="text-sm text-tertiary">
                                    No team members found yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {teamMembers.map((member) => {
                                        const isSelected = selectedTeamMembers.includes(member.id);
                                        return (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => toggleTeamMember(member.id)}
                                                aria-pressed={isSelected}
                                                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${isSelected
                                                    ? "border-primary bg-primary/10"
                                                    : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {member.avatar_url ? (
                                                    <img
                                                        src={member.avatar_url}
                                                        alt={member.name}
                                                        className="h-9 w-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${isSelected
                                                        ? "bg-primary text-white"
                                                        : "bg-primary/10 text-primary"
                                                        }`}>
                                                        {member.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-xs text-tertiary">
                                                        Tap to {isSelected ? "remove" : "assign"}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <input
                                type="hidden"
                                name="team_member_ids"
                                value={JSON.stringify(selectedTeamMembers)}
                            />
                            <p className="mt-2 text-xs text-tertiary">
                                Assign team members who can deliver this service.
                            </p>
                        </div>

                        {/* Pause Flag */}
                        <div className="flex items-end pb-2">
                            <label className="flex items-center cursor-pointer gap-3">
                                <input
                                    type="checkbox"
                                    name="is_paused"
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
                            {isPending ? "Creating..." : "Create Service"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import { useTransition, useState, useEffect } from "react";
import { upsertTeamMember, deleteTeamMember } from "../actions";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "@/components/admin/AvatarUpload";
import ConfirmationModal from "@/components/ConfirmationModal";

type ServiceOption = {
    id: string;
    name: string;
    duration_minutes: number;
};

export default function EditTeamMemberPage() {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [services, setServices] = useState<ServiceOption[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [serviceSearchTerm, setServiceSearchTerm] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;
    const id = params.id as string;

    useEffect(() => {
        const fetchMember = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("teams")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching member:", error);
                router.push(`/${locale}/admin/teams`);
            } else {
                setMember(data);
            }
            setLoading(false);
        };

        fetchMember();
    }, [id, locale, router]);

    useEffect(() => {
        const fetchServices = async () => {
            const supabase = createClient();
            const [{ data: servicesData, error: servicesError }, { data: mappingData, error: mappingError }] = await Promise.all([
                supabase.from("services").select("id, name, duration_minutes").order("name", { ascending: true }),
                supabase.from("service_team_members").select("service_id").eq("team_member_id", id),
            ]);

            if (servicesError) {
                console.error("Error loading services:", servicesError);
            } else {
                setServices(servicesData ?? []);
            }

            if (mappingError) {
                console.error("Error loading member services:", mappingError);
            } else {
                setSelectedServices((mappingData ?? []).map((row) => row.service_id));
            }

            setLoadingServices(false);
        };

        fetchServices();
    }, [id]);

    const toggleService = (serviceId: string) => {
        setSelectedServices((prev) =>
            prev.includes(serviceId)
                ? prev.filter((currentId) => currentId !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        if (avatarFile) {
            formData.append("avatar_file", avatarFile);
        }

        startTransition(async () => {
            const result = await upsertTeamMember(formData, locale, id);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        setError(null);

        const result = await deleteTeamMember(id, locale);
        if (result?.error) {
            setError(result.error);
            setIsDeleting(false);
            setShowDeleteModal(false);
        } else {
            router.push(`/${locale}/admin/teams`);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
    }

    if (!member) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <header className="flex items-center">
                <Link
                    href={`/${locale}/admin/teams`}
                    className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to team
                </Link>
            </header>

            <div className="relative bg-gradient-to-br from-white via-white to-primary/5 border border-primary/10 rounded-xl shadow-sm overflow-hidden">
                {/* Gradient overlay in corner */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="relative p-6 border-b border-primary/10 bg-primary/5">
                    <h1 className="text-2xl font-semibold text-foreground">Edit Team Member</h1>
                    <p className="text-sm text-tertiary">Keep your team member's profile up to date.</p>
                </div>

                <form onSubmit={handleSubmit} className="relative p-8 space-y-8">
                    <div className="space-y-8">
                        {/* Avatar Upload */}
                        <AvatarUpload
                            defaultValue={member.avatar_url}
                            name={member.name}
                            onFileSelect={setAvatarFile}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    defaultValue={member.name}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>

                            {/* Joined Date */}
                            <div>
                                <label htmlFor="joined_date" className="block text-sm font-semibold text-foreground mb-2">
                                    Joined Date
                                </label>
                                <input
                                    id="joined_date"
                                    name="joined_date"
                                    type="date"
                                    required
                                    defaultValue={member.joined_date}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Bio */}
                            <div className="md:col-span-2">
                                <label htmlFor="bio" className="block text-sm font-semibold text-foreground mb-2">
                                    Professional Bio
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={4}
                                    defaultValue={member.bio}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Tell us about their expertise..."
                                />
                            </div>

                            {/* Services */}
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-foreground">
                                        Services Offered
                                    </label>
                                    <span className="text-xs text-tertiary">
                                        {selectedServices.length} selected
                                    </span>
                                </div>
                                <p className="mb-3 text-xs text-tertiary">
                                    Assign services this team member can perform.
                                </p>
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={serviceSearchTerm}
                                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                                    className="w-full mb-4 px-3 py-2 border border-primary/20 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                                {loadingServices ? (
                                    <div className="text-sm text-tertiary">
                                        Loading services...
                                    </div>
                                ) : services.length === 0 ? (
                                    <div className="text-sm text-tertiary">
                                        No services available yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {services
                                            .filter(
                                                (service) =>
                                                    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
                                            )
                                            .map((service) => {
                                            const isSelected = selectedServices.includes(service.id);
                                            return (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => toggleService(service.id)}
                                                    aria-pressed={isSelected}
                                                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${isSelected
                                                        ? "border-primary bg-primary/10"
                                                        : "border-primary/10 bg-primary/5 hover:border-primary/40 hover:bg-primary/10"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {isSelected ? (
                                                            <span className="h-5 w-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                                                                ✓
                                                            </span>
                                                        ) : (
                                                            <span className="h-5 w-5 rounded-full border border-slate-300"></span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-foreground truncate">
                                                            {service.name}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-medium text-tertiary flex-shrink-0">
                                                        {service.duration_minutes} min
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                <input
                                    type="hidden"
                                    name="service_ids"
                                    value={JSON.stringify(selectedServices)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm italic">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 border-t border-primary/10 pt-8">
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 text-sm text-danger hover:text-danger-dark transition-colors font-medium disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting ? "Deleting..." : "Delete Member"}
                        </button>
                        <div className="flex items-center gap-4">
                        <Link
                            href={`/${locale}/admin/teams`}
                            className="h-10 px-6 rounded-lg font-medium text-tertiary hover:bg-primary/10 transition-colors flex items-center shadow-sm"
                        >
                            Cancel
                        </Link>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="bg-primary text-white hover:bg-primary-dark h-10 px-8 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Delete Team Member"
                description="This action cannot be undone. The team member will be permanently removed from your system."
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
                isLoading={isDeleting}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}

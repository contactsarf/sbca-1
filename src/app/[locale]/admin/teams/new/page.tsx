"use client";

import { useTransition, useState } from "react";
import { upsertTeamMember } from "../actions";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import AvatarUpload from "@/components/admin/AvatarUpload";

export default function NewTeamMemberPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        if (avatarFile) {
            formData.append("avatar_file", avatarFile);
        }

        startTransition(async () => {
            const result = await upsertTeamMember(formData, locale);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link
                href={`/${locale}/admin/teams`}
                className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-foreground transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to team
            </Link>

            <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-primary/10 bg-primary/5">
                    <h1 className="text-2xl font-semibold text-foreground">Add Team Member</h1>
                    <p className="text-sm text-tertiary">Introduce a new member to your professional team.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="space-y-8">
                        {/* Avatar Upload */}
                        <AvatarUpload name={name} onFileSelect={setAvatarFile} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="e.g. Jane Doe"
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
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Tell us about their expertise..."
                                />
                            </div>

                            {/* Joined Date */}
                            <div className="md:col-span-2">
                                <label htmlFor="joined_date" className="block text-sm font-semibold text-foreground mb-2">
                                    Joined Date
                                </label>
                                <input
                                    id="joined_date"
                                    name="joined_date"
                                    type="date"
                                    required
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm italic">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-4 border-t border-primary/10 pt-8">
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
                            {isPending ? "Adding..." : "Add Member"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

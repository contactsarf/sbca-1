"use client";

import { useState } from "react";
import { Plus, Users, X } from "lucide-react";
import Link from "next/link";
import TeamMemberAvatar from "@/components/admin/TeamMemberAvatar";
import TeamScheduleModal from "@/components/admin/TeamScheduleModal";

type TeamMember = {
    id: string;
    name: string;
    bio?: string | null;
    avatar_url?: string | null;
    joined_date: string;
};

interface TeamsListProps {
    teams: TeamMember[];
    locale: string;
}

export default function TeamsList({ teams, locale }: TeamsListProps) {
    const [scheduleFor, setScheduleFor] = useState<TeamMember | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    if (!teams || teams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/10 rounded-2xl bg-white/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No team members yet</h3>
                <p className="text-sm text-tertiary text-center max-w-xs mt-1">
                    Start building your team to manage bookings and assignments.
                </p>
                <Link
                    href={`/${locale}/admin/teams/new`}
                    className="mt-6 text-primary text-sm font-medium hover:underline"
                >
                    Add your first member
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
                    placeholder="Search team members..."
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

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {teams
                    .filter((member) =>
                        member.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((member) => (
                    <div
                        key={member.id}
                        className="group relative bg-gradient-to-br from-white via-white to-primary/5 border border-primary/10 rounded-2xl hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                    >
                        {/* Gradient overlay in corner */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
                        
                        {/* Card body — clickable to edit */}
                        <Link
                            href={`/${locale}/admin/teams/${member.id}`}
                            className="relative flex flex-col items-center gap-3 p-6 pb-4 text-center"
                        >
                            <TeamMemberAvatar src={member.avatar_url} name={member.name} size="xl" />
                            <div className="min-w-0 w-full">
                                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {member.name}
                                </h3>
                                <p className="text-sm text-tertiary">
                                    Joined {new Date(member.joined_date).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>

                        {member.bio && (
                            <p className="relative px-6 pb-4 text-sm text-tertiary line-clamp-2 italic text-center">
                                {member.bio}
                            </p>
                        )}

                        {/* Card footer actions */}
                        <div className="relative px-6 pb-4 pt-3 border-t border-primary/5 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setScheduleFor(member)}
                                aria-label={`Manage schedule for ${member.name}`}
                                className="text-sm font-medium text-primary hover:text-primary-dark hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Schedule
                            </button>

                            <Link
                                href={`/${locale}/admin/teams/${member.id}`}
                                aria-label={`Edit ${member.name}`}
                                className="text-sm font-medium text-tertiary hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Edit
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {searchTerm && teams.filter((member) =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/10 rounded-2xl bg-white/50">
                    <Users className="w-8 h-8 text-tertiary mb-3" />
                    <h3 className="text-sm font-medium text-tertiary">No results found</h3>
                    <p className="text-xs text-tertiary/70 text-center mt-1">
                        No team members match "{searchTerm}"
                    </p>
                </div>
            )}

            {/* Schedule Modal */}
            {scheduleFor && (
                <TeamScheduleModal
                    memberId={scheduleFor.id}
                    memberName={scheduleFor.name}
                    avatarUrl={scheduleFor.avatar_url}
                    isOpen={!!scheduleFor}
                    onClose={() => setScheduleFor(null)}
                />
            )}
        </>
    );
}

"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Plus, Users } from "lucide-react";
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((member) => (
                    <div
                        key={member.id}
                        className="group bg-white border border-primary/10 rounded-2xl hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                    >
                        {/* Card body — clickable to edit */}
                        <Link
                            href={`/${locale}/admin/teams/${member.id}`}
                            className="flex items-center gap-4 p-5 pb-4"
                        >
                            <TeamMemberAvatar src={member.avatar_url} name={member.name} />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {member.name}
                                </h3>
                                <p className="text-xs text-tertiary">
                                    Joined {new Date(member.joined_date).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>

                        {member.bio && (
                            <p className="px-5 pb-3 text-sm text-tertiary line-clamp-2 italic">
                                {member.bio}
                            </p>
                        )}

                        {/* Card footer actions */}
                        <div className="px-5 pb-4 pt-2 border-t border-primary/5 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => setScheduleFor(member)}
                                aria-label={`Manage schedule for ${member.name}`}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <CalendarDays className="w-3.5 h-3.5" />
                                Schedule
                            </button>

                            <Link
                                href={`/${locale}/admin/teams/${member.id}`}
                                aria-label={`Edit ${member.name}`}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-tertiary hover:bg-primary/10 hover:text-primary px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Schedule Modal */}
            {scheduleFor && (
                <TeamScheduleModal
                    memberId={scheduleFor.id}
                    memberName={scheduleFor.name}
                    isOpen={!!scheduleFor}
                    onClose={() => setScheduleFor(null)}
                />
            )}
        </>
    );
}

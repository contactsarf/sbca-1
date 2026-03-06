"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Clock } from "lucide-react";
import { getTeamMemberSchedule, upsertTeamMemberSchedule, type DaySchedule } from "@/lib/teams/schedule-actions";
import { useParams } from "next/navigation";

interface TeamScheduleModalProps {
    memberId: string;
    memberName: string;
    avatarUrl?: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const DAYS = [
    { label: "Sunday", short: "Sun", value: 0 },
    { label: "Monday", short: "Mon", value: 1 },
    { label: "Tuesday", short: "Tue", value: 2 },
    { label: "Wednesday", short: "Wed", value: 3 },
    { label: "Thursday", short: "Thu", value: 4 },
    { label: "Friday", short: "Fri", value: 5 },
    { label: "Saturday", short: "Sat", value: 6 },
];

export default function TeamScheduleModal({ memberId, memberName, avatarUrl, isOpen, onClose }: TeamScheduleModalProps) {
    const [schedules, setSchedules] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const params = useParams();
    const locale = params.locale as string;

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        setSaved(false);
        getTeamMemberSchedule(memberId).then((data) => {
            setSchedules(data);
            setLoading(false);
        });
    }, [isOpen, memberId]);

    const updateDay = (day: number, field: keyof DaySchedule, value: boolean | string) => {
        setSchedules((prev) =>
            prev.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s))
        );
        setSaved(false);
    };

    const handleSave = () => {
        setError(null);
        startTransition(async () => {
            const result = await upsertTeamMemberSchedule(memberId, schedules, locale);
            if (result?.error) {
                setError(result.error);
            } else {
                setSaved(true);
                setTimeout(onClose, 800);
            }
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="schedule-modal-title"
                className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
            >
                <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:w-[455px] lg:w-[525px] h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary/10 bg-primary/5">
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={memberName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                    {memberName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h2 id="schedule-modal-title" className="text-base font-semibold text-foreground">
                                    Weekly Schedule
                                </h2>
                                <p className="text-xs text-tertiary">{memberName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close schedule modal"
                            className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-tertiary transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 p-4 sm:p-6 sm:min-h-[480px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full min-h-[480px] sm:min-h-0">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2 sm:space-y-3">
                                {DAYS.map((day) => {
                                    const sched = schedules.find((s) => s.day_of_week === day.value)!;
                                    return (
                                        <div
                                            key={day.value}
                                            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${sched.is_available
                                                    ? "border-primary/20 bg-primary/5"
                                                    : "border-primary/10 bg-white opacity-60"
                                                }`}
                                        >
                                            {/* Flex row: Toggle + Day name + Time inputs (all on one row on tablet+) */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                {/* Toggle & Day Name - Fixed width column */}
                                                <div className="flex items-center gap-3 w-40 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={sched.is_available}
                                                        aria-label={`${day.label} availability`}
                                                        onClick={() => updateDay(day.value, "is_available", !sched.is_available)}
                                                        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${sched.is_available ? "bg-primary" : "bg-primary/20"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sched.is_available ? "translate-x-4" : "translate-x-0"
                                                                }`}
                                                        />
                                                    </button>
                                                    <span className="text-sm font-medium text-foreground whitespace-nowrap flex-1">
                                                        {day.label}
                                                    </span>
                                                </div>

                                                {/* Time range (inline on tablet+) */}
                                                {sched.is_available ? (
                                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                                                        <Clock className="w-3.5 h-3.5 text-tertiary shrink-0 hidden sm:block" />
                                                        <input
                                                            type="time"
                                                            value={sched.start_time}
                                                            onChange={(e) => updateDay(day.value, "start_time", e.target.value)}
                                                            aria-label={`${day.label} start time`}
                                                            className="px-2 py-1.5 sm:py-1 text-xs border border-primary/20 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white shrink-0"
                                                        />
                                                        <span className="text-xs text-tertiary shrink-0">–</span>
                                                        <input
                                                            type="time"
                                                            value={sched.end_time}
                                                            onChange={(e) => updateDay(day.value, "end_time", e.target.value)}
                                                            aria-label={`${day.label} end time`}
                                                            className="px-2 py-1.5 sm:py-1 text-xs border border-primary/20 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white shrink-0"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-tertiary italic">Day off</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-6 border-t border-primary/10 bg-white flex items-center justify-between gap-3">
                        {error && <p className="text-xs text-danger flex-1">{error}</p>}
                        {saved && !error && <p className="text-xs text-success flex-1">Saved!</p>}
                        {!error && !saved && <span className="flex-1" />}

                        <button
                            onClick={onClose}
                            className="h-9 px-5 text-sm font-medium text-tertiary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isPending || loading}
                            className="h-9 px-6 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {isPending ? "Saving…" : "Save Schedule"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

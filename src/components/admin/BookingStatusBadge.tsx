"use client";

interface BookingStatusBadgeProps {
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
}

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
    const configs = {
        pending: {
            label: "Pending",
            classes: "bg-amber-100 text-amber-700 border-amber-200",
        },
        confirmed: {
            label: "Confirmed",
            classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
        },
        cancelled: {
            label: "Cancelled",
            classes: "bg-rose-100 text-rose-700 border-rose-200",
        },
        completed: {
            label: "Completed",
            classes: "bg-blue-100 text-blue-700 border-blue-200",
        },
        "no-show": {
            label: "No Show",
            classes: "bg-slate-100 text-slate-700 border-slate-200",
        },
    };

    const config = configs[status] || configs.pending;

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.classes}`}>
            {config.label}
        </span>
    );
}

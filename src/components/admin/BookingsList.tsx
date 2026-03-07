"use client";

import {
    User,
    Scissors,
    Calendar,
    Clock,
    MoreVertical,
    ExternalLink,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import BookingStatusBadge from "./BookingStatusBadge";
import Link from "next/link";

interface BookingRecord {
    id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
    client: { name: string; email?: string | null };
    service: { name: string; price: number };
    staff: { name: string };
}

interface BookingsListProps {
    bookings: BookingRecord[];
    locale: string;
}

export default function BookingsList({ bookings, locale }: BookingsListProps) {
    if (bookings.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-primary/10 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-primary/40" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">No bookings found</h3>
                    <p className="text-sm text-tertiary">There are no bookings to display at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-primary/5 border-b border-primary/10">
                            <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Client</th>
                            <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Service</th>
                            <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Staff</th>
                            <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-right">Price</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-primary/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-foreground truncate">{booking.client.name}</div>
                                            <div className="text-xs text-tertiary truncate">{booking.client.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Scissors className="w-4 h-4 text-tertiary" />
                                        <span className="text-sm font-medium">{booking.service.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-tertiary font-medium">
                                    {booking.staff.name}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-foreground">
                                        {new Date(booking.booking_date + "T00:00:00").toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-tertiary flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <BookingStatusBadge status={booking.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-black text-primary">
                                        ${Number(booking.service.price).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="p-2 rounded-lg hover:bg-primary/10 text-tertiary transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-2xl border border-primary/10 p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-bold text-foreground">{booking.client.name}</div>
                                    <div className="text-xs text-tertiary">{booking.client.email}</div>
                                </div>
                            </div>
                            <BookingStatusBadge status={booking.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/5">
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest leading-none">Service</div>
                                <div className="text-sm font-medium flex items-center gap-1.5 leading-none">
                                    <Scissors className="w-3.5 h-3.5 text-primary/60" />
                                    {booking.service.name}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest leading-none">Staff</div>
                                <div className="text-sm font-medium leading-none">{booking.staff.name}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest leading-none">Date</div>
                                <div className="text-sm font-medium flex items-center gap-1.5 leading-none">
                                    <Calendar className="w-3.5 h-3.5 text-primary/60" />
                                    {new Date(booking.booking_date + "T00:00:00").toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest leading-none">Price</div>
                                <div className="text-lg font-black text-primary leading-none">
                                    ${Number(booking.service.price).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-primary/5">
                            <Link
                                href={`/${locale}/admin/bookings/${booking.id}`}
                                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-primary/5 border border-primary/10 text-xs font-bold text-primary hover:bg-primary/10 transition-all"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> View Details
                            </Link>
                            <button className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-tertiary hover:bg-primary/10 transition-all">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

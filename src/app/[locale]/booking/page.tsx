import { CalendarRange } from "lucide-react";

export default function BookingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Bookings</h1>
                <p className="text-sm text-tertiary">View and manage all your appointments.</p>
            </div>

            <div className="flex flex-col items-center justify-center p-16 bg-white border border-primary/10 rounded-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CalendarRange className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
                <p className="text-sm text-tertiary mt-1 max-w-xs">
                    Booking management is on the way. You'll be able to view, reschedule, and manage all appointments here.
                </p>
            </div>
        </div>
    );
}

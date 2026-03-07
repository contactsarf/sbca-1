import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import BookingsList from "@/components/admin/BookingsList";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Plus } from "lucide-react";
import Pagination from "@/components/shared/Pagination";

export default async function BookingsPage({
    searchParams
}: {
    searchParams: { page?: string };
}) {
    const supabase = await createClient();
    const locale = await getLocale();
    const page = parseInt(searchParams.page || "1");
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    // Fetch bookings with relationships
    const { data: bookings } = await supabase
        .from("bookings")
        .select(`
            id,
            booking_date,
            start_time,
            end_time,
            status,
            client:clients(name, email),
            service:services(name, price),
            staff:teams(name)
        `)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false })
        .range(offset, offset + pageSize - 1);

    // Casting to any for the list component as the select query returns complex objects
    const formattedBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        client: {
            name: b.client?.name || "Unknown Client",
            email: b.client?.email
        },
        service: {
            name: b.service?.name || "Deleted Service",
            price: b.service?.price || 0
        },
        staff: {
            name: b.staff?.name || "Unassigned"
        }
    }));

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Bookings"
                description="View and manage all appointments."
                action={{
                    href: `/${locale}/admin/calendar`,
                    label: "New Booking",
                    icon: Plus,
                }}
            />

            <BookingsList bookings={formattedBookings} locale={locale} />

            <Pagination
                currentPage={page}
                hasMore={formattedBookings.length === pageSize}
            />
        </div>
    );
}

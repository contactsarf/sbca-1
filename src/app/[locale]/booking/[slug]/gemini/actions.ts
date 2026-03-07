"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { upsertClient, createBooking } from "@/lib/booking-engine";

interface GuestSubmission {
    name: string;
    serviceIds: string[];
    date: string;
    startTime: string;
    endTime: string;
    teamMemberId: string;
}

interface BookingSubmissionInput {
    tenantId: string;
    email: string;
    phone: string;
    guests: GuestSubmission[];
    totalAmount: number;
    depositAmount: number;
}

export async function submitBooking(input: BookingSubmissionInput) {
    const supabase = createAdminClient();

    try {
        // 1. Create or Update the main client (the person who is booking)
        const clientResult = await upsertClient(supabase, input.tenantId, {
            name: input.guests[0].name, // Use the first guest's name as primary if not provided
            email: input.email,
            phone: input.phone,
            notes: `Booking for ${input.guests.length} guests. Total: $${input.totalAmount}`
        });

        if (!clientResult.success || !clientResult.clientId) {
            return { success: false, error: clientResult.error || "Failed to identify client." };
        }

        const clientId = clientResult.clientId;

        // 2. Create bookings for each guest
        const bookingIds: string[] = [];

        for (const guest of input.guests) {
            // For now, we store one booking record per guest per slot
            // If they have multiple services, they are sequential within the same slot (handled by engine)
            const bookingResult = await createBooking(supabase, {
                tenant_id: input.tenantId,
                client_id: clientId,
                team_member_id: guest.teamMemberId,
                booking_date: guest.date,
                start_time: `${guest.startTime}:00`,
                end_time: `${guest.endTime}:00`,
                status: "confirmed", // or "pending" if payment is required
                notes: `Guest: ${guest.name}. Services: ${guest.serviceIds.join(", ")}`
            });

            if (!bookingResult.success || !bookingResult.bookingId) {
                // If one fails, we should ideally roll back, but for MVP we log it
                console.error(`Failed to create booking for guest ${guest.name}:`, bookingResult.error);
                continue;
            }
            bookingIds.push(bookingResult.bookingId);
        }

        if (bookingIds.length === 0) {
            return { success: false, error: "Failed to create any bookings." };
        }

        return {
            success: true,
            bookingIds,
            message: "Your appointments have been successfully scheduled."
        };

    } catch (error) {
        console.error("Submission error:", error);
        return { success: false, error: "An unexpected error occurred during submission." };
    }
}

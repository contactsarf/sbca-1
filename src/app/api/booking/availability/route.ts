import { NextResponse } from "next/server";
import { findAvailableSlots } from "@/lib/booking-engine";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { success: false, error: "Server is missing Supabase service role configuration." },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { tenantId, serviceIds, date, preferredStaffId, clientTimezone } = body || {};

        if (!tenantId || !Array.isArray(serviceIds) || serviceIds.length === 0 || !date) {
            return NextResponse.json(
                { success: false, error: "Missing required booking details." },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();
        const result = await findAvailableSlots({
            tenantId,
            serviceIds,
            date,
            preferredStaffId,
            clientTimezone,
        }, supabase);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Availability error:", error);
        return NextResponse.json(
            { success: false, error: "Unable to find availability." },
            { status: 500 }
        );
    }
}

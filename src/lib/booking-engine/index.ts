/**
 * BOOKING ENGINE - Core business logic for appointment scheduling
 * 
 * This is the single source of truth for finding available appointment slots.
 * Handles:
 * - Service duration calculation
 * - Staff skill matching
 * - Schedule availability checking
 * - Existing booking conflict detection
 * - Timezone conversions
 * - Multi-service sequential bookings
 * 
 * CRITICAL: All booking availability must go through this engine.
 */

import { createClient } from "@/lib/supabase/server";

// ============================================================
// TYPES
// ============================================================

export interface TimeSlot {
    startTime: string;  // HH:MM format in service provider's timezone
    endTime: string;
    teamMemberId: string;
    teamMemberName: string;
    teamMemberAvatar?: string | null;
}

export interface BookingEngineInput {
    tenantId: string;
    serviceIds: string[];  // Can be multiple services for sequential booking
    date: string;  // YYYY-MM-DD format
    preferredStaffId?: string;  // Optional: if client has preference
    clientTimezone?: string;  // IANA timezone (e.g., 'America/Vancouver')
}

export interface BookingEngineResult {
    success: boolean;
    slots?: TimeSlot[];
    error?: string;
    suggestions?: string[];
    metadata?: {
        totalDurationMinutes: number;
        servicesInfo: Array<{ id: string; name: string; duration: number }>;
    };
}

interface Service {
    id: string;
    name: string;
    duration_minutes: number;
    is_paused: boolean;
}

interface TeamMember {
    id: string;
    name: string;
    avatar_url?: string | null;
}

interface TeamSchedule {
    day_of_week: number;
    is_available: boolean;
    start_time: string;  // HH:MM:SS
    end_time: string;    // HH:MM:SS
}

interface ExistingBooking {
    start_time: string;  // HH:MM:SS
    end_time: string;    // HH:MM:SS
}

interface Client {
    id: string;
    tenant_id: string;
    email?: string | null;
    phone?: string | null;
    name: string;
}

export interface ClientInfo {
    email?: string;
    phone?: string;
    name: string;
    notes?: string;
}

// ============================================================
// MAIN BOOKING ENGINE FUNCTION
// ============================================================

export async function findAvailableSlots(
    input: BookingEngineInput,
    supabaseClient?: any
): Promise<BookingEngineResult> {
    try {
        const supabase = supabaseClient ?? await createClient();

        // Step 1: Validate and fetch services
        const servicesResult = await fetchAndValidateServices(
            supabase,
            input.tenantId,
            input.serviceIds
        );

        if (!servicesResult.success) {
            return {
                success: false,
                error: servicesResult.error,
                suggestions: ["Please select active services only.", "Contact support if you believe this is an error."]
            };
        }

        const services = servicesResult.services!;
        const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);

        // Step 2: Get day of week for the requested date
        const dayOfWeek = new Date(input.date).getDay(); // 0=Sunday, 6=Saturday

        // Step 3: Find eligible staff members
        const eligibleStaff = await findEligibleStaff(
            supabase,
            input.tenantId,
            input.serviceIds,
            input.preferredStaffId
        );

        if (eligibleStaff.length === 0) {
            return {
                success: false,
                error: input.preferredStaffId
                    ? "Selected staff member is not available or cannot perform the requested services."
                    : "No staff members available who can perform all requested services.",
                suggestions: [
                    "Try selecting a different date.",
                    input.preferredStaffId ? "Try selecting a different staff member or none for automatic assignment." : "Contact us to add services to staff members.",
                ]
            };
        }

        // Step 4: For each eligible staff member, calculate available slots
        const allSlots: TimeSlot[] = [];

        for (const staff of eligibleStaff) {
            const slots = await calculateSlotsForStaff(
                supabase,
                input.tenantId,
                staff,
                input.date,
                dayOfWeek,
                totalDuration
            );
            allSlots.push(...slots);
        }

        // Step 5: Sort slots by time
        allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (allSlots.length === 0) {
            return {
                success: false,
                error: "No available time slots for the selected date.",
                suggestions: [
                    "Try selecting a different date.",
                    "Consider booking individual services separately.",
                ]
            };
        }

        return {
            success: true,
            slots: allSlots,
            metadata: {
                totalDurationMinutes: totalDuration,
                servicesInfo: services.map(s => ({
                    id: s.id,
                    name: s.name,
                    duration: s.duration_minutes
                }))
            }
        };

    } catch (error) {
        console.error("Booking engine error:", error);
        return {
            success: false,
            error: "An unexpected error occurred while finding available slots.",
            suggestions: ["Please try again later.", "Contact support if the issue persists."]
        };
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Upsert client information before creating booking
 * 
 * Searches for existing client by email or phone (per tenant).
 * Updates if found, creates if not found.
 * 
 * @returns Client ID for use in booking
 */
export async function upsertClient(
    supabase: any,
    tenantId: string,
    clientInfo: ClientInfo
): Promise<{ success: boolean; clientId?: string; error?: string }> {
    const { email, phone, name, notes } = clientInfo;

    // Validate: at least one contact method required
    if (!email && !phone) {
        return {
            success: false,
            error: "Client email or phone required."
        };
    }

    try {
        // Check if client exists (by email or phone)
        let query = supabase
            .from("clients")
            .select("id")
            .eq("tenant_id", tenantId);

        if (email && phone) {
            // Check both email and phone with OR
            query = query.or(`email.eq.${email},phone.eq.${phone}`);
        } else if (email) {
            query = query.eq("email", email);
        } else {
            query = query.eq("phone", phone);
        }

        const { data: existingClients, error: searchError } = await query;

        if (searchError) {
            return {
                success: false,
                error: "Error searching for client."
            };
        }

        // If client exists, update and return
        if (existingClients && existingClients.length > 0) {
            const clientId = existingClients[0].id;

            const { error: updateError } = await supabase
                .from("clients")
                .update({
                    email: email || null,
                    phone: phone || null,
                    name,
                    notes: notes || null
                })
                .eq("id", clientId);

            if (updateError) {
                return {
                    success: false,
                    error: "Error updating client information."
                };
            }

            return {
                success: true,
                clientId
            };
        }

        // Client doesn't exist, create new
        const { data: newClient, error: insertError } = await supabase
            .from("clients")
            .insert({
                tenant_id: tenantId,
                email: email || null,
                phone: phone || null,
                name,
                notes: notes || null
            })
            .select("id")
            .single();

        if (insertError || !newClient) {
            return {
                success: false,
                error: "Error creating new client."
            };
        }

        return {
            success: true,
            clientId: newClient.id
        };
    } catch (error) {
        return {
            success: false,
            error: "Unexpected error during client upsert."
        };
    }
}

/**
 * Create a new booking
 */
export async function createBooking(
    supabase: any,
    bookingData: {
        tenant_id: string;
        client_id: string;
        team_member_id: string;
        booking_date: string;
        start_time: string;
        end_time: string;
        status?: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
        notes?: string;
    }
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
        const { data, error } = await supabase
            .from("bookings")
            .insert({
                ...bookingData,
                status: bookingData.status || "confirmed"
            })
            .select("id")
            .single();

        if (error || !data) {
            return {
                success: false,
                error: error?.message || "Error creating booking record."
            };
        }

        return {
            success: true,
            bookingId: data.id
        };
    } catch (error) {
        return {
            success: false,
            error: "Unexpected error during booking creation."
        };
    }
}

async function fetchAndValidateServices(
    supabase: any,
    tenantId: string,
    serviceIds: string[]
): Promise<{ success: boolean; services?: Service[]; error?: string }> {
    const { data: services, error } = await supabase
        .from("services")
        .select("id, name, duration_minutes, is_paused")
        .eq("tenant_id", tenantId)
        .in("id", serviceIds);

    if (error || !services || services.length === 0) {
        return {
            success: false,
            error: "Unable to fetch requested services."
        };
    }

    // Check if all services are active
    const pausedServices = services.filter((s: Service) => s.is_paused);
    if (pausedServices.length > 0) {
        return {
            success: false,
            error: `The following services are currently unavailable: ${pausedServices.map((s: Service) => s.name).join(", ")}`
        };
    }

    // Check if all requested service IDs were found
    if (services.length !== serviceIds.length) {
        return {
            success: false,
            error: "One or more requested services not found."
        };
    }

    return { success: true, services };
}

async function findEligibleStaff(
    supabase: any,
    tenantId: string,
    serviceIds: string[],
    preferredStaffId?: string
): Promise<TeamMember[]> {
    // If preferred staff is specified, check only that staff member
    if (preferredStaffId) {
        // Check if this staff member can perform ALL requested services
        const { data: mappings } = await supabase
            .from("service_team_members")
            .select("service_id")
            .eq("tenant_id", tenantId)
            .eq("team_member_id", preferredStaffId)
            .in("service_id", serviceIds);

        if (mappings && mappings.length === serviceIds.length) {
            const { data: staff } = await supabase
                .from("teams")
                .select("id, name, avatar_url")
                .eq("id", preferredStaffId)
                .single();

            return staff ? [staff] : [];
        }

        return [];
    }

    // Find all staff members who can perform ALL requested services
    // This requires checking that each staff member has mappings for all services
    const { data: allStaff } = await supabase
        .from("teams")
        .select("id, name, avatar_url")
        .eq("tenant_id", tenantId);

    if (!allStaff || allStaff.length === 0) return [];

    const eligibleStaff: TeamMember[] = [];

    for (const staff of allStaff) {
        const { data: mappings } = await supabase
            .from("service_team_members")
            .select("service_id")
            .eq("team_member_id", staff.id)
            .in("service_id", serviceIds);

        // Staff member must have skill mappings for ALL requested services
        if (mappings && mappings.length === serviceIds.length) {
            eligibleStaff.push(staff);
        }
    }

    return eligibleStaff;
}

async function calculateSlotsForStaff(
    supabase: any,
    tenantId: string,
    staff: TeamMember,
    date: string,
    dayOfWeek: number,
    durationMinutes: number
): Promise<TimeSlot[]> {
    // Step 1: Get staff schedule for this day of week
    const { data: scheduleData } = await supabase
        .from("team_schedules")
        .select("day_of_week, is_available, start_time, end_time")
        .eq("team_member_id", staff.id)
        .eq("day_of_week", dayOfWeek)
        .single();

    if (!scheduleData || !scheduleData.is_available) {
        return []; // Staff not working on this day
    }

    const schedule: TeamSchedule = scheduleData;

    // Step 2: Get existing bookings for this staff member on this date
    const { data: bookingsData } = await supabase
        .from("bookings")
        .select("start_time, end_time")
        .eq("tenant_id", tenantId)
        .eq("team_member_id", staff.id)
        .eq("booking_date", date)
        .in("status", ["confirmed", "pending"]);

    const existingBookings: ExistingBooking[] = bookingsData || [];

    // Step 3: Calculate available time slots
    const slots = generateTimeSlots(
        schedule.start_time,
        schedule.end_time,
        durationMinutes,
        existingBookings,
        staff
    );

    return slots;
}

function generateTimeSlots(
    workStartTime: string,  // "09:00:00"
    workEndTime: string,    // "17:00:00"
    durationMinutes: number,
    existingBookings: ExistingBooking[],
    staff: TeamMember
): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Convert time strings to minutes since midnight for easier calculation
    const startMinutes = timeToMinutes(workStartTime);
    const endMinutes = timeToMinutes(workEndTime);

    // Sort existing bookings by start time
    const sortedBookings = existingBookings
        .map(b => ({
            start: timeToMinutes(b.start_time),
            end: timeToMinutes(b.end_time)
        }))
        .sort((a, b) => a.start - b.start);

    // Find gaps between bookings
    let currentTime = startMinutes;

    for (const booking of sortedBookings) {
        // Check if there's a gap before this booking
        while (currentTime + durationMinutes <= booking.start) {
            const slotStart = minutesToTime(currentTime);
            const slotEnd = minutesToTime(currentTime + durationMinutes);

            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                teamMemberId: staff.id,
                teamMemberName: staff.name,
                teamMemberAvatar: staff.avatar_url
            });

            // Move to next potential slot (match service duration exactly)
            currentTime += durationMinutes;
        }

        // Move past this booking
        currentTime = Math.max(currentTime, booking.end);
    }

    // Check remaining time after last booking
    while (currentTime + durationMinutes <= endMinutes) {
        const slotStart = minutesToTime(currentTime);
        const slotEnd = minutesToTime(currentTime + durationMinutes);

        slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            teamMemberId: staff.id,
            teamMemberName: staff.name,
            teamMemberAvatar: staff.avatar_url
        });

        currentTime += durationMinutes;
    }

    return slots;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function timeToMinutes(timeStr: string): number {
    // Convert "HH:MM:SS" or "HH:MM" to minutes since midnight
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
    // Convert minutes since midnight to "HH:MM" format
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Timezone conversion utility
 * Converts time from one timezone to another (for future use when displaying to client)
 */
export function convertTimezone(
    dateStr: string,
    timeStr: string,
    fromTimezone: string,
    toTimezone: string
): { date: string; time: string } {
    try {
        // Create a date-time string in the source timezone
        const dateTimeStr = `${dateStr}T${timeStr}:00`;
        const date = new Date(dateTimeStr);

        // For now, return as-is (proper timezone conversion would require a library like date-fns-tz)
        // This is a placeholder for proper timezone handling
        return {
            date: dateStr,
            time: timeStr
        };
    } catch (error) {
        console.error("Timezone conversion error:", error);
        return { date: dateStr, time: timeStr };
    }
}

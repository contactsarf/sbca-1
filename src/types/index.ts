/** Shared base TypeScript types for the StayBooked platform */

export type Locale = "en";

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    created_at: string;
}

export interface Profile {
    id: string;
    tenant_id: string;
    full_name: string;
    email: string;
    role: "owner" | "admin" | "staff";
    avatar_url?: string;
    created_at: string;
}

export interface Service {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    deposit_percentage?: 10 | 25 | 50 | 100 | null;
    is_paused: boolean;
    created_at: string;
}

export interface StaffMember {
    id: string;
    tenant_id: string;
    profile_id: string;
    service_ids: string[];
    is_active: boolean;
    created_at: string;
}

export interface Booking {
    id: string;
    tenant_id: string;
    client_id: string;
    service_id: string;
    team_member_id: string;
    booking_date: string;  // YYYY-MM-DD
    start_time: string;    // HH:MM:SS
    end_time: string;      // HH:MM:SS
    timezone: string;      // IANA timezone
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    tenant_id: string;
    email?: string | null;
    phone?: string | null;
    name: string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

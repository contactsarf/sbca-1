/** Shared base TypeScript types for the StayBooked platform */

export type Locale = "en";

export interface Tenant {
    id: string;
    owner_id?: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    logo_size?: number | null;
    timezone?: string | null;
    tax_province?: string | null;
    primary_contact_name?: string | null;
    primary_contact_email?: string | null;
    primary_contact_phone?: string | null;
    public_email?: string | null;
    public_phone?: string | null;
    public_website?: string | null;
    public_instagram?: string | null;
    public_address?: string | null;
    public_message?: string | null;
    public_booking_enabled?: boolean | null;
    stripe_connect_account_id?: string | null;
    stripe_connect_status?: string | null;
    interac_email?: string | null;
    created_at: string;
    updated_at: string;
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

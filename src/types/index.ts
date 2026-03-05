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
    is_active: boolean;
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
    service_id: string;
    staff_id: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    starts_at: string;
    ends_at: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    notes?: string;
    created_at: string;
}

export interface Client {
    id: string;
    tenant_id: string;
    full_name: string;
    email: string;
    phone?: string;
    created_at: string;
}

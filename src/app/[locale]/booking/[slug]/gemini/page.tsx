import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import BookingWizard from "./BookingWizard";
import { Tenant, Service } from "@/types";

interface GeminiBookingPageProps {
    params: Promise<{ locale: string; slug: string }>;
}

export default async function GeminiBookingPage({ params }: GeminiBookingPageProps) {
    const { slug } = await params;
    const supabase = createAdminClient();

    // Fetch tenant details by slug
    const { data: tenant } = await supabase
        .from("tenant")
        .select(`
            id, 
            name, 
            slug, 
            logo_url, 
            logo_size, 
            public_booking_enabled, 
            public_email, 
            public_phone, 
            public_website, 
            public_instagram, 
            public_address, 
            public_message, 
            tax_province
        `)
        .eq("slug", slug)
        .single();

    if (!tenant) {
        notFound();
    }

    // Fetch active services and team members
    const [{ data: services }, { data: teamMembers }] = await Promise.all([
        supabase
            .from("services")
            .select("id, name, description, prep_notes, duration_minutes, price, deposit_percentage, is_paused")
            .eq("tenant_id", tenant.id)
            .eq("is_paused", false)
            .order("name", { ascending: true }),
        supabase
            .from("teams")
            .select("id, name, avatar_url, bio")
            .eq("tenant_id", tenant.id)
            .order("name", { ascending: true }),
    ]);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            <BookingWizard
                tenant={tenant as Tenant}
                services={(services as Service[]) ?? []}
                teamMembers={(teamMembers as any) ?? []}
            />
        </div>
    );
}

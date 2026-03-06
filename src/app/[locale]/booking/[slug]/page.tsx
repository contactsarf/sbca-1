import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import BookingClient from "./BookingClient";

const DEFAULT_LOGO_SIZE = 72;

interface BookingPageProps {
    params: Promise<{ locale: string; slug: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: tenant } = await supabase
        .from("tenant")
        .select("id, name, slug, logo_url, logo_size, public_booking_enabled, public_email, public_phone, public_website, public_instagram, public_address, public_message, tax_province")
        .eq("slug", slug)
        .single();

    if (!tenant) {
        notFound();
    }

    const [{ data: services }, { data: teamMembers }] = await Promise.all([
        supabase
            .from("services")
            .select("id, name, description, prep_notes, duration_minutes, price, deposit_percentage, is_paused")
            .eq("tenant_id", tenant.id)
            .eq("is_paused", false)
            .order("name", { ascending: true }),
        supabase
            .from("teams")
            .select("id, name, avatar_url")
            .eq("tenant_id", tenant.id)
            .order("name", { ascending: true }),
    ]);

    const logoSize = tenant.logo_size ?? DEFAULT_LOGO_SIZE;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 py-8 md:px-6 md:py-12">
                <div className="flex flex-col items-center text-center gap-4 mb-10">
                    {tenant.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={tenant.logo_url}
                            alt={`${tenant.name} logo`}
                            className="object-contain"
                            style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
                        />
                    ) : null}
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                            {tenant.name}
                        </h1>
                        <p className="text-sm text-tertiary">
                            Book your appointment in a few easy steps.
                        </p>
                    </div>
                </div>

                {!tenant.public_booking_enabled ? (
                    <div className="bg-white shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">Booking temporarily unavailable</h2>
                            <p className="text-sm text-tertiary">
                                Please contact us using the details below.
                            </p>
                        </div>

                        {tenant.public_message ? (
                            <div className="rounded-xl bg-primary/5 p-4 text-sm text-foreground">
                                {tenant.public_message}
                            </div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {tenant.public_address ? (
                                <div className="rounded-xl border border-primary/10 p-4">
                                    <p className="text-xs text-tertiary">Address</p>
                                    <p className="text-foreground font-medium mt-1">{tenant.public_address}</p>
                                </div>
                            ) : null}
                            {tenant.public_phone ? (
                                <div className="rounded-xl border border-primary/10 p-4">
                                    <p className="text-xs text-tertiary">Phone</p>
                                    <p className="text-foreground font-medium mt-1">{tenant.public_phone}</p>
                                </div>
                            ) : null}
                            {tenant.public_email ? (
                                <div className="rounded-xl border border-primary/10 p-4">
                                    <p className="text-xs text-tertiary">Email</p>
                                    <p className="text-foreground font-medium mt-1">{tenant.public_email}</p>
                                </div>
                            ) : null}
                            {tenant.public_website ? (
                                <div className="rounded-xl border border-primary/10 p-4">
                                    <p className="text-xs text-tertiary">Website</p>
                                    <p className="text-foreground font-medium mt-1">{tenant.public_website}</p>
                                </div>
                            ) : null}
                            {tenant.public_instagram ? (
                                <div className="rounded-xl border border-primary/10 p-4">
                                    <p className="text-xs text-tertiary">Instagram</p>
                                    <p className="text-foreground font-medium mt-1">{tenant.public_instagram}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <BookingClient
                        tenantId={tenant.id}
                        tenantName={tenant.name}
                        taxProvince={tenant.tax_province ?? "ON"}
                        services={services ?? []}
                        teamMembers={teamMembers ?? []}
                    />
                )}
            </div>
        </div>
    );
}

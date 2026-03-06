import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

const createStripeAccount = async (secretKey: string) => {
    const params = new URLSearchParams({
        type: "express",
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
    });

    const response = await fetch(`${STRIPE_API_BASE}/accounts`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }

    return response.json() as Promise<{ id: string }>;
};

const createAccountLink = async (
    secretKey: string,
    accountId: string,
    returnUrl: string,
    refreshUrl: string
) => {
    const params = new URLSearchParams({
        account: accountId,
        type: "account_onboarding",
        return_url: returnUrl,
        refresh_url: refreshUrl,
    });

    const response = await fetch(`${STRIPE_API_BASE}/account_links`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }

    return response.json() as Promise<{ url: string }>;
};

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
        }

        const { data: tenant } = await supabase
            .from("tenant")
            .select("id, stripe_connect_account_id")
            .eq("id", profile.tenant_id)
            .single();

        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: "Stripe secret key missing" }, { status: 500 });
        }

        let accountId = tenant?.stripe_connect_account_id ?? null;

        if (!accountId) {
            const account = await createStripeAccount(secretKey);
            accountId = account.id;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const requestUrl = new URL(request.url);
        const locale = requestUrl.searchParams.get("locale") || "en";
        const returnUrl = `${appUrl}/${locale}/admin/settings?stripe=connected`;
        const refreshUrl = `${appUrl}/${locale}/admin/settings?stripe=refresh`;

        const accountLink = await createAccountLink(secretKey, accountId, returnUrl, refreshUrl);

        await supabase.from("tenant").update({
            stripe_connect_account_id: accountId,
            stripe_connect_status: "pending",
        }).eq("id", profile.tenant_id);

        return NextResponse.json({ url: accountLink.url });
    } catch (error) {
        return NextResponse.json({ error: "Unable to start Stripe connection" }, { status: 500 });
    }
}

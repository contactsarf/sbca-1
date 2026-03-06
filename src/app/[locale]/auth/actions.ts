"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signupAction(formData: FormData, locale: string) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/auth/login`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function loginAction(formData: FormData, locale: string) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // Check for tenant association
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User not found after login" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (profile?.tenant_id) {
        redirect(`/${locale}/admin`);
    } else {
        redirect(`/${locale}/auth/onboarding`);
    }
}

export async function forgotPasswordAction(formData: FormData, locale: string) {
    const email = formData.get("email") as string;

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/auth/reset-password`,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function onboardingAction(formData: FormData, locale: string) {
    const organizationName = formData.get("organizationName") as string;
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // 1. Create Tenant
    const { data: tenant, error: tenantError } = await supabase
        .from("tenant")
        .insert({
            name: organizationName,
            slug: slug,
            owner_id: user.id, // Critical for RLS visibility
        })
        .select()
        .single();

    if (tenantError) {
        return { error: tenantError.message };
    }

    // 2. Update Profile
    // We use upsert in case the profile row doesn't exist yet (if trigger failed or not implemented)
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            tenant_id: tenant.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
            role: "owner",
        });

    if (profileError) {
        return { error: profileError.message };
    }

    revalidatePath("/", "layout");
    redirect(`/${locale}/admin`);
}

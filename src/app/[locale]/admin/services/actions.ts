"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Service } from "@/types";

export async function getServices() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching services:", error);
        return [];
    }

    return data as Service[];
}

export async function getService(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching service:", error);
        return null;
    }

    return data as Service;
}

export async function upsertService(formData: FormData, locale: string, id?: string) {
    const supabase = await createClient();

    // Get current user's tenant_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthenticated" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!profile?.tenant_id) return { error: "No tenant associated" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const duration_minutes = parseInt(formData.get("duration_minutes") as string);
    const price = parseFloat(formData.get("price") as string);
    const deposit_percentage = formData.get("deposit_percentage") ? parseInt(formData.get("deposit_percentage") as string) : null;
    const is_paused = formData.get("is_paused") === "on";

    const teamMemberIdsRaw = formData.get("team_member_ids") as string | null;
    const teamMemberIds = teamMemberIdsRaw ? JSON.parse(teamMemberIdsRaw) as string[] : [];

    const serviceData = {
        tenant_id: profile.tenant_id,
        name,
        description,
        duration_minutes,
        price,
        deposit_percentage,
        is_paused,
    };

    const syncTeamMembers = async (serviceId: string) => {
        const { error: deleteError } = await supabase
            .from("service_team_members")
            .delete()
            .eq("service_id", serviceId)
            .eq("tenant_id", profile.tenant_id);

        if (deleteError) {
            return { error: deleteError.message };
        }

        if (teamMemberIds.length === 0) {
            return { success: true };
        }

        const rows = teamMemberIds.map((teamMemberId) => ({
            tenant_id: profile.tenant_id,
            service_id: serviceId,
            team_member_id: teamMemberId,
        }));

        const { error: insertError } = await supabase
            .from("service_team_members")
            .insert(rows);

        if (insertError) {
            return { error: insertError.message };
        }

        return { success: true };
    };

    let error;
    if (id) {
        const { error: updateError } = await supabase
            .from("services")
            .update(serviceData)
            .eq("id", id);
        error = updateError;

        if (!error) {
            const syncResult = await syncTeamMembers(id);
            if (syncResult.error) {
                return { error: syncResult.error };
            }
        }
    } else {
        const { data: createdService, error: insertError } = await supabase
            .from("services")
            .insert(serviceData)
            .select("id")
            .single();
        error = insertError;

        if (!error && createdService?.id) {
            const syncResult = await syncTeamMembers(createdService.id);
            if (syncResult.error) {
                return { error: syncResult.error };
            }
        }
    }

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/${locale}/admin/services`);
    redirect(`/${locale}/admin/services`);
}

export async function deleteService(id: string, locale: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/${locale}/admin/services`);
    return { success: true };
}

export async function toggleServicePause(id: string, currentStatus: boolean, locale: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("services")
        .update({ is_paused: !currentStatus })
        .eq("id", id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/${locale}/admin/services`);
    return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function upsertTeamMember(formData: FormData, locale: string, id?: string) {
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
    const bio = formData.get("bio") as string;
    const joined_date = formData.get("joined_date") as string;
    const avatarFile = formData.get("avatar_file") as File;

    let avatar_url = formData.get("avatar_url") as string;

    // Handle File Upload — bucket 'avatars' must already exist in Supabase Storage
    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${profile.tenant_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            return { error: `Failed to upload avatar: ${uploadError.message}` };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        avatar_url = publicUrl;
    }

    const serviceIdsRaw = formData.get("service_ids") as string | null;
    const serviceIds = serviceIdsRaw ? JSON.parse(serviceIdsRaw) as string[] : [];

    const memberData: any = {
        tenant_id: profile.tenant_id,
        name,
        bio,
        joined_date: joined_date || new Date().toISOString().split('T')[0],
    };

    // Only include avatar_url if a new file was uploaded
    if (avatarFile && avatarFile.size > 0) {
        memberData.avatar_url = avatar_url;
    } else if (!id) {
        // For new members, include avatar_url even if empty (will be null)
        memberData.avatar_url = avatar_url;
    }
    // For existing members without a new file, don't include avatar_url so it's not overwritten

    const syncServices = async (teamMemberId: string) => {
        const { error: deleteError } = await supabase
            .from("service_team_members")
            .delete()
            .eq("team_member_id", teamMemberId)
            .eq("tenant_id", profile.tenant_id);

        if (deleteError) {
            return { error: deleteError.message };
        }

        if (serviceIds.length === 0) {
            return { success: true };
        }

        const rows = serviceIds.map((serviceId) => ({
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
            .from("teams")
            .update(memberData)
            .eq("id", id);
        error = updateError;

        if (!error) {
            const syncResult = await syncServices(id);
            if (syncResult.error) {
                return { error: syncResult.error };
            }
        }
    } else {
        const { data: createdMember, error: insertError } = await supabase
            .from("teams")
            .insert(memberData)
            .select("id")
            .single();
        error = insertError;

        if (!error && createdMember?.id) {
            const syncResult = await syncServices(createdMember.id);
            if (syncResult.error) {
                return { error: syncResult.error };
            }
        }
    }

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/${locale}/admin/teams`);
    redirect(`/${locale}/admin/teams`);
}

export async function deleteTeamMember(id: string, locale: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/${locale}/admin/teams`);
    return { success: true };
}

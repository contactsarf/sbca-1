"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DaySchedule = {
    day_of_week: number;
    is_available: boolean;
    start_time: string;
    end_time: string;
};

export async function getTeamMemberSchedule(teamMemberId: string): Promise<DaySchedule[]> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("team_schedules")
        .select("day_of_week, is_available, start_time, end_time")
        .eq("team_member_id", teamMemberId)
        .order("day_of_week");

    // Defaults: Mon–Fri 09:00–17:00 available, Sat–Sun off
    const defaults: DaySchedule[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day_of_week: day,
        is_available: day >= 1 && day <= 5,
        start_time: "09:00",
        end_time: "17:00",
    }));

    if (!data || data.length === 0) return defaults;

    return defaults.map((def) => {
        const found = data.find((r) => r.day_of_week === def.day_of_week);
        return found ? { ...def, ...found } : def;
    });
}

export async function upsertTeamMemberSchedule(
    teamMemberId: string,
    schedules: DaySchedule[],
    locale: string
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthenticated" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!profile?.tenant_id) return { error: "No tenant associated" };

    const rows = schedules.map((s) => ({
        team_member_id: teamMemberId,
        tenant_id: profile.tenant_id,
        day_of_week: s.day_of_week,
        is_available: s.is_available,
        start_time: s.start_time,
        end_time: s.end_time,
    }));

    const { error } = await supabase
        .from("team_schedules")
        .upsert(rows, { onConflict: "team_member_id,day_of_week" });

    if (error) return { error: error.message };

    revalidatePath(`/${locale}/admin/teams`);
    return { success: true };
}

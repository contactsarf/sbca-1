import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import { getLocale } from "next-intl/server";
import TeamsList from "@/components/admin/TeamsList";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function TeamsPage() {
    const supabase = await createClient();
    const locale = await getLocale();

    const { data: teams } = await supabase
        .from("teams")
        .select("id, name, bio, avatar_url, joined_date")
        .order("name", { ascending: true });

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Team"
                description="Manage your staff and team members."
                action={{
                    href: `/${locale}/admin/teams/new`,
                    label: "Add Team Member",
                    icon: Plus,
                }}
            />

            <TeamsList teams={teams ?? []} locale={locale} />
        </div>
    );
}

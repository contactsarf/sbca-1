import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    ClipboardList,
    Users,
    UserSquare2,
    Settings,
    LogOut,
    Scissors
} from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import AdminNavbar from "@/components/admin/AdminNavbar";

// Helper to map icon names to components for the Server Component part (sidebar)
const iconMap: Record<string, any> = {
    LayoutDashboard,
    Calendar,
    ClipboardList,
    Users,
    UserSquare2,
    Settings,
    Scissors,
};

interface NavItem {
    label: string;
    href: string;
    iconName: string;
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const locale = await getLocale();
        redirect(`/${locale}/auth/login`);
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*, tenant(*)")
        .eq("id", user.id)
        .single();

    if (!profile?.tenant_id) {
        const locale = await getLocale();
        redirect(`/${locale}/auth/onboarding`);
    }

    const locale = await getLocale();
    const tenantName = profile.tenant?.name || "StayBooked";

    const navItems: NavItem[] = [
        { label: "Dashboard", href: `/${locale}/admin/dashboard`, iconName: "LayoutDashboard" },
        { label: "Bookings", href: `/${locale}/admin/bookings`, iconName: "ClipboardList" },
        { label: "Calendar", href: `/${locale}/admin/calendar`, iconName: "Calendar" },
        { label: "Services", href: `/${locale}/admin/services`, iconName: "Scissors" },
        { label: "Teams", href: `/${locale}/admin/teams`, iconName: "UserSquare2" },
        { label: "Clients", href: `/${locale}/admin/clients`, iconName: "Users" },
        { label: "Settings", href: `/${locale}/admin/settings`, iconName: "Settings" },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar (Fixed and Always Open) */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-foreground text-white flex-col z-50">
                <div className="p-6 border-b border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold">
                            S
                        </div>
                        <span className="font-bold text-lg tracking-tight">StayBooked</span>
                    </div>
                    <div className="mt-4 text-xs font-medium text-secondary uppercase tracking-wider truncate">
                        {tenantName}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.iconName];
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-white hover:bg-primary/20 transition-all select-none active:scale-95 active:opacity-70 group"
                            >
                                {Icon && <Icon className="w-5 h-5 group-hover:text-secondary" />}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-primary/20">
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-white hover:bg-danger/10 hover:text-danger transition-colors group"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </form>
                </div>
            </aside>

            {/* Mobile & Tablet Top Nav */}
            <AdminNavbar navItems={navItems} tenantName={tenantName} locale={locale} />

            {/* Main Content Area */}
            <main className="lg:ml-64 flex-1">
                <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

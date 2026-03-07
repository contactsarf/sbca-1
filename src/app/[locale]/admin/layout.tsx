import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { LogOut } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";


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
    const tenantSlug = profile.tenant?.slug || "";
    const bookingPageHref = `/booking/${tenantSlug}`;

    const navItems: NavItem[] = [
        { label: "Dashboard", href: `/${locale}/admin/dashboard`, iconName: "LayoutDashboard" },
        { label: "Bookings", href: `/${locale}/admin/bookings`, iconName: "ClipboardList" },
        { label: "Calendar", href: `/${locale}/admin/calendar`, iconName: "Calendar" },
        { label: "Services", href: `/${locale}/admin/services`, iconName: "Scissors" },
        { label: "Team", href: `/${locale}/admin/teams`, iconName: "UserSquare2" },
        { label: "Clients", href: `/${locale}/admin/clients`, iconName: "Users" },
        { label: "Settings", href: `/${locale}/admin/settings`, iconName: "Settings" },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar (Tablet & Desktop) */}
            <aside className="hidden md:flex fixed left-0 top-0 h-full bg-foreground text-white flex-col z-50 transition-all duration-300 w-24 lg:w-64">
                <div className="p-4 lg:p-6 border-b border-primary/20">
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                        {/* Two-tone wordmark */}
                        <span className="font-bold text-lg tracking-tight whitespace-nowrap">
                            S<span className="lg:hidden text-secondary">B</span>
                            <span className="hidden lg:inline">tay<span className="text-secondary">Booked</span></span>
                        </span>
                    </div>
                    <div className="hidden lg:block">
                        <Link
                            href={bookingPageHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-block text-xs font-medium text-secondary uppercase tracking-wider truncate hover:text-white transition-colors"
                        >
                            {tenantName}
                        </Link>
                    </div>
                </div>

                <nav className="flex-1 p-2 lg:p-4 space-y-2 overflow-y-auto">
                    {/* Multi-mode nav */}
                    <div className="lg:hidden">
                        <AdminSidebarNav navItems={navItems} isCondensed={true} />
                    </div>
                    <div className="hidden lg:block">
                        <AdminSidebarNav navItems={navItems} isCondensed={false} />
                    </div>
                </nav>

                <div className="p-2 lg:p-4 border-t border-primary/20">
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium text-secondary hover:text-white hover:bg-danger/10 hover:text-danger transition-colors group justify-center lg:justify-start"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className="hidden lg:inline">Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Mobile Top Nav (Visible only on small screens) */}
            <AdminNavbar navItems={navItems} tenantName={tenantName} locale={locale} tenantSlug={tenantSlug} />

            {/* Main Content Area */}
            <main className="md:ml-24 lg:ml-64 flex-1">
                <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

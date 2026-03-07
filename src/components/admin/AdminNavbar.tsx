"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Menu,
    X,
    LogOut,
    MoreHorizontal,
    LayoutDashboard,
    Calendar,
    ClipboardList,
    Users,
    UserSquare2,
    Settings,
    Scissors
} from "lucide-react";
import { usePathname } from "next/navigation";

// Client-side icon mapping
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

interface AdminNavbarProps {
    navItems: NavItem[];
    tenantName: string;
    locale: string;
    tenantSlug: string;
}

export default function AdminNavbar({ navItems, tenantName, locale, tenantSlug }: AdminNavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const bookingPageHref = `/booking/${tenantSlug}`;

    const isActive = (href: string) => {
        // Check if pathname starts with the href or is exactly the href
        if (href === `/${locale}/admin`) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <>
            {/* Tablet/Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 w-full bg-foreground text-white border-b border-primary/20">
                {/* Row 1: Logo and Controls */}
                <div className="flex items-center justify-between h-16 px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        {/* Hamburger (Mobile Only) — left side */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle navigation menu"
                            className="md:hidden p-2 text-secondary hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        {/* Two-tone wordmark */}
                        <span className="font-bold text-lg tracking-tight">
                            Stay<span className="text-secondary">Booked</span>
                        </span>
                    </div>

                    {/* Tenant Name — visible on all sizes */}
                    <Link
                        href={bookingPageHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-secondary uppercase tracking-wider truncate max-w-[140px] hover:text-white transition-colors"
                    >
                        {tenantName}
                    </Link>
                </div>

                {/* Row 2: Tablet Navigation (Hidden on Mobile) */}
                <nav className="hidden md:flex items-center justify-center h-14 px-4 md:px-6 bg-primary/10 border-t border-primary/10 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 min-w-max">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap select-none ${isActive(item.href)
                                    ? "bg-primary/30 text-white"
                                    : "text-secondary hover:text-white hover:bg-primary/20"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>
            </header>

            {/* Mobile Slide-out Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity lg:hidden ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full w-72 bg-foreground text-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 border-b border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg tracking-tight">
                            Stay<span className="text-secondary">Booked</span>
                        </span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-secondary hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <Link
                        href={bookingPageHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-xs font-medium text-secondary uppercase tracking-wider truncate hover:text-white transition-colors"
                    >
                        {tenantName}
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.iconName];
                        return (
                            <div key={item.href} className="contents">
                                <Link
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium transition-all select-none active:scale-95 active:opacity-70 ${isActive(item.href)
                                        ? "bg-primary/20 text-white"
                                        : "text-secondary hover:text-white hover:bg-primary/10"
                                        }`}
                                >
                                    {Icon && <Icon className="w-5 h-5" />}
                                    {item.label}
                                </Link>
                                {item.iconName === "Calendar" && (
                                    <div className="my-2 h-px bg-primary/10 w-full" />
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-primary/20">
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium text-secondary hover:text-white hover:bg-danger/10 hover:text-danger transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}

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
}

export default function AdminNavbar({ navItems, tenantName, locale }: AdminNavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href;

    return (
        <>
            {/* Tablet/Mobile Header */}
            <header className="lg:hidden sticky top-0 z-40 w-full bg-foreground text-white border-b border-primary/20">
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
                    <div className="text-xs font-medium text-secondary uppercase tracking-wider truncate max-w-[140px]">
                        {tenantName}
                    </div>
                </div>

                {/* Row 2: Tablet Navigation (Hidden on Mobile) */}
                <nav className="hidden md:flex items-center justify-center h-12 px-4 md:px-6 bg-primary/10 border-t border-primary/10 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1 min-w-max">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap select-none active:scale-95 active:opacity-70 ${isActive(item.href)
                                    ? "bg-primary/20 text-white"
                                    : "text-secondary/80 hover:text-white hover:bg-primary/10"
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
                        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold">
                            S
                        </div>
                        <span className="font-bold text-lg tracking-tight">StayBooked</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-secondary hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <div className="text-xs font-medium text-secondary uppercase tracking-wider truncate">
                        {tenantName}
                    </div>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.iconName];
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all select-none active:scale-95 active:opacity-70 ${isActive(item.href)
                                    ? "bg-primary/20 text-white"
                                    : "text-secondary hover:text-white hover:bg-primary/10"
                                    }`}
                            >
                                {Icon && <Icon className="w-5 h-5" />}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-primary/20">
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-secondary hover:text-white hover:bg-danger/10 hover:text-danger transition-colors"
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

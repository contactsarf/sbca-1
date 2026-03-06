"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    ClipboardList,
    Users,
    UserSquare2,
    Settings,
    Scissors
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    iconName: string;
}

interface AdminSidebarNavProps {
    navItems: NavItem[];
}

// Icon map moved to client component
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Calendar,
    ClipboardList,
    Users,
    UserSquare2,
    Settings,
    Scissors,
};

export default function AdminSidebarNav({ navItems }: AdminSidebarNavProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <>
            {navItems.map((item) => {
                const Icon = iconMap[item.iconName];
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium transition-all select-none active:scale-95 active:opacity-70 group ${
                            active
                                ? "bg-primary/20 text-white"
                                : "text-secondary hover:text-white hover:bg-primary/10"
                        }`}
                    >
                        {Icon && <Icon className="w-5 h-5" />}
                        {item.label}
                    </Link>
                );
            })}
        </>
    );
}

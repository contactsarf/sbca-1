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
    isCondensed?: boolean;
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

export default function AdminSidebarNav({ navItems, isCondensed = false }: AdminSidebarNavProps) {
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
                    <div key={item.href} className="contents">
                        <Link
                            href={item.href}
                            className={`flex items-center rounded-lg font-medium transition-all select-none active:scale-95 active:opacity-70 group ${active
                                ? "bg-primary/20 text-white"
                                : "text-secondary hover:text-white hover:bg-primary/10"
                                } ${isCondensed ? "flex-col gap-1 px-1 py-3 text-[10px]" : "gap-3 px-4 py-3.5 text-sm"}`}
                            title={isCondensed ? item.label : undefined}
                        >
                            {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                            <span className={isCondensed ? "uppercase tracking-tighter text-center leading-none opacity-80" : ""}>
                                {item.label}
                            </span>
                        </Link>
                        {item.iconName === "Calendar" && (
                            <div className="my-2 h-px bg-primary/10 w-full" />
                        )}
                    </div>
                );
            })}
        </>
    );
}

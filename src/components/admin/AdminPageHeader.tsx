import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    action?: {
        href: string;
        label: string;
        icon: LucideIcon;
    };
}

/**
 * Consistent page header for all admin pages.
 * On mobile: shows icon-only pill button.
 * On sm+: shows icon + label.
 */
export default function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
    const Icon = action?.icon;

    return (
        <header className="flex items-center justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
                {description && (
                    <p className="text-sm text-tertiary mt-0.5">{description}</p>
                )}
            </div>

            {action && Icon && (
                <Link
                    href={action.href}
                    aria-label={action.label}
                    className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-dark h-10 rounded-lg font-medium transition-colors shrink-0 px-3 sm:px-4"
                >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline text-sm">{action.label}</span>
                </Link>
            )}
        </header>
    );
}

import Link from "next/link";

const footerLinks = [
    { label: "Terms of Service", href: "/marketing/terms" },
    { label: "Privacy Policy", href: "/marketing/privacy" },
    { label: "Security", href: "/marketing/security" },
    { label: "FAQ", href: "/marketing/faq" },
];

export default function Footer() {
    return (
        <footer className="border-t border-slate-100 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#5D6D63]">
                    © {new Date().getFullYear()} StayBooked.ca — All rights reserved.
                </p>
                <nav className="flex flex-wrap items-center gap-4 justify-center">
                    {footerLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-xs text-[#5D6D63] hover:text-[#2D523E] transition-colors duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    );
}

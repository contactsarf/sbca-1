"use client";

import Link from "next/link";

function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg leading-none select-none">
                S
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
                Stay<span className="font-bold text-primary">Booked</span>
                <span className="text-slate-400">.ca</span>
            </span>
        </Link>
    );
}

const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/marketing/faq" },
];

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 mb-3 md:mb-0 w-full border-b border-slate-100 bg-white/90 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Logo />

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm text-tertiary hover:text-primary transition-colors duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-2">
                    <Link
                        href="/en/auth/login"
                        className="h-9 px-4 rounded-lg text-sm font-medium text-tertiary border border-tertiary/50 hover:bg-background transition-colors duration-200 flex items-center"
                    >
                        Login
                    </Link>
                    <Link
                        href="/en/auth/signup"
                        className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors duration-200 flex items-center"
                    >
                        Sign Up Free
                    </Link>
                </div>

                {/* Mobile CTA */}
                <div className="md:hidden flex items-center gap-2">
                    <Link
                        href="/en/auth/login"
                        className="h-8 px-3 rounded-lg text-xs font-medium text-tertiary border border-tertiary/40 hover:bg-background transition-colors duration-200 inline-flex items-center"
                    >
                        Login
                    </Link>
                    <Link
                        href="/en/auth/signup"
                        className="h-8 px-3 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary-dark transition-colors duration-200 inline-flex items-center"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>

            {/* Mobile second row nav */}
            <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-2">
                <div className="mx-auto flex h-9 max-w-6xl items-center justify-center gap-2 overflow-x-auto">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="inline-flex h-7 items-center rounded-md px-3 text-sm font-semibold text-tertiary hover:bg-background hover:text-primary transition-colors duration-200 whitespace-nowrap"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </nav>
        </header>
    );
}

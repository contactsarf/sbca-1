import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
    CalendarCheck,
    Users,
    BadgeDollarSign,
    BarChart3,
    QrCode,
    Globe,
    Smartphone,
    ShieldCheck,
    FileText,
    Scissors,
    HeartPulse,
    Dumbbell,
    Stethoscope,
    Sparkles,
    Brain,
    Star,
    CheckCircle2,
    ArrowRight,
    PackageSearch,
} from "lucide-react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
    title: "StayBooked.ca - Smart Online Booking for Service Businesses",
    description:
        "Simplify appointment booking for your salon, spa, clinic, or service business. Multi-staff scheduling, deposits, tax reports, and more - no monthly fees.",
    keywords: [
        "online booking",
        "appointment scheduling",
        "salon software",
        "spa booking",
        "service business",
        "booking system Canada",
    ],
};

/* ─────────────────────────── HERO ─────────────────────────── */
function Hero() {
    return (
        <section className="relative overflow-hidden bg-white pt-24 pb-28 sm:pt-32 sm:pb-40">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Copy */}
                    <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
                        
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
                            Never Miss a{" "}
                            <span className="text-primary">Booking Again</span>
                        </h1>
                        <p className="text-lg text-tertiary leading-relaxed max-w-lg mx-auto lg:mx-0">
                            The simplest way to take online bookings for your service
                            business. Multi-staff scheduling, group bookings, deposits, and
                            powerful reports all with no monthly fees.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                            <Link
                                href="/en/auth/signup"
                                className="h-12 px-8 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                Get Started for Free
                                <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/#features"
                                className="h-12 px-8 rounded-xl text-sm font-bold text-tertiary border-2 border-slate-200 hover:border-slate-300 hover:bg-background transition-all duration-200 flex items-center justify-center"
                            >
                                See Features
                            </Link>
                        </div>
                        <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                            No credit card required &middot; Setup in 5 minutes
                        </p>
                    </div>

                    {/* Hero image */}
                    <div className="flex-1 w-full relative">
                        <div className="absolute -inset-4 bg-secondary/20 rounded-[2.5rem] blur-2xl lg:-rotate-2"></div>
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 lg:rotate-1">
                            <Image
                                src="/booking-flow-illustration.svg"
                                alt="StayBooked appointment booking dashboard"
                                width={800}
                                height={500}
                                priority
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────── PURPOSE ─────────────────────────── */
function Purpose() {
    const stats = [
        { value: "29¢", label: "per booking, that's it" },
        { value: "5 min", label: "to get up and running" },
        { value: "100%", label: "of your data, always yours" },
    ];

    return (
        <section className="bg-background py-24 sm:py-32 border-y border-slate-100">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                        Built for Businesses That Run on Appointments
                    </h2>
                    <p className="text-base text-tertiary leading-relaxed">
                        Phone-tag, no-shows, and manual scheduling cost you hours every
                        week. StayBooked puts your booking page online in minutes, reminds
                        your clients automatically, and keeps every detail organized — so
                        you stay focused on delivering great service.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-20">
                    {stats.map((s) => (
                        <div
                            key={s.value}
                            className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm hover:shadow-md hover:border-secondary/50 transition-all duration-200"
                        >
                            <p className="text-4xl font-extrabold text-primary tracking-tight">{s.value}</p>
                            <p className="text-sm font-semibold text-tertiary mt-2">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Problem → solution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        {
                            problem: "Double-bookings and scheduling chaos",
                            solution: "Real-time availability with staff-level calendars",
                        },
                        {
                            problem: "Clients who no-show without warning",
                            solution: "Deposit collection locks in commitment upfront",
                        },
                        {
                            problem: "Hours lost on tax and financial paperwork",
                            solution: "Automated GST/HST reports and financial statements",
                        },
                        {
                            problem: "Expensive per-seat monthly SaaS bills",
                            solution: "Pay 29¢ per booking, nothing when business is slow",
                        },
                    ].map((item) => (
                        <div
                            key={item.problem}
                            className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-5 items-start shadow-sm"
                        >
                            <div className="mt-1 shrink-0 bg-success/10 p-1.5 rounded-lg text-success">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-slate-400 line-through font-medium leading-none">
                                    {item.problem}
                                </p>
                                <p className="text-base text-foreground font-bold tracking-tight">
                                    {item.solution}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────── CLIENT SEGMENTS ─────────────────────────── */
const segments = [
    { icon: Scissors, label: "Salons & Barbers" },
    { icon: HeartPulse, label: "Massage & Wellness" },
    { icon: Sparkles, label: "Medical Spas" },
    { icon: Stethoscope, label: "Physiotherapy" },
    { icon: Brain, label: "Therapists & Coaches" },
    { icon: Dumbbell, label: "Personal Training" },
    { icon: Sparkles, label: "Skin & Beauty Care" },
    { icon: HeartPulse, label: "Dentists & Clinics" },
];

function ClientSegments() {
    return (
        <section className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                        Made for Every Service Business
                    </h2>
                    <p className="text-base text-tertiary max-w-2xl mx-auto">
                        If your business runs on appointments, StayBooked was built for you. Join businesses of all sizes streamlining their operations.
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {segments.map(({ icon: Icon, label }) => (
                        <div
                            key={label}
                            className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-background p-8 hover:border-secondary hover:bg-secondary/10 hover:shadow-lg hover:shadow-secondary/10 hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                                <Icon size={28} className="text-primary group-hover:text-white transition-colors duration-300" />
                            </div>
                            <p className="text-sm font-bold text-foreground text-center tracking-tight">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────── FEATURES ─────────────────────────── */
const features = [
    {
        icon: Globe,
        title: "Branded Booking Page",
        desc: "Your own public booking link with your logo and brand colours.",
    },
    {
        icon: BadgeDollarSign,
        title: "Booking Deposits",
        desc: "Require upfront deposits to reduce no-shows and protect your time.",
    },
    {
        icon: CalendarCheck,
        title: "Services & Pricing",
        desc: "Manage your full service menu with durations and prices.",
    },
    {
        icon: Users,
        title: "Staff Scheduling",
        desc: "Per-staff calendars, time-off management, and commission tracking.",
    },
    {
        icon: FileText,
        title: "Tax Management",
        desc: "Configure tax rates and generate GST/HST-ready reports instantly.",
    },
    {
        icon: BarChart3,
        title: "Business Insights",
        desc: "A powerful dashboard showing revenue, trends, and booking metrics.",
    },
    {
        icon: CalendarCheck,
        title: "Flexible Calendar Views",
        desc: "Day, week, and per-staff calendar views for your whole team.",
    },
    {
        icon: ShieldCheck,
        title: "No Monthly Fees",
        desc: "Pay only when you get bookings — 29¢ each. Zero when it's quiet.",
    },
    {
        icon: BadgeDollarSign,
        title: "Staff Earnings Reports",
        desc: "Track commissions, payouts, and individual performance.",
    },
    {
        icon: FileText,
        title: "Full Financial Statements",
        desc: "GST/HST reports and income statements ready for your accountant.",
    },
    {
        icon: QrCode,
        title: "QR Code for Walk-ins",
        desc: "Print your QR code — clients scan and book on the spot.",
    },
    {
        icon: Globe,
        title: "English & French",
        desc: "Full bilingual support for your team and your clients.",
    },
    {
        icon: Smartphone,
        title: "Mobile-First Booking",
        desc: "Your clients book from their phones — so we built for mobile first.",
    },
];

const comingSoon = [
    { icon: PackageSearch, title: "Expense Tracking" },
    { icon: BadgeDollarSign, title: "Payroll & Payouts" },
    { icon: ShieldCheck, title: "In-Store & Online Products" },
];

function Features() {
    return (
        <section id="features" className="scroll-mt-24 md:scroll-mt-16 bg-background py-24 sm:py-32 border-y border-slate-100">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                        Everything You Need, Nothing You Don&apos;t
                    </h2>
                    <p className="text-base text-tertiary">
                        All features included, no add-ons, no tiers, no surprises.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="group bg-white rounded-2xl border border-slate-200 p-6 flex gap-5 items-start hover:border-secondary hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className="mt-0.5 shrink-0 w-12 h-12 rounded-xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-300">
                                <Icon size={24} className="text-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-base font-bold text-foreground tracking-tight">{title}</p>
                                <p className="text-sm text-tertiary leading-relaxed">
                                    {desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coming soon */}
                <div className="rounded-3xl border-2 border-dashed border-secondary/30 bg-secondary/10 p-8 sm:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles size={120} className="text-primary" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">
                            Coming in the Next Release
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {comingSoon.map(({ icon: Icon, title }) => (
                                <div
                                    key={title}
                                    className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-5 py-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                    <Icon size={18} className="text-primary" />
                                    <span className="text-sm font-bold text-tertiary">{title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────── PRICING ─────────────────────────── */
const pricingPerks = [
    "All features included — no tiers",
    "Multi-staff & group bookings",
    "GST/HST reports & financials",
    "QR code & branded booking page",
    "No lock-in - cancel anytime",
    "Export all your data, anytime",
];

function Pricing() {
    return (
        <section id="pricing" className="scroll-mt-24 md:scroll-mt-16 bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                        One Plan. One Price.
                    </h2>
                    <p className="text-base text-tertiary">
                        Only pay when you get bookings. Zero when business is slow.
                    </p>
                </div>
                <div className="mx-auto max-w-md">
                    <div className="rounded-[2.5rem] border-4 border-primary bg-white p-10 sm:p-12 shadow-[0_32px_64px_-16px_rgba(45,82,62,0.15)] text-center space-y-10 relative">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.25em] px-6 py-2 rounded-full shadow-lg">
                            Most Transparent
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-start justify-center text-foreground">
                                <p className="text-6xl sm:text-7xl font-black tracking-tighter">
                                    29<span className="text-3xl sm:text-4xl">¢</span>
                                </p>
                            </div>
                            <p className="text-base font-bold text-tertiary uppercase tracking-wide">per booking</p>
                            <p className="text-xs font-semibold text-slate-400 max-w-[240px] mx-auto">
                                Billed at month-end &mdash; zero if no bookings
                            </p>
                        </div>

                        <div className="border-t border-slate-100 pt-10">
                            <ul className="space-y-4 text-left">
                                {pricingPerks.map((p) => (
                                    <li key={p} className="flex items-center gap-3 text-sm font-semibold text-tertiary">
                                        <div className="bg-success text-white p-0.5 rounded-full shadow-sm">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4 pt-4">
                            <Link
                                href="/en/auth/signup"
                                className="block h-14 rounded-2xl text-base font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                Get Started for Free
                                <ArrowRight size={20} />
                            </Link>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No credit card required</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────── TESTIMONIALS ─────────────────────────── */
const testimonials = [
    {
        name: "Amara Johnson",
        role: "Owner, Glow Skin Studio",
        quote:
            "We used to lose bookings every weekend because we couldn't answer the phone fast enough. StayBooked solved that overnight — clients book themselves and we just show up ready.",
    },
    {
        name: "Marcus Tremblay",
        role: "Head Barber, The Sharp Edge",
        quote:
            "The per-booking fee model is brilliant for us. January is slow? We pay almost nothing. The QR code on our window brings in walk-ins who actually book instead of just asking prices.",
    },
    {
        name: "Dr. Priya Nair",
        role: "Founder, Align Physiotherapy",
        quote:
            "Managing three therapists' schedules was a nightmare in spreadsheets. The per-staff calendar and the GST report alone saved us hours every month. Worth every penny — and there are very few pennies.",
    },
];

function Testimonials() {
    return (
        <section className="bg-background py-24 sm:py-32 border-y border-slate-100">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                        Loved by Service Businesses Across Canada
                    </h2>
                    <p className="text-base text-tertiary">
                        Real feedback from entrepreneurs like you.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t) => (
                        <div
                            key={t.name}
                            className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6 shadow-sm hover:shadow-xl hover:border-secondary/30 transition-all duration-300"
                        >
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={18}
                                        className="text-warning fill-warning"
                                    />
                                ))}
                            </div>
                            <p className="text-base text-tertiary leading-relaxed italic">
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                                    <p className="text-xs font-semibold text-slate-400">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────── CTA BANNER ─────────────────────────── */
function CtaBanner() {
    return (
        <section className="bg-primary py-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
            </div>
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-10 relative z-10">
                <div className="space-y-4">
                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        Ready to Fill Your Schedule?
                    </h2>
                    <p className="text-lg text-secondary/60 font-medium">
                        Join hundreds of service businesses already using StayBooked.ca
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link
                        href="/en/auth/signup"
                        className="h-14 px-12 rounded-2xl text-base font-bold text-primary bg-white hover:bg-background shadow-xl shadow-black/10 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        Get Started for Free
                        <ArrowRight size={20} />
                    </Link>
                    <Link
                        href="/pricing"
                        className="text-white hover:text-secondary/60 font-bold text-base transition-colors duration-200"
                    >
                        View Full Pricing Details
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────── PAGE ─────────────────────────── */
export default function HomePage() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <Purpose />
                <ClientSegments />
                <Features />
                <Pricing />
                <Testimonials />
                <CtaBanner />
            </main>
            <Footer />
        </>
    );
}

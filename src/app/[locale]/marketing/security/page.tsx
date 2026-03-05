import type { Metadata } from "next";
import { ShieldCheck, Lock, Server, CreditCard, RefreshCw, Eye } from "lucide-react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
    title: "Security — StayBooked.ca",
    description:
        "How StayBooked.ca keeps your business data and your clients' information secure.",
};

const pillars = [
    {
        icon: Server,
        title: "Canadian Data Infrastructure",
        body: "All data is stored on Supabase's Canadian-region infrastructure. We have explicitly configured data residency so your data — and your clients' data — never leaves Canada without your consent.",
    },
    {
        icon: Lock,
        title: "Encryption End-to-End",
        body: "Data is encrypted at rest using AES-256 and in transit using TLS 1.2 or higher. Passwords are hashed using bcrypt and are never stored in plain text.",
    },
    {
        icon: ShieldCheck,
        title: "Authentication via Supabase Auth",
        body: "User authentication is handled by Supabase Auth, which implements industry best practices: secure session tokens, OAuth support, automatic token refresh, and protection against common authentication attacks.",
    },
    {
        icon: CreditCard,
        title: "PCI-DSS Compliant Payments via Stripe",
        body: "We never store, process, or transmit credit card data. All payment collection is delegated to Stripe, a PCI-DSS Level 1 certified payment processor — the highest level of payment security certification available.",
    },
    {
        icon: RefreshCw,
        title: "Automated Backups",
        body: "Your data is automatically backed up daily. Backups are stored in separate regions and are encrypted. In the event of a system failure, we can restore data to within a 24-hour recovery point.",
    },
    {
        icon: Eye,
        title: "Access Controls & Audit Logging",
        body: "We enforce strict Row-Level Security (RLS) policies at the database level — ensuring each tenant can only access their own data, even in the event of an application-layer bug. Administrative access to production systems is logged and audited.",
    },
];

const practices = [
    "Dependency and vulnerability scanning on every code deployment",
    "No direct database access from user-facing interfaces",
    "Environment secrets managed via encrypted secret management, never hard-coded",
    "Regular penetration testing and security reviews",
    "Incident response plan with notification SLA of 72 hours",
];

export default function SecurityPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#EEF0EE]">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="text-center space-y-3 mb-14">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2D523E]/10 mb-2">
                            <ShieldCheck size={24} className="text-[#2D523E]" />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#081C15]">
                            Security at StayBooked.ca
                        </h1>
                        <p className="text-sm text-[#5D6D63] max-w-xl mx-auto leading-relaxed">
                            We treat your business data and your clients&apos; privacy with the utmost seriousness. Here is exactly how we protect it.
                        </p>
                    </div>

                    {/* Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                        {pillars.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="bg-white rounded-xl border border-slate-100 p-6 space-y-3"
                            >
                                <div className="w-9 h-9 rounded-lg bg-[#2D523E]/10 flex items-center justify-center">
                                    <Icon size={18} className="text-[#2D523E]" />
                                </div>
                                <h2 className="text-sm font-semibold text-[#081C15]">{title}</h2>
                                <p className="text-sm text-[#5D6D63] leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>

                    {/* Additional practices */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
                        <h2 className="text-sm font-semibold text-[#081C15]">
                            Additional Security Practices
                        </h2>
                        <ul className="space-y-2">
                            {practices.map((p) => (
                                <li key={p} className="flex items-start gap-2 text-sm text-[#5D6D63]">
                                    <ShieldCheck size={14} className="text-[#16A34A] mt-0.5 shrink-0" />
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Disclosure */}
                    <div className="mt-8 rounded-xl border border-[#9BA894] bg-[#E6ECEA] p-5">
                        <p className="text-sm text-[#5D6D63] leading-relaxed">
                            <span className="font-medium text-[#2D523E]">Responsible Disclosure:</span>{" "}
                            If you discover a potential security vulnerability in our platform, please report it responsibly to{" "}
                            <a href="mailto:security@staybooked.ca" className="text-[#2D523E] hover:underline">
                                security@staybooked.ca
                            </a>
                            . We commit to responding within 48 hours and to working collaboratively toward a resolution.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

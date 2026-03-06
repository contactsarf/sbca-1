import type { Metadata } from "next";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
    title: "Privacy Policy — StayBooked.ca",
    description: "StayBooked.ca Privacy Policy. Learn how we collect, use, and protect your data in compliance with PIPEDA.",
};

const sections = [
    {
        heading: "1. Our Commitment to Privacy",
        body: `StayBooked Inc. ("we," "us," or "our") is committed to protecting the privacy of individuals who use our Platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information in accordance with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation.`,
    },
    {
        heading: "2. Information We Collect",
        body: `We collect the following categories of information:\n\n• Account Information: your name, business name, email address, and password when you register.\n• Business Data: services, staff details, scheduling information, and pricing you configure.\n• Client Data: names, email addresses, and phone numbers of your clients that you enter or that clients provide when booking.\n• Booking Records: appointment history, service selections, and notes.\n• Financial Records: booking fees, deposit amounts, and invoice history (we do not collect payment card data).\n• Usage Data: pages viewed, features used, IP address, browser type, and session duration, collected automatically via cookies and server logs.`,
    },
    {
        heading: "3. How We Use Your Information",
        body: `We use your information to:\n• Operate and maintain the Platform;\n• Process bookings and send confirmation communications;\n• Generate financial and tax reports for your account;\n• Calculate and collect platform fees;\n• Send service updates, security alerts, and administrative messages;\n• Improve the Platform through aggregated usage analytics;\n• Comply with legal obligations.`,
    },
    {
        heading: "4. Legal Basis for Processing",
        body: `We process your personal information based on: (a) performance of the contract between you and StayBooked Inc.; (b) your explicit consent; or (c) our legitimate interests in operating a secure and effective platform, provided those interests are not overridden by your rights.`,
    },
    {
        heading: "5. Disclosure of Information",
        body: `We do not sell your personal information. We may share information with:\n• Service Providers: Supabase (database and authentication infrastructure) and Stripe (payment processing), both subject to strict data processing agreements.\n• Legal Compliance: where required by law, court order, or government authority.\n• Business Transfer: in the event of a merger, acquisition, or sale of assets, with notification to affected users.\nAll third-party service providers are contractually required to protect your data and use it only for the purposes we specify.`,
    },
    {
        heading: "6. Data Storage and Residency",
        body: `All data is stored on Canadian infrastructure. We have explicitly configured our database provider (Supabase) to use Canadian data regions. Your data does not leave Canada except as required by law.`,
    },
    {
        heading: "7. Data Retention",
        body: `We retain your account and business data for as long as your account is active. Upon account closure, we retain data for 30 days to allow for export, then permanently delete it. Financial records required for tax and legal purposes may be retained for up to 7 years in anonymized or aggregated form.`,
    },
    {
        heading: "8. Cookies and Tracking",
        body: `We use strictly necessary cookies to maintain your session and authenticate your account. We also use analytics cookies to understand how the Platform is used. You can disable cookies in your browser settings, but some features may not function correctly as a result.`,
    },
    {
        heading: "9. Your Rights",
        body: `Under PIPEDA, you have the right to:\n• Access the personal information we hold about you;\n• Request corrections to inaccurate or incomplete information;\n• Withdraw consent to processing where consent is the legal basis;\n• Request deletion of your account and associated data;\n• Receive a copy of your data in a portable format.\nTo exercise these rights, contact us at support@staybooked.ca.`,
    },
    {
        heading: "10. Children's Privacy",
        body: `The Platform is not directed at individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected such information, contact us immediately.`,
    },
    {
        heading: "11. Changes to This Policy",
        body: `We may update this Privacy Policy periodically. Material changes will be communicated via email at least 14 days before they take effect. Continued use of the Platform after such notice constitutes acceptance of the revised policy.`,
    },
    {
        heading: "12. Contact Our Privacy Officer",
        body: `If you have questions, concerns, or complaints about our privacy practices, contact:\n\nPrivacy Officer\nStayBooked Inc.\nEmail: support@staybooked.ca`,
    },
];

export default function PrivacyPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="mb-10 space-y-2">
                        <h1 className="text-3xl font-semibold text-foreground">
                            Privacy Policy
                        </h1>
                        <p className="text-xs text-slate-400">
                            Last updated: March 2025 &middot; PIPEDA Compliant
                        </p>
                    </div>
                    <div className="space-y-8">
                        {sections.map((s) => (
                            <div key={s.heading} className="space-y-2">
                                <h2 className="text-base font-semibold text-foreground">
                                    {s.heading}
                                </h2>
                                <p className="text-sm text-tertiary leading-relaxed whitespace-pre-line">
                                    {s.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

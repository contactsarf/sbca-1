import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
    title: "FAQ — StayBooked.ca",
    description:
        "Frequently asked questions about StayBooked.ca — registration, billing, data, and more.",
};

const faqs = [
    {
        category: "Getting Started",
        items: [
            {
                q: "How do I create an account?",
                a: "Click \"Sign Up Free\" on our homepage. Enter your business name, email, and a password. You'll have your booking page live in under 5 minutes — no credit card needed.",
            },
            {
                q: "Do I need technical knowledge to set up StayBooked?",
                a: "None at all. If you can fill out a form, you can set up StayBooked. We walk you through adding your services, staff, and hours step by step.",
            },
            {
                q: "Can I import my existing client list?",
                a: "Yes — you can upload a CSV of existing clients from the Clients section of your dashboard.",
            },
        ],
    },
    {
        category: "Billing & Pricing",
        items: [
            {
                q: "How much does StayBooked cost?",
                a: "Just 29¢ per confirmed booking, charged at the end of each month. There are no monthly subscriptions, setup fees, or per-user charges. If you have zero bookings in a month, you pay nothing.",
            },
            {
                q: "When am I billed?",
                a: "At the end of each calendar month, we tally your confirmed bookings and send an invoice. Payment is due within 7 days.",
            },
            {
                q: "What if I cancel a booking — am I still charged?",
                a: "No. Only confirmed, completed bookings count toward your invoice. Cancelled and no-show bookings are not charged.",
            },
            {
                q: "Are deposits collected from clients counted in my fees?",
                a: "Deposits go directly to your payment account. The 29¢ platform fee is a separate charge from StayBooked and is not deducted from your deposits.",
            },
            {
                q: "Do you store my clients' credit card information?",
                a: "No. All payment processing is handled by Stripe, which is PCI-DSS compliant. StayBooked never sees or stores card numbers.",
            },
        ],
    },
    {
        category: "Bookings & Scheduling",
        items: [
            {
                q: "Can clients book directly, or does it have to go through me?",
                a: "Both. You get a public booking page your clients can use 24/7. You can also create bookings manually from your admin dashboard.",
            },
            {
                q: "Does StayBooked support group bookings?",
                a: "Yes. You can configure services to allow multiple clients per slot — useful for classes, group sessions, or workshops.",
            },
            {
                q: "How do staff members access their schedule?",
                a: "Staff members log in to the shared dashboard and see only their own schedule and assigned appointments.",
            },
            {
                q: "Can I set different availability for different staff?",
                a: "Yes. Each staff member has their own working hours, days off, and blocked times that are respected during booking.",
            },
        ],
    },
    {
        category: "Data & Privacy",
        items: [
            {
                q: "Where is my data stored?",
                a: "All data is stored in Canada, on Canadian infrastructure. We use Supabase with Canadian region settings.",
            },
            {
                q: "Can I export my data?",
                a: "Yes, at any time. Go to Settings → Export Data to download all your clients, bookings, and financial records as CSV files.",
            },
            {
                q: "What happens to my data if I close my account?",
                a: "We give you a 30-day window to export everything. After that, your data is permanently and irreversibly deleted from our systems.",
            },
            {
                q: "Is my data encrypted?",
                a: "Yes. All data is encrypted at rest and in transit using industry-standard TLS and AES-256 encryption.",
            },
        ],
    },
    {
        category: "Tax & Reporting",
        items: [
            {
                q: "Does StayBooked handle GST/HST?",
                a: "Yes. You configure your applicable tax rates, and StayBooked applies them automatically to invoices and generates GST/HST-ready reports for your accountant.",
            },
            {
                q: "Can my accountant access financial reports directly?",
                a: "You can export financial statements and tax reports as PDFs or CSVs to share with your accountant.",
            },
        ],
    },
];

export default function FaqPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="text-center space-y-2 mb-12">
                        <h1 className="text-3xl font-semibold text-foreground">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-sm text-tertiary">
                            Can&apos;t find what you&apos;re looking for?{" "}
                            <Link href="mailto:hello@staybooked.ca" className="text-primary hover:underline">
                                Contact us
                            </Link>
                        </p>
                    </div>

                    <div className="space-y-10">
                        {faqs.map((section) => (
                            <div key={section.category}>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                                    {section.category}
                                </h2>
                                <div className="space-y-3">
                                    {section.items.map((item) => (
                                        <div
                                            key={item.q}
                                            className="bg-white rounded-xl border border-slate-100 p-5 space-y-2"
                                        >
                                            <p className="text-sm font-medium text-foreground">
                                                {item.q}
                                            </p>
                                            <p className="text-sm text-tertiary leading-relaxed">
                                                {item.a}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

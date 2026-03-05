import type { Metadata } from "next";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
    title: "Terms of Service — StayBooked.ca",
    description: "StayBooked.ca Terms of Service. Read our full terms covering usage, billing, data, and liability.",
};

const sections = [
    {
        heading: "1. Acceptance of Terms",
        body: `By registering for or using StayBooked.ca ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform. The Platform is operated by StayBooked Inc., a company incorporated under the laws of Canada ("we," "us," or "our").`,
    },
    {
        heading: "2. Eligibility",
        body: `You must be at least 18 years of age and operate a legitimate service-based business to use the Platform. By using the Platform, you represent and warrant that you meet these requirements.`,
    },
    {
        heading: "3. Platform Services",
        body: `StayBooked.ca provides an online appointment booking and business management platform for service providers. Features include, but are not limited to: public booking pages, staff scheduling, service management, deposit collection, financial reporting, and client management. Features may be updated, added, or removed at our sole discretion with reasonable notice to users.`,
    },
    {
        heading: "4. Fees and Billing",
        body: `Use of the Platform is subject to a per-booking fee of CAD $0.29 per confirmed booking. Fees are calculated at the end of each calendar month and invoiced accordingly. Payment is due within 7 days of invoice date. Cancelled or no-show bookings are not charged. We reserve the right to modify our fee structure with at least 30 days' written notice. Failure to pay outstanding invoices may result in suspension of your account.`,
    },
    {
        heading: "5. Payment Processing",
        body: `Payments from your clients (including deposits) are processed through Stripe, a third-party payment processor. StayBooked.ca does not store, process, or have access to your clients' credit card or banking information. Your use of Stripe is subject to Stripe's own Terms of Service and Privacy Policy. We are not responsible for any errors, failures, or disputes arising from Stripe's services.`,
    },
    {
        heading: "6. Data Storage and Location",
        body: `All data collected and generated through the Platform is stored on servers located in Canada. We use Supabase as our infrastructure provider and have configured data residency in Canadian regions. We do not transfer your data outside of Canada without your explicit consent, except as required by applicable law.`,
    },
    {
        heading: "7. Data Security",
        body: `We employ industry-standard security measures including AES-256 encryption at rest, TLS 1.2+ encryption in transit, daily automated backups, and role-based access controls. While we take all reasonable precautions, no method of electronic transmission or storage is 100% secure. You use the Platform at your own risk insofar as security is concerned.`,
    },
    {
        heading: "8. Data Ownership and Export",
        body: `You retain full ownership of all data you input into the Platform, including client records, booking history, and financial data. You may export your data at any time from the Settings section of your account dashboard. Upon account termination, you will have 30 days to export your data, after which it will be permanently deleted from our systems.`,
    },
    {
        heading: "9. Acceptable Use",
        body: `You agree not to use the Platform for any unlawful purpose, to transmit spam or unsolicited communications, to infringe on any intellectual property rights, or to introduce malicious code. We reserve the right to terminate accounts that violate these provisions without refund.`,
    },
    {
        heading: "10. Limitation of Liability",
        body: `To the maximum extent permitted by applicable Canadian law, our total liability to you for any claim arising out of or relating to these Terms or your use of the Platform shall not exceed the total booking fees you have paid to us in the three (3) calendar months preceding the claim. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, or data.`,
    },
    {
        heading: "11. Indemnification",
        body: `You agree to defend, indemnify, and hold harmless StayBooked Inc. and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in connection with your use of the Platform, your violation of these Terms, or your violation of any rights of a third party.`,
    },
    {
        heading: "12. Termination",
        body: `You may terminate your account at any time from the Settings page. We may terminate or suspend your access immediately, without prior notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Platform ceases immediately.`,
    },
    {
        heading: "13. Governing Law",
        body: `These Terms are governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the courts located in Ontario, Canada.`,
    },
    {
        heading: "14. Changes to These Terms",
        body: `We reserve the right to modify these Terms at any time. We will provide at least 14 days' notice via email before material changes take effect. Continued use of the Platform after such notice constitutes your acceptance of the revised Terms.`,
    },
    {
        heading: "15. Contact Us",
        body: `For questions about these Terms, please contact us at: legal@staybooked.ca`,
    },
];

export default function TermsPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#EEF0EE]">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="mb-10 space-y-2">
                        <h1 className="text-3xl font-semibold text-[#081C15]">
                            Terms of Service
                        </h1>
                        <p className="text-xs text-[#94A3B8]">
                            Last updated: March 2025 &middot; Effective immediately
                        </p>
                    </div>
                    <div className="space-y-8">
                        {sections.map((s) => (
                            <div key={s.heading} className="space-y-2">
                                <h2 className="text-base font-semibold text-[#081C15]">
                                    {s.heading}
                                </h2>
                                <p className="text-sm text-[#5D6D63] leading-relaxed">{s.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

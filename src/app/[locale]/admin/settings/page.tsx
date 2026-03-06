"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Camera, CreditCard, Globe, Instagram, Mail, MapPin, MessageSquare, Phone, Settings, Store } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "public", label: "Public Booking", icon: Store },
    { id: "billing", label: "Billing & Invoicing", icon: CreditCard },
];

const LOGO_BUCKET = "avatars";
const DEFAULT_LOGO_SIZE = 72;

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const params = useParams();
    const locale = params.locale as string;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        name: "",
        slug: "",
        timezone: "America/Toronto",
        tax_province: "ON",
        primary_contact_name: "",
        primary_contact_email: "",
        primary_contact_phone: "",
        logo_url: "",
        logo_size: DEFAULT_LOGO_SIZE,
        public_email: "",
        public_phone: "",
        public_website: "",
        public_instagram: "",
        public_address: "",
        public_message: "",
        public_booking_enabled: true,
        stripe_connect_account_id: "",
        stripe_connect_status: "not_connected",
        interac_email: "",
    });
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [saveSuccess, setSaveSuccess] = useState(false);

    const stripeStatusLabel = useMemo(() => {
        if (settings.stripe_connect_status === "connected") return "Connected";
        if (settings.stripe_connect_status === "pending") return "Pending";
        return "Not connected";
    }, [settings.stripe_connect_status]);

    const inferProvinceFromTimezone = (timezone: string): string => {
        const timezoneToProvince: Record<string, string> = {
            'America/Toronto': 'ON',
            'America/Vancouver': 'BC',
            'America/Edmonton': 'AB',
            'America/Winnipeg': 'MB',
            'America/Regina': 'SK',
            'America/Halifax': 'NS',
            'America/Moncton': 'NB',
            'America/St_Johns': 'NL',
            'America/Whitehorse': 'YT',
            'America/Yellowknife': 'NT',
            'America/Iqaluit': 'NU',
            'America/Charlottetown': 'PE',
        };
        return timezoneToProvince[timezone] || 'ON';
    };

    useEffect(() => {
        const loadSettings = async () => {
            const supabase = createClient();
            const { data: authData } = await supabase.auth.getUser();

            if (!authData?.user) {
                setIsLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("tenant_id")
                .eq("id", authData.user.id)
                .single();

            if (!profile?.tenant_id) {
                setIsLoading(false);
                return;
            }

            setTenantId(profile.tenant_id);

            const { data: tenant } = await supabase
                .from("tenant")
                .select("*")
                .eq("id", profile.tenant_id)
                .single();

            if (tenant) {
                // Auto-detect timezone on first load if not set or using default
                const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const shouldAutoDetect = !tenant.timezone || tenant.timezone === "America/Toronto";
                const detectedTimezone = shouldAutoDetect ? browserTimezone : tenant.timezone;
                
                // Auto-detect province based on timezone if not set or using default
                const shouldAutoDetectProvince = !tenant.tax_province || tenant.tax_province === "ON";
                const detectedProvince = shouldAutoDetectProvince ? inferProvinceFromTimezone(detectedTimezone) : tenant.tax_province;
                
                setSettings({
                    name: tenant.name ?? "",
                    slug: tenant.slug ?? "",
                    timezone: detectedTimezone,
                    tax_province: detectedProvince,
                    primary_contact_name: tenant.primary_contact_name ?? "",
                    primary_contact_email: tenant.primary_contact_email ?? "",
                    primary_contact_phone: tenant.primary_contact_phone ?? "",
                    logo_url: tenant.logo_url ?? "",
                    logo_size: tenant.logo_size ?? DEFAULT_LOGO_SIZE,
                    public_email: tenant.public_email ?? "",
                    public_phone: tenant.public_phone ?? "",
                    public_website: tenant.public_website ?? "",
                    public_instagram: tenant.public_instagram ?? "",
                    public_address: tenant.public_address ?? "",
                    public_message: tenant.public_message ?? "",
                    public_booking_enabled: tenant.public_booking_enabled ?? true,
                    stripe_connect_account_id: tenant.stripe_connect_account_id ?? "",
                    stripe_connect_status: tenant.stripe_connect_status ?? "not_connected",
                    interac_email: tenant.interac_email ?? "",
                });
            }

            setIsLoading(false);
        };

        loadSettings();
    }, []);

    // Update current time every minute for live timezone preview
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const updateField = (field: keyof typeof settings, value: string | number | boolean) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const normalizeSlug = (value: string) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    };

    const getCurrentTime = (timezone: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }).format(currentTime);
        } catch {
            return '';
        }
    };

    const saveSettings = async () => {
        if (!tenantId) return;
        setIsSaving(true);
        setSaveSuccess(false);
        const supabase = createClient();

        await supabase.from("tenant").update({
            name: settings.name || null,
            ...(settings.slug.trim() ? { slug: settings.slug.trim() } : {}),
            timezone: settings.timezone || null,
            tax_province: settings.tax_province || null,
            primary_contact_name: settings.primary_contact_name || null,
            primary_contact_email: settings.primary_contact_email || null,
            primary_contact_phone: settings.primary_contact_phone || null,
            logo_url: settings.logo_url || null,
            logo_size: settings.logo_size || DEFAULT_LOGO_SIZE,
            public_email: settings.public_email || null,
            public_phone: settings.public_phone || null,
            public_website: settings.public_website || null,
            public_instagram: settings.public_instagram || null,
            public_address: settings.public_address || null,
            public_message: settings.public_message || null,
            public_booking_enabled: settings.public_booking_enabled,
            stripe_connect_account_id: settings.stripe_connect_account_id || null,
            stripe_connect_status: settings.stripe_connect_status || "not_connected",
            interac_email: settings.interac_email || null,
        }).eq("id", tenantId);

        setIsSaving(false);
        setSaveSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            setSaveSuccess(false);
        }, 3000);
    };

    const handleStripeConnect = async () => {
        setIsConnectingStripe(true);
        try {
            const response = await fetch(`/api/stripe/connect?locale=${locale}`, { method: "POST" });
            const payload = await response.json();
            if (payload?.url) {
                window.location.href = payload.url;
            }
        } finally {
            setIsConnectingStripe(false);
        }
    };

    const handleLogoUpload = async (file: File) => {
        if (!tenantId) return;
        const supabase = createClient();
        setIsUploadingLogo(true);

        const fileExt = file.name.split(".").pop() || "png";
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${tenantId}/${fileName}`;

        const previewUrl = URL.createObjectURL(file);
        setLogoPreviewUrl(previewUrl);

        const { error: uploadError } = await supabase.storage
            .from(LOGO_BUCKET)
            .upload(filePath, file, { upsert: true });

        if (!uploadError) {
            const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
            updateField("logo_url", data.publicUrl);
        }

        setIsUploadingLogo(false);
    };

    const handleRemoveLogo = () => {
        if (logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl);
            setLogoPreviewUrl(null);
        }
        updateField("logo_url", "");
    };

    useEffect(() => {
        return () => {
            if (logoPreviewUrl) {
                URL.revokeObjectURL(logoPreviewUrl);
            }
        };
    }, [logoPreviewUrl]);

    return (
        <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-xl p-6 max-w-3xl mx-auto space-y-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-sm text-tertiary mt-0.5">Manage your business profile and booking preferences.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-primary text-white"
                                        : "text-tertiary hover:text-foreground hover:bg-primary/10"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === "general" && (
                <div className="bg-white shadow-sm rounded-xl p-6 max-w-3xl mx-auto">
                    <form className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Business Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="tenant_name" className="block text-sm font-semibold text-foreground mb-2">
                                    Business Name
                                </label>
                                <input
                                    id="tenant_name"
                                    name="tenant_name"
                                    type="text"
                                    value={settings.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="StayBooked Spa"
                                />
                            </div>

                            <div>
                                <label htmlFor="tax_province" className="block text-sm font-semibold text-foreground mb-2">
                                    Tax Province
                                </label>
                                <select
                                    id="tax_province"
                                    name="tax_province"
                                    value={settings.tax_province}
                                    onChange={(e) => updateField("tax_province", e.target.value)}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="ON">Ontario</option>
                                    <option value="BC">British Columbia</option>
                                    <option value="AB">Alberta</option>
                                    <option value="QC">Quebec</option>
                                    <option value="MB">Manitoba</option>
                                    <option value="SK">Saskatchewan</option>
                                    <option value="NS">Nova Scotia</option>
                                    <option value="NB">New Brunswick</option>
                                    <option value="NL">Newfoundland and Labrador</option>
                                    <option value="PE">Prince Edward Island</option>
                                    <option value="NT">Northwest Territories</option>
                                    <option value="NU">Nunavut</option>
                                    <option value="YT">Yukon</option>
                                </select>
                                <p className="mt-1 text-xs text-tertiary">
                                    Auto-detected based on your timezone
                                </p>
                            </div>

                            <div>
                                <label htmlFor="timezone" className="block text-sm font-semibold text-foreground mb-2">
                                    Timezone
                                </label>
                                <div className="space-y-2">
                                    <select
                                        id="timezone"
                                        name="timezone"
                                        value={settings.timezone}
                                        onChange={(e) => updateField("timezone", e.target.value)}
                                        className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    >
                                        <optgroup label="Canada - Eastern">
                                            <option value="America/Toronto">Toronto, Ottawa, Montreal</option>
                                        </optgroup>
                                        <optgroup label="Canada - Pacific">
                                            <option value="America/Vancouver">Vancouver, Victoria</option>
                                        </optgroup>
                                        <optgroup label="Canada - Mountain">
                                            <option value="America/Edmonton">Edmonton, Calgary</option>
                                        </optgroup>
                                        <optgroup label="Canada - Central">
                                            <option value="America/Winnipeg">Winnipeg, Regina</option>
                                        </optgroup>
                                        <optgroup label="Canada - Atlantic">
                                            <option value="America/Halifax">Halifax, Moncton</option>
                                        </optgroup>
                                        <optgroup label="Other Timezones">
                                            <option value="America/St_Johns">St. John's, NL</option>
                                            <option value="America/Whitehorse">Whitehorse, YT</option>
                                            <option value="America/Yellowknife">Yellowknife, NT</option>
                                            <option value="America/New_York">New York (ET)</option>
                                            <option value="America/Chicago">Chicago (CT)</option>
                                            <option value="America/Denver">Denver (MT)</option>
                                            <option value="America/Los_Angeles">Los Angeles (PT)</option>
                                            <option value="America/Phoenix">Phoenix (MST)</option>
                                            <option value="America/Anchorage">Anchorage (AKT)</option>
                                            <option value="Pacific/Honolulu">Honolulu (HST)</option>
                                        </optgroup>
                                    </select>
                                    {settings.timezone && (
                                        <p className="text-xs text-tertiary">
                                            Current time: {getCurrentTime(settings.timezone)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <h3 className="text-sm font-semibold text-foreground">Primary Contact</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="contact_name" className="block text-sm font-semibold text-foreground mb-2">
                                    Contact Name
                                </label>
                                <input
                                    id="contact_name"
                                    name="contact_name"
                                    type="text"
                                    value={settings.primary_contact_name}
                                    onChange={(e) => updateField("primary_contact_name", e.target.value)}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="contact_email" className="block text-sm font-semibold text-foreground mb-2">
                                    Contact Email
                                </label>
                                <input
                                    id="contact_email"
                                    name="contact_email"
                                    type="email"
                                    value={settings.primary_contact_email}
                                    onChange={(e) => updateField("primary_contact_email", e.target.value)}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="hello@staybooked.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="contact_phone" className="block text-sm font-semibold text-foreground mb-2">
                                    Contact Phone
                                </label>
                                <input
                                    id="contact_phone"
                                    name="contact_phone"
                                    type="tel"
                                    value={settings.primary_contact_phone}
                                    onChange={(e) => updateField("primary_contact_phone", e.target.value)}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={saveSettings}
                                disabled={isSaving || isLoading}
                                className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white font-medium transition-colors hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            {saveSuccess && (
                                <span className="ml-3 text-sm text-green-600 font-medium">Saved successfully</span>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {activeTab === "public" && (
                <div className="max-w-3xl mx-auto">
                    <form className="space-y-6">
                        <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Public Booking Page</h2>
                                <p className="text-sm text-tertiary mt-1">Information displayed on the public booking page</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label htmlFor="public_slug" className="block text-sm font-semibold text-foreground mb-2">
                                        Public booking page URL
                                    </label>
                                    <div className="flex items-center w-full rounded-lg border border-primary/20 bg-white shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                        <span className="px-4 text-sm text-tertiary whitespace-nowrap">https://staybooked.ca/booking/</span>
                                        <input
                                            id="public_slug"
                                            name="public_slug"
                                            type="text"
                                            value={settings.slug}
                                            onChange={(e) => updateField("slug", normalizeSlug(e.target.value))}
                                            className="w-full px-2 py-2 text-sm rounded-r-lg focus:outline-none"
                                            placeholder="your-business"
                                        />
                                    </div>
                                    {settings.slug ? (
                                        <div className="mt-2">
                                            <a
                                                href={`https://staybooked.ca/booking/${settings.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                                            >
                                                Open public booking page
                                            </a>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between rounded-lg border border-primary/10 p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Public booking page</p>
                                            <p className="text-sm text-tertiary">{settings.public_booking_enabled ? "Enabled" : "Disabled"}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateField("public_booking_enabled", !settings.public_booking_enabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.public_booking_enabled ? "bg-primary" : "bg-tertiary/30"}`}
                                            aria-label="Toggle public booking page"
                                            aria-pressed={settings.public_booking_enabled}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.public_booking_enabled ? "translate-x-5" : "translate-x-1"}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow-sm rounded-xl p-6">
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Logo
                            </label>
                            <div className="space-y-4">
                                <div
                                    onClick={() => logoFileInputRef.current?.click()}
                                    className="relative w-full h-40 rounded-lg bg-gray-50 border border-primary/10 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-primary transition-all"
                                >
                                    {logoPreviewUrl || settings.logo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={logoPreviewUrl || settings.logo_url}
                                            alt="Logo preview"
                                            className="object-contain"
                                            style={{
                                                width: `${settings.logo_size}px`,
                                                height: `${settings.logo_size}px`,
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-gray-300">
                                            <svg
                                                className="w-16 h-16"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <p className="text-sm text-gray-400">Click to upload logo</p>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                <input
                                    ref={logoFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            void handleLogoUpload(file);
                                        }
                                    }}
                                    className="hidden"
                                />

                                <div className="space-y-1">
                                    <label htmlFor="logo_size" className="text-xs font-medium text-tertiary">
                                        Logo size ({settings.logo_size}px)
                                    </label>
                                    <input
                                        id="logo_size"
                                        type="range"
                                        min={60}
                                        max={400}
                                        value={settings.logo_size}
                                        onChange={(e) => updateField("logo_size", Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                {isUploadingLogo && (
                                    <p className="text-xs text-tertiary">Uploading logo...</p>
                                )}

                                {(logoPreviewUrl || settings.logo_url) && (
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                                        >
                                            Remove logo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white shadow-sm rounded-xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="public_email" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                        <Mail className="w-4 h-4 text-tertiary" />
                                        Email
                                    </label>
                                    <input
                                        id="public_email"
                                        name="public_email"
                                        type="email"
                                        value={settings.public_email}
                                        onChange={(e) => updateField("public_email", e.target.value)}
                                        className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="bookings@staybooked.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="public_phone" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                        <Phone className="w-4 h-4 text-tertiary" />
                                        Phone
                                    </label>
                                    <input
                                        id="public_phone"
                                        name="public_phone"
                                        type="tel"
                                        value={settings.public_phone}
                                        onChange={(e) => updateField("public_phone", e.target.value)}
                                        className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="+1 (555) 555-0000"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="public_website" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                        <Globe className="w-4 h-4 text-tertiary" />
                                        Website
                                    </label>
                                    <input
                                        id="public_website"
                                        name="public_website"
                                        type="url"
                                        value={settings.public_website}
                                        onChange={(e) => updateField("public_website", e.target.value)}
                                        className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="https://www.staybooked.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="public_instagram" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                        <Instagram className="w-4 h-4 text-tertiary" />
                                        Instagram Handle
                                    </label>
                                    <input
                                        id="public_instagram"
                                        name="public_instagram"
                                        type="text"
                                        value={settings.public_instagram}
                                        onChange={(e) => updateField("public_instagram", e.target.value)}
                                        className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="@staybooked"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="public_address" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                        <MapPin className="w-4 h-4 text-tertiary" />
                                        Physical Address
                                    </label>
                                    <input
                                        id="public_address"
                                        name="public_address"
                                        type="text"
                                        value={settings.public_address}
                                        onChange={(e) => updateField("public_address", e.target.value)}
                                        className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="123 King Street, Toronto, ON"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="public_message" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                                        <MessageSquare className="w-4 h-4 text-tertiary" />
                                        Public Message
                                    </label>
                                    <textarea
                                        id="public_message"
                                        name="public_message"
                                        rows={4}
                                        value={settings.public_message}
                                        onChange={(e) => updateField("public_message", e.target.value)}
                                        className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Holiday hours, new services, special offers, or updates you want clients to see."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <h3 className="text-sm font-semibold text-foreground mb-4">
                                Accept booking amounts or deposits from clients
                            </h3>

                            <div className="space-y-4">
                                <div className="rounded-lg border border-primary/10 p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <span className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                Stripe
                                            </span>
                                            Card payments
                                            <span className="text-xs font-medium text-tertiary">{stripeStatusLabel}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleStripeConnect}
                                            disabled={isConnectingStripe}
                                            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium transition-colors hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isConnectingStripe ? "Connecting..." : "Connect Stripe"}
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-primary/10 p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <span className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                Interac
                                            </span>
                                            Email Transfer
                                        </div>
                                        <div className="w-full md:max-w-xs">
                                            <input
                                                id="interac_email"
                                                name="interac_email"
                                                type="email"
                                                value={settings.interac_email}
                                                onChange={(e) => updateField("interac_email", e.target.value)}
                                                className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                placeholder="payments@staybooked.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={saveSettings}
                                disabled={isSaving || isLoading}
                                className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white font-medium transition-colors hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            {saveSuccess && (
                                <span className="ml-3 text-sm text-green-600 font-medium">Saved successfully</span>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {activeTab === "billing" && (
                <div className="bg-white shadow-sm rounded-xl p-6 space-y-6 max-w-3xl mx-auto">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Billing & Invoicing</h2>
                    </div>

                    <div className="bg-primary/5 rounded-xl p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Current Plan</p>
                                <p className="text-xl font-semibold text-foreground mt-1">Monthly Platform Plan</p>
                                <p className="text-sm text-tertiary">$0.29 per booking • billed monthly</p>
                            </div>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium transition-colors hover:bg-primary-dark"
                            >
                                Manage Plan
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Stripe Billing
                            </label>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium transition-colors hover:bg-primary-dark"
                            >
                                Setup Stripe Billing
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
                            <button
                                type="button"
                                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                            >
                                View All
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-tertiary">
                                        <th className="py-2">Invoice</th>
                                        <th className="py-2">Period</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: "INV-2026-03", period: "Feb 2026", amount: "$128.34", status: "Paid" },
                                        { id: "INV-2026-02", period: "Jan 2026", amount: "$94.55", status: "Paid" },
                                        { id: "INV-2026-01", period: "Dec 2025", amount: "$76.91", status: "Paid" },
                                    ].map((invoice) => (
                                        <tr key={invoice.id} className="border-t border-primary/10">
                                            <td className="py-3 font-medium text-foreground">{invoice.id}</td>
                                            <td className="py-3 text-tertiary">{invoice.period}</td>
                                            <td className="py-3 text-foreground">{invoice.amount}</td>
                                            <td className="py-3">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    {invoice.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

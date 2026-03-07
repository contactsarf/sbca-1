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
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header section with responsive layout */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-primary uppercase tracking-tight">Settings</h1>
                    <p className="text-sm text-tertiary font-medium">Manage your business profile and booking preferences.</p>
                </div>

                {/* Tab Navigation - Scrollable on mobile */}
                <div className="flex items-center p-1.5 bg-primary/5 rounded-2xl border border-primary/10 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1 min-w-max">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive
                                        ? "bg-white text-primary shadow-sm scale-100"
                                        : "text-tertiary hover:text-primary hover:bg-white/50 scale-95"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "general" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Business Details */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white rounded-[32px] border border-primary/10 p-8 shadow-sm space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black text-primary uppercase tracking-widest">Business details</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Business Name</label>
                                        <input
                                            type="text"
                                            value={settings.name}
                                            onChange={(e) => updateField("name", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="Your Business Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Tax Province</label>
                                        <select
                                            value={settings.tax_province}
                                            onChange={(e) => updateField("tax_province", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none appearance-none"
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
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Timezone</label>
                                        <select
                                            value={settings.timezone}
                                            onChange={(e) => updateField("timezone", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none appearance-none"
                                        >
                                            <optgroup label="Canada">
                                                <option value="America/Toronto">Eastern Time</option>
                                                <option value="America/Winnipeg">Central Time</option>
                                                <option value="America/Edmonton">Mountain Time</option>
                                                <option value="America/Vancouver">Pacific Time</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] border border-primary/10 p-8 shadow-sm space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black text-primary uppercase tracking-widest">Primary Contact</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Contact Name</label>
                                        <input
                                            type="text"
                                            value={settings.primary_contact_name}
                                            onChange={(e) => updateField("primary_contact_name", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="Admin Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={settings.primary_contact_phone}
                                            onChange={(e) => updateField("primary_contact_phone", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={settings.primary_contact_email}
                                            onChange={(e) => updateField("primary_contact_email", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="admin@email.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Logo & Branding */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white rounded-[32px] border border-primary/10 p-8 shadow-sm space-y-8 h-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black text-primary uppercase tracking-widest">Logo & Branding</h2>
                                </div>

                                <div className="space-y-6">
                                    <div
                                        onClick={() => logoFileInputRef.current?.click()}
                                        className="relative aspect-square rounded-[32px] bg-primary/5 border-2 border-dashed border-primary/10 flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-primary transition-all"
                                    >
                                        {logoPreviewUrl || settings.logo_url ? (
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
                                            <div className="text-center p-6 space-y-2">
                                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm mx-auto">
                                                    <Camera className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Click to upload</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-[10px] font-black uppercase tracking-widest">Replace Logo</span>
                                        </div>
                                    </div>

                                    <input
                                        ref={logoFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) void handleLogoUpload(file);
                                        }}
                                        className="hidden"
                                    />

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Logo size</label>
                                            <span className="text-[10px] font-black text-primary">{settings.logo_size}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={60}
                                            max={400}
                                            value={settings.logo_size}
                                            onChange={(e) => updateField("logo_size", Number(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                    </div>

                                    {(logoPreviewUrl || settings.logo_url) && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="w-full py-4 text-[10px] font-black text-danger uppercase tracking-widest hover:bg-danger/5 rounded-2xl transition-all"
                                        >
                                            Remove Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Save Bar for General Tab */}
                        <div className="md:col-span-2 lg:col-span-12 fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
                            <div className="bg-primary backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10">
                                <div className="px-4">
                                    {saveSuccess ? (
                                        <p className="text-white text-xs font-black uppercase tracking-widest">Changes Saved!</p>
                                    ) : (
                                        <p className="text-white/60 text-xs font-black uppercase tracking-widest truncate">Unsaved Changes</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={saveSettings}
                                    disabled={isSaving || isLoading}
                                    className="h-12 px-8 rounded-xl bg-secondary text-primary font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save All"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "public" && (
                    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[32px] border border-primary/10 p-8 shadow-sm space-y-8">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-primary uppercase tracking-widest">Public Profile</h2>
                                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mt-0.5">Control your online presence</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateField("public_booking_enabled", !settings.public_booking_enabled)}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${settings.public_booking_enabled ? "bg-secondary" : "bg-primary/10"}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${settings.public_booking_enabled ? "translate-x-7" : "translate-x-1"}`} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Page URL</label>
                                <div className="flex items-center gap-0 w-full h-14 bg-primary/5 hover:bg-primary/[0.08] transition-all rounded-2xl overflow-hidden border border-transparent focus-within:border-primary/20 focus-within:bg-white group">
                                    <span className="px-5 text-xs font-bold text-tertiary border-r border-primary/10 whitespace-nowrap">staybooked.ca/book/</span>
                                    <input
                                        type="text"
                                        value={settings.slug}
                                        onChange={(e) => updateField("slug", normalizeSlug(e.target.value))}
                                        className="flex-1 h-full px-4 bg-transparent text-sm font-bold text-primary outline-none"
                                        placeholder="your-business-name"
                                    />
                                    {settings.slug && (
                                        <a
                                            href={`/book/${settings.slug}`}
                                            target="_blank"
                                            className="h-full px-6 flex items-center bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all"
                                        >
                                            View Page
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[32px] border border-primary/10 p-8 shadow-sm space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black text-primary uppercase tracking-widest">Connect</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Public Email</label>
                                        <input
                                            type="email"
                                            value={settings.public_email}
                                            onChange={(e) => updateField("public_email", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="info@business.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={settings.public_phone}
                                            onChange={(e) => updateField("public_phone", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] border border-primary/10 p-8 shadow-sm space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black text-primary uppercase tracking-widest">Location</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Physical Address</label>
                                        <input
                                            type="text"
                                            value={settings.public_address}
                                            onChange={(e) => updateField("public_address", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="123 Main St, Toronto, ON"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Website URL</label>
                                        <input
                                            type="url"
                                            value={settings.public_website}
                                            onChange={(e) => updateField("public_website", e.target.value)}
                                            className="w-full h-14 px-5 bg-primary/5 border-transparent rounded-2xl text-sm font-bold text-primary focus:bg-white focus:border-primary/20 transition-all outline-none"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-primary/10 p-8 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-black text-primary uppercase tracking-widest">Payment Methods</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Stripe Connection */}
                                <div className="p-8 rounded-3xl border border-primary/5 bg-primary/5 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Stripe Connect</p>
                                            <p className="text-xs font-bold text-tertiary uppercase tracking-widest">{stripeStatusLabel}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleStripeConnect}
                                        disabled={isConnectingStripe}
                                        className="w-full h-14 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg active:shadow-sm"
                                    >
                                        {isConnectingStripe ? "Connecting..." : settings.stripe_connect_account_id ? "Manage Account" : "Connect Stripe"}
                                    </button>
                                </div>

                                {/* Interac e-Transfer */}
                                <div className="p-8 rounded-3xl border border-primary/5 bg-primary/5 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Interac Transfer</p>
                                            <p className="text-xs font-bold text-tertiary uppercase tracking-widest">For Client Deposits</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <input
                                        type="email"
                                        value={settings.interac_email}
                                        onChange={(e) => updateField("interac_email", e.target.value)}
                                        className="w-full h-14 px-5 bg-white border border-primary/10 rounded-2xl text-sm font-bold text-primary outline-none focus:border-primary/30 transition-all shadow-sm"
                                        placeholder="payments@business.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sticky Save Bar for Public Tab */}
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
                            <div className="bg-primary backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10">
                                <div className="px-4">
                                    {saveSuccess ? (
                                        <p className="text-white text-xs font-black uppercase tracking-widest">Saved!</p>
                                    ) : (
                                        <p className="text-white/60 text-xs font-black uppercase tracking-widest">Public Profile</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={saveSettings}
                                    disabled={isSaving || isLoading}
                                    className="h-12 px-8 rounded-xl bg-secondary text-primary font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                >
                                    {isSaving ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "billing" && (
                    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[32px] border border-primary/10 p-10 shadow-sm space-y-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-[20px] bg-primary/5 flex items-center justify-center text-primary">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-primary uppercase tracking-widest">Current Plan</h2>
                                        <p className="text-xl font-black text-primary mt-0.5">StayBooked Pro</p>
                                    </div>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Billed Monthly</p>
                                    <p className="text-2xl font-black text-secondary">$0.29 / booking</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-primary/5">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-40">Payment Status</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                        Account Active
                                    </div>
                                </div>
                                <div className="flex md:justify-end items-end">
                                    <button className="h-12 px-8 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                        Manage Billing
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-primary/10 p-10 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-black text-primary uppercase tracking-widest">Recent Invoices</h2>
                            </div>

                            <div className="rounded-2xl border border-primary/5 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-primary/5">
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Invoice</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Period</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-primary uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                        {[
                                            { id: "INV-001", period: "Mar 2024", amount: "$42.10", status: "Paid" },
                                            { id: "INV-002", period: "Feb 2024", amount: "$38.45", status: "Paid" },
                                            { id: "INV-003", period: "Jan 2024", amount: "$29.90", status: "Paid" },
                                        ].map((invoice) => (
                                            <tr key={invoice.id} className="hover:bg-primary/[0.02] transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-primary">{invoice.id}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-tertiary">{invoice.period}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-primary">{invoice.amount}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{invoice.status}</span>
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
        </div>
    );
}

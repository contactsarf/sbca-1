"use client";

import { useState, useMemo, useEffect } from "react";
import {
    User, Plus, Trash2, Search, Calendar, Clock,
    ChevronRight, ChevronLeft, CreditCard, CheckCircle2,
    Info, MapPin, Phone, Mail, Globe, Instagram,
    X, Printer, CalendarPlus, LogOut
} from "lucide-react";
import { calculateTax } from "@/lib/tax-engine";
import { Tenant, Service } from "@/types";
import { submitBooking } from "./actions";

interface GeminiStaffMember {
    id: string;
    name: string;
    avatar_url?: string | null;
    bio?: string | null;
}

interface GeminiTimeSlot {
    startTime: string;
    endTime: string;
    teamMemberId: string;
    teamMemberName: string;
    teamMemberAvatar?: string | null;
}

interface GuestBooking {
    id: string;
    name: string;
    serviceIds: string[];
    preferredStaffId: string; // empty means "Any Available"
    selectedDate: string;
    selectedSlot: GeminiTimeSlot | null;
    isLoadingSlots: boolean;
    slots: GeminiTimeSlot[];
    error: string | null;
}

interface BookingWizardProps {
    tenant: Tenant;
    services: Service[];
    teamMembers: GeminiStaffMember[];
}

type Step = "GUESTS" | "SERVICES" | "STAFF" | "TIME" | "SUMMARY" | "PAYMENT" | "CONFIRMATION";

export default function BookingWizard({ tenant, services, teamMembers }: BookingWizardProps) {
    const today = new Date().toISOString().split('T')[0];

    // --- State ---
    const [step, setStep] = useState<Step>("GUESTS");
    const [guests, setGuests] = useState<GuestBooking[]>([{
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        serviceIds: [],
        preferredStaffId: "",
        selectedDate: today,
        selectedSlot: null,
        isLoadingSlots: false,
        slots: [],
        error: null
    }]);
    const [activeGuestIndex, setActiveGuestIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    // --- Derived State ---
    const activeGuest = guests[activeGuestIndex];

    const filteredServices = useMemo(() => {
        return services.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [services, searchQuery]);

    const activeGuestServices = useMemo(() => {
        return services.filter(s => activeGuest.serviceIds.includes(s.id));
    }, [services, activeGuest.serviceIds]);

    const totals = useMemo(() => {
        let subtotal = 0;
        let depositTotal = 0;

        guests.forEach(guest => {
            const guestServices = services.filter(s => guest.serviceIds.includes(s.id));
            guestServices.forEach(s => {
                subtotal += Number(s.price);
                if (s.deposit_percentage) {
                    depositTotal += (Number(s.price) * s.deposit_percentage) / 100;
                }
            });
        });

        const taxBreakdown = calculateTax(subtotal, tenant.tax_province || "ON");

        return {
            subtotal,
            tax: taxBreakdown.totalTax,
            total: subtotal + taxBreakdown.totalTax,
            depositTotal,
            taxBreakdown
        };
    }, [guests, services, tenant.tax_province]);

    const stripeConnected = !!(tenant.stripe_connect_account_id && tenant.stripe_connect_status === "active");

    // --- Helpers ---
    const addGuest = () => {
        if (guests.length >= 4) return;
        setGuests([...guests, {
            id: Math.random().toString(36).substr(2, 9),
            name: "",
            serviceIds: [],
            preferredStaffId: "",
            selectedDate: today,
            selectedSlot: null,
            isLoadingSlots: false,
            slots: [],
            error: null
        }]);
        setActiveGuestIndex(guests.length);
    };

    const removeGuest = (id: string) => {
        if (guests.length <= 1) return;
        const newGuests = guests.filter(g => g.id !== id);
        setGuests(newGuests);
        setActiveGuestIndex(Math.max(0, activeGuestIndex - 1));
    };

    const toggleService = (serviceId: string) => {
        const newGuests = [...guests];
        const currentGuest = newGuests[activeGuestIndex];
        if (currentGuest.serviceIds.includes(serviceId)) {
            currentGuest.serviceIds = currentGuest.serviceIds.filter(id => id !== serviceId);
        } else {
            currentGuest.serviceIds = [...currentGuest.serviceIds, serviceId];
        }
        currentGuest.selectedSlot = null; // Reset slot if services change
        setGuests(newGuests);
    };

    const fetchAvailability = async (guestIdx: number) => {
        const guest = guests[guestIdx];
        if (guest.serviceIds.length === 0 || !guest.selectedDate) return;

        const updatedGuests = [...guests];
        updatedGuests[guestIdx].isLoadingSlots = true;
        updatedGuests[guestIdx].error = null;
        setGuests(updatedGuests);

        try {
            const res = await fetch("/api/booking/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId: tenant.id,
                    serviceIds: guest.serviceIds,
                    date: guest.selectedDate,
                    preferredStaffId: guest.preferredStaffId || undefined
                })
            });
            const data = await res.json();

            const finalGuests = [...guests];
            if (data.success) {
                finalGuests[guestIdx].slots = data.slots;
            } else {
                finalGuests[guestIdx].slots = [];
                finalGuests[guestIdx].error = data.error;
            }
            finalGuests[guestIdx].isLoadingSlots = false;
            setGuests(finalGuests);
        } catch (err) {
            const finalGuests = [...guests];
            finalGuests[guestIdx].isLoadingSlots = false;
            finalGuests[guestIdx].error = "Failed to load slots";
            setGuests(finalGuests);
        }
    };

    useEffect(() => {
        if (step === "TIME") {
            fetchAvailability(activeGuestIndex);
        }
    }, [step, activeGuestIndex, activeGuest.selectedDate, activeGuest.preferredStaffId]);

    // --- Navigation ---
    const canGoNext = () => {
        switch (step) {
            case "GUESTS": return guests.every(g => g.name.trim().length > 0);
            case "SERVICES": return guests.every(g => g.serviceIds.length > 0);
            case "STAFF": return true; // Optional preference
            case "TIME": return guests.every(g => g.selectedSlot !== null);
            case "SUMMARY": return contactEmail.length > 0 || contactPhone.length > 0;
            default: return true;
        }
    };

    const handleNext = async () => {
        if (!canGoNext()) return;

        if (step === "GUESTS") setStep("SERVICES");
        else if (step === "SERVICES") setStep("STAFF");
        else if (step === "STAFF") setStep("TIME");
        else if (step === "TIME") setStep("SUMMARY");
        else if (step === "SUMMARY") {
            if (totals.depositTotal > 0) {
                if (!stripeConnected) {
                    setSubmissionError(`Online payments are not enabled for ${tenant.name}. Please contact them directly.`);
                    return;
                }
                setStep("PAYMENT");
            } else {
                await executeSubmission();
            }
        }
        else if (step === "PAYMENT") {
            await executeSubmission();
        }
    };

    const executeSubmission = async () => {
        setIsSubmitting(true);
        setSubmissionError(null);

        const guestSubmissions = guests.map(g => ({
            name: g.name,
            serviceIds: g.serviceIds,
            date: g.selectedDate,
            startTime: g.selectedSlot!.startTime,
            endTime: g.selectedSlot!.endTime,
            teamMemberId: g.selectedSlot!.teamMemberId
        }));

        try {
            const result = await submitBooking({
                tenantId: tenant.id,
                email: contactEmail,
                phone: contactPhone,
                guests: guestSubmissions,
                totalAmount: totals.total,
                depositAmount: totals.depositTotal
            });

            if (result.success) {
                setStep("CONFIRMATION");
            } else {
                setSubmissionError(result.error || "Submission failed. Please try again.");
            }
        } catch (err) {
            setSubmissionError("A network error occurred. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (step === "SERVICES") setStep("GUESTS");
        else if (step === "STAFF") setStep("SERVICES");
        else if (step === "TIME") setStep("STAFF");
        else if (step === "SUMMARY") setStep("TIME");
        else if (step === "PAYMENT") setStep("SUMMARY");
    };

    // --- UI Components ---
    const ProgressBar = () => {
        const steps: { key: Step; label: string }[] = [
            { key: "GUESTS", label: "Guests" },
            { key: "SERVICES", label: "Services" },
            { key: "STAFF", label: "Staff" },
            { key: "TIME", label: "Time" },
            { key: "SUMMARY", label: "Details" }
        ];
        if (totals.depositTotal > 0) steps.push({ key: "PAYMENT", label: "Secure" });
        steps.push({ key: "CONFIRMATION", label: "Done" });

        const currentIdx = steps.findIndex(s => s.key === step);

        return (
            <div className="flex items-center justify-between px-4 py-6 bg-white border-b border-primary/5 sticky top-0 z-20 backdrop-blur-xl bg-white/80">
                <div className="flex items-center gap-4 w-full max-w-2xl mx-auto">
                    {steps.map((s, idx) => (
                        <div key={s.key} className="flex-1 group relative">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${idx <= currentIdx ? "bg-primary" : "bg-primary/10"
                                }`} />
                            <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider transition-colors ${idx <= currentIdx ? "text-primary" : "text-tertiary/40"
                                }`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const GuestTab = () => (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {guests.map((g, idx) => (
                <button
                    key={g.id}
                    onClick={() => setActiveGuestIndex(idx)}
                    className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeGuestIndex === idx
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "bg-white text-primary border border-primary/10 hover:border-primary/30"
                        }`}
                >
                    {g.name || `Guest ${idx + 1}`}
                </button>
            ))}
            {guests.length < 4 && (
                <button
                    onClick={addGuest}
                    className="flex-none px-4 py-2 rounded-full text-sm font-medium bg-secondary text-primary hover:brightness-95 transition-all"
                >
                    <Plus className="w-4 h-4 inline mr-1" /> Add Guest
                </button>
            )}
        </div>
    );

    if (!tenant.public_booking_enabled && step !== "CONFIRMATION") {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white rounded-3xl p-10 shadow-2xl border border-primary/5">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Info className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-4">Booking Temporarily Unavailable</h1>
                    <p className="text-tertiary mb-10">{tenant.public_message || "We're not accepting online bookings at the moment. Please reach out to us directly."}</p>

                    <div className="grid gap-4 text-left">
                        {tenant.public_address && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5">
                                <MapPin className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Address</p>
                                    <p className="text-foreground">{tenant.public_address}</p>
                                </div>
                            </div>
                        )}
                        {tenant.public_phone && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5">
                                <Phone className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Phone</p>
                                    <p className="text-foreground">{tenant.public_phone}</p>
                                </div>
                            </div>
                        )}
                        {tenant.public_email && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5">
                                <Mail className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Email</p>
                                    <p className="text-foreground">{tenant.public_email}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-4 mt-10">
                        {tenant.public_website && (
                            <a href={tenant.public_website} target="_blank" className="p-3 rounded-xl bg-white shadow-sm border border-primary/10 hover:border-primary transition-all">
                                <Globe className="w-5 h-5 text-primary" />
                            </a>
                        )}
                        {tenant.public_instagram && (
                            <a href={`https://instagram.com/${tenant.public_instagram}`} target="_blank" className="p-3 rounded-xl bg-white shadow-sm border border-primary/10 hover:border-primary transition-all">
                                <Instagram className="w-5 h-5 text-primary" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto min-h-screen flex flex-col">
            <ProgressBar />

            <main className="flex-1 px-4 py-8 md:px-8">
                <div className="animate-in fade-in duration-500">
                    {/* --- STEP 1: GUESTS --- */}
                    {step === "GUESTS" && (
                        <div className="space-y-8 max-w-xl mx-auto">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold">Who is coming?</h2>
                                <p className="text-tertiary">Tell us who we'll be pampering today.</p>
                            </div>

                            <div className="grid gap-4">
                                {guests.map((g, idx) => (
                                    <div key={g.id} className="group relative bg-white p-6 rounded-3xl border border-primary/5 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                                                <User className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Guest Name"
                                                    value={g.name}
                                                    onChange={e => {
                                                        const newGuests = [...guests];
                                                        newGuests[idx].name = e.target.value;
                                                        setGuests(newGuests);
                                                    }}
                                                    className="w-full text-xl font-semibold bg-transparent border-none focus:ring-0 placeholder:text-primary/20"
                                                    autoFocus={idx === guests.length - 1}
                                                />
                                            </div>
                                            {guests.length > 1 && (
                                                <button
                                                    onClick={() => removeGuest(g.id)}
                                                    className="p-2 rounded-xl text-danger hover:bg-danger/10 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {guests.length < 4 && (
                                    <button
                                        onClick={addGuest}
                                        className="w-full py-6 rounded-3xl border-2 border-dashed border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                                        Add Another Guest
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- STEP 2: SERVICES --- */}
                    {step === "SERVICES" && (
                        <div className="space-y-8">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-bold">Select Services</h2>
                                <p className="text-tertiary">Choose the treatments for each guest.</p>
                            </div>

                            <div className="sticky top-[88px] z-10 space-y-4 bg-background pb-4 pt-2">
                                <GuestTab />
                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-5 h-5 group-focus-within:scale-110 transition-transform" />
                                    <input
                                        type="text"
                                        placeholder="Search services..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-primary/10 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all text-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredServices.map(s => {
                                    const isSelected = activeGuest.serviceIds.includes(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleService(s.id)}
                                            className={`group relative text-left p-6 rounded-3xl border transition-all duration-500 overflow-hidden ${isSelected
                                                ? "border-primary bg-primary text-white scale-[1.02] shadow-xl shadow-primary/20"
                                                : "bg-white border-primary/5 hover:border-primary/20 shadow-sm hover:shadow-md"
                                                }`}
                                        >
                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold tracking-tight">{s.name}</h3>
                                                    <div className={`text-lg font-bold ${isSelected ? "text-white" : "text-primary"}`}>
                                                        ${Number(s.price).toFixed(0)}
                                                    </div>
                                                </div>
                                                <p className={`text-sm mb-6 flex-1 line-clamp-2 ${isSelected ? "text-white/80" : "text-tertiary"}`}>
                                                    {s.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest mt-auto">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" /> {s.duration_minutes}m
                                                    </span>
                                                    {s.deposit_percentage && (
                                                        <span className={`px-2 py-1 rounded-lg ${isSelected ? "bg-white/20" : "bg-primary/5 text-primary"}`}>
                                                            {s.deposit_percentage}% Deposit
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                                                    <CheckCircle2 className="w-8 h-8 text-white/40" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- STEP 3: STAFF --- */}
                    {step === "STAFF" && (
                        <div className="space-y-8">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-bold">Pick a Professional</h2>
                                <p className="text-tertiary">Select your preferred staff member or choose auto-assign.</p>
                            </div>

                            <GuestTab />

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <button
                                    onClick={() => {
                                        const newGuests = [...guests];
                                        newGuests[activeGuestIndex].preferredStaffId = "";
                                        setGuests(newGuests);
                                    }}
                                    className={`p-6 rounded-3xl border transition-all duration-300 text-center flex flex-col items-center gap-4 ${activeGuest.preferredStaffId === ""
                                        ? "border-primary bg-primary/5 ring-2 ring-primary shadow-xl shadow-primary/10"
                                        : "bg-white border-primary/5 hover:border-primary/20 shadow-sm"
                                        }`}
                                >
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Plus className="w-10 h-10 text-primary rotate-45" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-foreground">No Preference</h3>
                                        <p className="text-xs text-tertiary">Assign best available</p>
                                    </div>
                                </button>

                                {teamMembers.map(m => {
                                    const isSelected = activeGuest.preferredStaffId === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                const newGuests = [...guests];
                                                newGuests[activeGuestIndex].preferredStaffId = m.id;
                                                setGuests(newGuests);
                                            }}
                                            className={`p-6 rounded-3xl border transition-all duration-300 text-center flex flex-col items-center gap-4 ${isSelected
                                                ? "border-primary bg-primary/5 ring-2 ring-primary shadow-xl shadow-primary/10"
                                                : "bg-white border-primary/5 hover:border-primary/20 shadow-sm"
                                                }`}
                                        >
                                            <div className="relative">
                                                {m.avatar_url ? (
                                                    <img src={m.avatar_url} alt={m.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/10 " />
                                                ) : (
                                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                                                        {m.name.charAt(0)}
                                                    </div>
                                                )}
                                                {isSelected && (
                                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 animate-in zoom-in">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-lg font-bold text-foreground">{m.name}</h3>
                                                <p className="text-xs text-tertiary line-clamp-1">{m.bio || 'Specialist'}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- STEP 4: TIME --- */}
                    {step === "TIME" && (
                        <div className="space-y-8">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-bold">Secure Your Slot</h2>
                                <p className="text-tertiary">Choose a date and time that works best for you.</p>
                            </div>

                            <GuestTab />

                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8 bg-white p-6 md:p-10 rounded-[40px] border border-primary/5 shadow-2xl">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" /> Select Date
                                    </h3>
                                    <input
                                        type="date"
                                        min={today}
                                        value={activeGuest.selectedDate}
                                        onChange={e => {
                                            const newGuests = [...guests];
                                            newGuests[activeGuestIndex].selectedDate = e.target.value;
                                            newGuests[activeGuestIndex].selectedSlot = null;
                                            setGuests(newGuests);
                                        }}
                                        className="w-full p-4 rounded-2xl bg-primary/5 border-none focus:ring-2 focus:ring-primary text-lg font-bold"
                                    />

                                    <div className="p-6 rounded-2xl bg-secondary/20 border border-secondary/20 space-y-4">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                            <Info className="w-3 h-3" /> Booking Summary
                                        </p>
                                        {activeGuestServices.map(s => (
                                            <div key={s.id} className="flex justify-between items-center bg-white/50 p-3 rounded-xl">
                                                <span className="text-sm font-semibold">{s.name}</span>
                                                <span className="text-xs text-tertiary">{s.duration_minutes}m</span>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-primary/10 flex justify-between items-center font-bold">
                                            <span>Duration</span>
                                            <span>{activeGuestServices.reduce((a, b) => a + Number(b.duration_minutes), 0)}m</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-primary" /> Available Slots
                                    </h3>

                                    {activeGuest.isLoadingSlots ? (
                                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-tertiary">
                                            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                                            <p className="font-medium animate-pulse">Checking availability...</p>
                                        </div>
                                    ) : activeGuest.error ? (
                                        <div className="p-10 text-center space-y-4 bg-danger/5 rounded-3xl border border-danger/20">
                                            <p className="text-danger font-bold text-lg">{activeGuest.error}</p>
                                            <p className="text-sm text-tertiary">Try another date or professional to see more results.</p>
                                        </div>
                                    ) : activeGuest.slots.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                            {activeGuest.slots.map(slot => {
                                                const isSelected = activeGuest.selectedSlot?.startTime === slot.startTime && activeGuest.selectedSlot?.teamMemberId === slot.teamMemberId;
                                                return (
                                                    <button
                                                        key={`${slot.teamMemberId}-${slot.startTime}`}
                                                        onClick={() => {
                                                            const newGuests = [...guests];
                                                            newGuests[activeGuestIndex].selectedSlot = slot;
                                                            setGuests(newGuests);
                                                        }}
                                                        className={`p-4 rounded-2xl border transition-all duration-300 text-center group ${isSelected
                                                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.05]"
                                                            : "bg-white border-primary/5 hover:border-primary px-3 shadow-sm"
                                                            }`}
                                                    >
                                                        <div className="text-lg font-bold mb-1">{slot.startTime}</div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? "text-white/60" : "text-tertiary/60"}`}>
                                                            {slot.teamMemberName}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-20 text-center space-y-4 bg-primary/5 rounded-[40px] border border-dashed border-primary/20">
                                            <Calendar className="w-12 h-12 text-primary/20 mx-auto" />
                                            <p className="text-tertiary font-medium">Please finalize your service selection first to see available times.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- STEP 5: SUMMARY --- */}
                    {step === "SUMMARY" && (
                        <div className="space-y-8 max-w-2xl mx-auto">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-bold">Confirm Booking</h2>
                                <p className="text-tertiary">Review your details and tell us how to reach you.</p>
                            </div>

                            <div className="bg-white rounded-[40px] border border-primary/5 shadow-2xl p-8 md:p-12 space-y-10">
                                <div className="space-y-6">
                                    {guests.map((g, idx) => (
                                        <div key={g.id} className="p-6 rounded-3xl bg-background border border-primary/5 space-y-4">
                                            <div className="flex justify-between items-center text-primary">
                                                <h4 className="text-lg font-bold flex items-center gap-2">
                                                    <User className="w-5 h-5" /> {g.name}
                                                </h4>
                                                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-white rounded-full">Guest {idx + 1}</span>
                                            </div>
                                            <div className="space-y-3">
                                                {services.filter(s => g.serviceIds.includes(s.id)).map(s => (
                                                    <div key={s.id} className="flex justify-between items-center group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            <span className="font-semibold">{s.name}</span>
                                                        </div>
                                                        <span className="font-bold text-primary">${Number(s.price).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between text-xs font-bold text-tertiary pt-4 border-t border-primary/5">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" /> {g.selectedDate}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" /> {g.selectedSlot?.startTime}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-4 h-4" /> {g.selectedSlot?.teamMemberName}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-primary uppercase tracking-widest px-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="hello@example.com"
                                            value={contactEmail}
                                            onChange={e => setContactEmail(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-background border-none focus:ring-2 focus:ring-primary font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-primary uppercase tracking-widest px-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={contactPhone}
                                            onChange={e => setContactPhone(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-background border-none focus:ring-2 focus:ring-primary font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 rounded-3xl bg-primary text-white shadow-2xl shadow-primary/30 space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
                                    <div className="flex justify-between items-center font-bold text-white/80">
                                        <span>Subtotal</span>
                                        <span>${totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold text-white/80">
                                        <span>Tax ({totals.taxBreakdown.description})</span>
                                        <span>${totals.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                                        <span className="text-2xl font-bold">Total</span>
                                        <span className="text-3xl font-black">${totals.total.toFixed(2)}</span>
                                    </div>
                                    {totals.depositTotal > 0 && (
                                        <div className="mt-4 p-4 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold text-center uppercase tracking-widest backdrop-blur-sm">
                                            $ {totals.depositTotal.toFixed(2)} Secure Deposit Required
                                        </div>
                                    )}
                                </div>

                                {submissionError && (
                                    <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-center font-bold animate-in fade-in zoom-in">
                                        {submissionError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- STEP 6: PAYMENT (Mock/Stub for UI) --- */}
                    {step === "PAYMENT" && (
                        <div className="space-y-8 max-w-xl mx-auto">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-bold">Secure Deposit</h2>
                                <p className="text-tertiary">Pay ${totals.depositTotal.toFixed(2)} now to confirm your appointment.</p>
                            </div>

                            {!stripeConnected ? (
                                <div className="p-12 rounded-[48px] bg-white border border-primary/10 shadow-2xl shadow-primary/5 text-center space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full translate-y-12 -translate-x-12 blur-xl" />

                                    <div className="w-24 h-24 bg-primary/5 rounded-[32px] flex items-center justify-center mx-auto text-primary relative">
                                        <div className="absolute inset-0 bg-primary/10 rounded-[32px] animate-pulse" />
                                        <Info className="w-10 h-10 relative z-10" />
                                    </div>

                                    <div className="space-y-3 relative z-10">
                                        <h3 className="text-2xl font-black text-primary tracking-tight">Payment Setup in Progress</h3>
                                        <p className="text-tertiary font-medium leading-relaxed max-w-sm mx-auto">
                                            We're currently upgrading our secure payment system. To finalize your appointment and confirm your deposit, please reach out to us directly.
                                        </p>
                                    </div>

                                    <div className="pt-4 relative z-10">
                                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/5 text-primary text-xs font-black uppercase tracking-widest border border-primary/10 shadow-sm">
                                            <Phone className="w-4 h-4" />
                                            Contact {tenant.name}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-[40px] border border-primary/5 shadow-2xl p-10 space-y-8">
                                    <div className="flex flex-col gap-4">
                                        <button className="flex items-center gap-6 p-6 rounded-3xl border-2 border-primary bg-primary/5 text-left group">
                                            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center">
                                                <CreditCard className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold">Credit Card</h4>
                                                <p className="text-sm text-tertiary">Powered by Stripe Connect</p>
                                            </div>
                                            <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center">
                                                <div className="w-3 h-3 bg-primary rounded-full" />
                                            </div>
                                        </button>

                                        <button disabled className="flex items-center gap-6 p-6 rounded-3xl border border-primary/5 bg-background text-left grayscale opacity-50 cursor-not-allowed">
                                            <div className="w-14 h-14 bg-secondary text-primary rounded-2xl flex items-center justify-center font-black text-xs">
                                                Interac
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold">Interac e-Transfer</h4>
                                                <p className="text-sm text-tertiary">Pay with your banking app</p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-primary/5">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Deposit Amount</span>
                                            <span className="text-primary">${totals.depositTotal.toFixed(2)}</span>
                                        </div>
                                        <p className="text-[10px] text-tertiary text-center font-bold uppercase tracking-widest leading-relaxed">
                                            By clicking Pay & Confirm, you agree to the booking and cancellation policies of {tenant.name}.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- STEP 7: CONFIRMATION --- */}
                    {step === "CONFIRMATION" && (
                        <div className="max-w-xl mx-auto space-y-10 animate-in zoom-in duration-500">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-success/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 animate-float">
                                    <CheckCircle2 className="w-12 h-12 text-success" />
                                </div>
                                <h1 className="text-4xl font-black tracking-tight">Booking Confirmed!</h1>
                                <p className="text-tertiary text-lg font-medium">We've sent a detailed confirmation to <span className="text-primary font-bold">{contactEmail}</span></p>
                            </div>

                            {/* Thermal Format Receipt Preview */}
                            <div className="bg-white rounded-3xl shadow-2xl border border-primary/5 overflow-hidden flex flex-col items-center p-8 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

                                <div className="w-full space-y-10 text-center font-mono text-[11px] uppercase tracking-widest py-10">
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold tracking-tighter">{tenant.name}</h3>
                                        <p className="text-tertiary h-20 text-center flex items-center px-10">{tenant.public_address || "Official Booking Invoice"}</p>
                                    </div>

                                    <div className="w-full border-t border-dashed border-tertiary/20 pt-10 space-y-4">
                                        {guests.map(g => (
                                            <div key={g.id} className="space-y-4 border-b border-dashed border-tertiary/10 pb-4">
                                                <div className="flex justify-between font-black text-foreground px-2">
                                                    <span>{g.name}</span>
                                                    <span>{g.selectedDate} @ {g.selectedSlot?.startTime}</span>
                                                </div>
                                                {services.filter(s => g.serviceIds.includes(s.id)).map(s => (
                                                    <div key={s.id} className="flex justify-between px-2 text-tertiary">
                                                        <span>{s.name}</span>
                                                        <span>${Number(s.price).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="w-full space-y-4 pt-4 border-t-2 border-primary/20 bg-primary/5 p-6 rounded-2xl">
                                        <div className="flex justify-between text-tertiary">
                                            <span>Subtotal</span>
                                            <span>${totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-tertiary">
                                            <span>Tax</span>
                                            <span>${totals.tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-black text-primary pt-2 border-t border-primary/10">
                                            <span>Total (CAD)</span>
                                            <span>${totals.total.toFixed(2)}</span>
                                        </div>
                                        {totals.depositTotal > 0 && (
                                            <div className="flex justify-between text-success font-black border-t border-success/10 pt-2">
                                                <span>Deposit Paid</span>
                                                <span>-${totals.depositTotal.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 text-center text-tertiary/60 font-bold">
                                        <p>Thank you for choosing us!</p>
                                        <p className="text-[9px]">Invoice #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-4 rounded-2xl bg-white border border-primary/10 shadow-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-all">
                                    <Printer className="w-5 h-5" /> Print Receipt
                                </button>
                                <button className="p-4 rounded-2xl bg-white border border-primary/10 shadow-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-all">
                                    <CalendarPlus className="w-5 h-5" /> Add to iCal
                                </button>
                                <button
                                    onClick={() => window.location.href = `/${tenant.slug}`}
                                    className="col-span-2 p-5 rounded-3xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <LogOut className="w-6 h-6 rotate-180" /> Finish & Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* --- Footer Controls --- */}
            {step !== "CONFIRMATION" && (
                <footer className="sticky bottom-0 bg-white/10 backdrop-blur-xl border-t border-white/20 p-4 md:p-8 animate-in slide-in-from-bottom-full duration-700">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                        <button
                            onClick={handleBack}
                            disabled={step === "GUESTS"}
                            className="flex items-center gap-3 px-8 py-5 rounded-3xl font-bold bg-white text-primary border border-primary/10 shadow-lg shadow-black/5 hover:border-primary transition-all disabled:opacity-0 disabled:pointer-events-none"
                        >
                            <ChevronLeft className="w-6 h-6" /> <span className="hidden sm:inline">Back</span>
                        </button>

                        <div className="hidden md:flex flex-col items-center">
                            <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Total Estimated</span>
                            <span className="text-2xl font-black text-primary">${totals.total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!canGoNext() || isSubmitting}
                            className={`flex items-center gap-3 px-12 py-5 rounded-[32px] font-black uppercase tracking-widest transition-all duration-500 shadow-2xl ${canGoNext()
                                ? "bg-primary text-white shadow-primary/40 hover:scale-[1.05] hover:-translate-y-1 active:scale-[0.98]"
                                : "bg-primary/10 text-primary/40 cursor-not-allowed"
                                }`}
                        >
                            {isSubmitting ? "Processing..." : (
                                <>
                                    <span>
                                        {step === "SUMMARY"
                                            ? (totals.depositTotal > 0 ? "Continue to Pay" : "Book Selected")
                                            : (step === "PAYMENT" ? "Pay & Confirm" : "Next Step")
                                        }
                                    </span>
                                    <ChevronRight className={`w-6 h-6 transition-transform duration-500 ${canGoNext() ? "translate-x-1" : ""}`} />
                                </>
                            )}
                        </button>
                    </div>
                </footer>
            )}

        </div>
    );
}

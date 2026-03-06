"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { calculateTax } from "@/constants/taxes";

interface ServiceItem {
    id: string;
    name: string;
    description?: string | null;
    prep_notes?: string | null;
    duration_minutes: number;
    price: number;
    deposit_percentage?: number | null;
    is_paused: boolean;
}

interface TeamMemberItem {
    id: string;
    name: string;
    avatar_url?: string | null;
}

interface TimeSlot {
    startTime: string;
    endTime: string;
    teamMemberId: string;
    teamMemberName: string;
    teamMemberAvatar?: string | null;
}

interface BookingWizardClientProps {
    tenantId: string;
    tenantName: string;
    taxProvince: string;
    services: ServiceItem[];
    teamMembers: TeamMemberItem[];
}

interface GuestBooking {
    id: string;
    name: string;
    serviceIds: string[];
    preferredStaffId: string;
    selectedDate: string;
    calendarMonth: string;
    slots: TimeSlot[];
    selectedSlot: TimeSlot | null;
    isLoadingSlots: boolean;
    slotError: string | null;
    lastAvailabilityKey: string;
}

type StepId = "guests" | "services" | "staff" | "time" | "summary" | "payment" | "confirmation";

const MAX_GUESTS = 4;

export default function BookingWizardClient({ tenantId, tenantName, taxProvince, services, teamMembers }: BookingWizardClientProps) {
    const getTodayISO = () => new Date().toISOString().slice(0, 10);
    const getMonthKey = (dateIso: string) => `${dateIso.slice(0, 7)}-01`;
    const createGuest = (): GuestBooking => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: "",
        serviceIds: [],
        preferredStaffId: "",
        selectedDate: getTodayISO(),
        calendarMonth: getMonthKey(getTodayISO()),
        slots: [],
        selectedSlot: null,
        isLoadingSlots: false,
        slotError: null,
        lastAvailabilityKey: "",
    });

    const [guests, setGuests] = useState<GuestBooking[]>([createGuest()]);
    const [activeGuestIndex, setActiveGuestIndex] = useState<number>(0);
    const [stepId, setStepId] = useState<StepId>("guests");
    const [contactName, setContactName] = useState<string>("");
    const [contactEmail, setContactEmail] = useState<string>("");
    const [contactPhone, setContactPhone] = useState<string>("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"interac" | "card" | "">("");
    const [serviceSearch, setServiceSearch] = useState<string>("");
    const [validationErrors, setValidationErrors] = useState<{
        guests?: string;
        services?: string;
        slot?: string;
        contact?: string;
        payment?: string;
    }>({});

    const servicesById = useMemo(() => {
        return new Map(services.map((service) => [service.id, service]));
    }, [services]);

    const filteredServices = useMemo(() => {
        const term = serviceSearch.trim().toLowerCase();
        if (!term) return services;
        return services.filter((service) => {
            const name = service.name.toLowerCase();
            const description = service.description?.toLowerCase() ?? "";
            const prepNotes = service.prep_notes?.toLowerCase() ?? "";
            return name.includes(term) || description.includes(term) || prepNotes.includes(term);
        });
    }, [services, serviceSearch]);

    const selectedServicesByGuest = useMemo(() => {
        return guests.map((guest) =>
            guest.serviceIds
                .map((serviceId) => servicesById.get(serviceId))
                .filter((service): service is ServiceItem => Boolean(service))
        );
    }, [guests, servicesById]);

    const subtotal = useMemo(() => {
        return selectedServicesByGuest.reduce((sum, guestServices) => {
            return sum + guestServices.reduce((guestSum, service) => guestSum + Number(service.price || 0), 0);
        }, 0);
    }, [selectedServicesByGuest]);

    const taxSummary = useMemo(() => calculateTax(subtotal, taxProvince), [subtotal, taxProvince]);

    const totalDeposit = useMemo(() => {
        return selectedServicesByGuest.reduce((sum, guestServices) => {
            return sum + guestServices.reduce((guestSum, service) => {
                const deposit = service.deposit_percentage ? (Number(service.price) * service.deposit_percentage) / 100 : 0;
                return guestSum + deposit;
            }, 0);
        }, 0);
    }, [selectedServicesByGuest]);

    const requiresDeposit = totalDeposit > 0;
    const totalServicesCount = useMemo(
        () => guests.reduce((sum, guest) => sum + guest.serviceIds.length, 0),
        [guests]
    );

    const updateGuest = (index: number, updates: Partial<GuestBooking>) => {
        setGuests((prev) => prev.map((guest, i) => (i === index ? { ...guest, ...updates } : guest)));
    };

    const addGuest = () => {
        setGuests((prev) => {
            if (prev.length >= MAX_GUESTS) return prev;
            const next = [...prev, createGuest()];
            setActiveGuestIndex(next.length - 1);
            return next;
        });
    };

    const removeGuest = (index: number) => {
        setGuests((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleService = (guestIndex: number, serviceId: string) => {
        setGuests((prev) =>
            prev.map((guest, index) => {
                if (index !== guestIndex) return guest;
                const nextServiceIds = guest.serviceIds.includes(serviceId)
                    ? guest.serviceIds.filter((id) => id !== serviceId)
                    : [...guest.serviceIds, serviceId];
                return {
                    ...guest,
                    serviceIds: nextServiceIds,
                    slots: [],
                    selectedSlot: null,
                    slotError: null,
                    lastAvailabilityKey: "",
                };
            })
        );
    };

    const buildAvailabilityKey = (guest: GuestBooking) => {
        if (!guest.selectedDate || guest.serviceIds.length === 0) return "";
        return `${guest.selectedDate}:${guest.preferredStaffId || "any"}:${guest.serviceIds.slice().sort().join(",")}`;
    };

    const fetchSlots = async (guestIndex: number, availabilityKey: string) => {
        const guest = guests[guestIndex];
        if (!guest || !availabilityKey) return;

        updateGuest(guestIndex, {
            isLoadingSlots: true,
            slotError: null,
            slots: [],
            selectedSlot: null,
            lastAvailabilityKey: availabilityKey,
        });

        try {
            const response = await fetch("/api/booking/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    serviceIds: guest.serviceIds,
                    date: guest.selectedDate,
                    preferredStaffId: guest.preferredStaffId || undefined,
                    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
            });
            let payload: any = null;

            try {
                payload = await response.json();
            } catch {
                payload = null;
            }

            if (!response.ok) {
                updateGuest(guestIndex, {
                    isLoadingSlots: false,
                    slotError: payload?.error || "Unable to load availability. Please try again.",
                });
                return;
            }

            if (!payload?.success) {
                updateGuest(guestIndex, {
                    isLoadingSlots: false,
                    slotError: payload?.error || "No availability found.",
                });
                return;
            }

            updateGuest(guestIndex, {
                slots: payload.slots || [],
                isLoadingSlots: false,
            });
        } catch {
            updateGuest(guestIndex, {
                isLoadingSlots: false,
                slotError: "Unable to load availability. Please try again.",
            });
        }
    };

    useEffect(() => {
        guests.forEach((guest, index) => {
            const availabilityKey = buildAvailabilityKey(guest);
            if (!availabilityKey) return;
            if (guest.lastAvailabilityKey === availabilityKey) return;
            fetchSlots(index, availabilityKey);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guests]);

    useEffect(() => {
        setActiveGuestIndex((prev) => Math.min(prev, Math.max(guests.length - 1, 0)));
    }, [guests.length]);

    const todayIso = getTodayISO();
    const getMonthLabel = (monthKey: string) => {
        const date = new Date(`${monthKey}T00:00:00`);
        return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    };

    const getDaysInMonth = (monthKey: string) => {
        const [year, month] = monthKey.split("-").map(Number);
        return new Date(year, month, 0).getDate();
    };

    const getMonthStartWeekday = (monthKey: string) => {
        const [year, month] = monthKey.split("-").map(Number);
        return new Date(year, month - 1, 1).getDay();
    };

    const isPastDate = (dateIso: string) => {
        return dateIso < todayIso;
    };

    const changeMonth = (guestIndex: number, delta: number) => {
        const guest = guests[guestIndex];
        const [year, month] = guest.calendarMonth.split("-").map(Number);
        const nextDate = new Date(year, month - 1 + delta, 1);
        const nextMonthKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-01`;
        updateGuest(guestIndex, { calendarMonth: nextMonthKey });
    };

    const stepOrder: StepId[] = ["guests", "services", "staff", "time", "summary", "payment", "confirmation"];
    const visibleStepOrder = requiresDeposit
        ? stepOrder
        : stepOrder.filter((step) => step !== "payment");
    const stepIndex = visibleStepOrder.indexOf(stepId);

    const validateStep = (nextStep: StepId) => {
        const nextErrors: typeof validationErrors = {};

        if (nextStep === "guests") {
            const hasGuestName = guests.every((guest) => guest.name.trim().length > 0);
            if (!hasGuestName) {
                nextErrors.guests = "Add a name for each guest.";
            }
        }

        if (nextStep === "services") {
            const hasServices = guests.every((guest) => guest.serviceIds.length > 0);
            if (!hasServices) {
                nextErrors.services = "Select services for each guest.";
            }
        }

        if (nextStep === "time") {
            const hasSlots = guests.every((guest) => Boolean(guest.selectedSlot));
            if (!hasSlots) {
                nextErrors.slot = "Choose a time slot for each guest.";
            }
        }

        if (nextStep === "summary") {
            if (!contactName.trim() || (!contactEmail.trim() && !contactPhone.trim())) {
                nextErrors.contact = "Add a contact name and at least one way to reach you.";
            }
        }

        if (nextStep === "payment" && requiresDeposit && !selectedPaymentMethod) {
            nextErrors.payment = "Select a payment method.";
        }

        setValidationErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const goNext = () => {
        if (!validateStep(stepId)) return;
        if (stepId === "summary" && !requiresDeposit) {
            setStepId("confirmation");
            return;
        }
        if (stepId === "payment") {
            setStepId("confirmation");
            return;
        }
        const nextIndex = Math.min(stepIndex + 1, visibleStepOrder.length - 1);
        setStepId(visibleStepOrder[nextIndex]);
    };

    const goBack = () => {
        if (stepId === "confirmation") {
            setStepId(requiresDeposit ? "payment" : "summary");
            return;
        }
        if (stepId === "payment") {
            setStepId("summary");
            return;
        }
        const previousIndex = Math.max(stepIndex - 1, 0);
        setStepId(visibleStepOrder[previousIndex]);
    };

    const getStepLabel = (step: StepId) => {
        switch (step) {
            case "guests":
                return "Guests";
            case "services":
                return "Services";
            case "staff":
                return "Staff";
            case "time":
                return "Time";
            case "summary":
                return "Summary";
            case "payment":
                return "Payment";
            case "confirmation":
                return "Confirmation";
        }
    };

    const activeGuest = guests[activeGuestIndex];
    const activeGuestServices = selectedServicesByGuest[activeGuestIndex] ?? [];

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-primary/10">
                <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-tertiary uppercase tracking-wide">Step {stepIndex + 1} of {visibleStepOrder.length}</p>
                            <h2 className="text-lg font-semibold text-foreground">{getStepLabel(stepId)}</h2>
                        </div>
                        <div className="text-xs text-tertiary">
                            {guests.length} guest{guests.length > 1 ? "s" : ""}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {visibleStepOrder.map((step, index) => {
                            const isActive = step === stepId;
                            const isComplete = index < stepIndex;
                            return (
                                <div
                                    key={step}
                                    className={`rounded-full px-3 py-2 text-xs font-medium text-center transition-colors ${isActive
                                        ? "bg-primary text-white"
                                        : isComplete
                                            ? "bg-primary/10 text-primary"
                                            : "bg-white text-tertiary shadow-sm"
                                        }`}
                                >
                                    {getStepLabel(step)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
                <div className="space-y-6">
                    {stepId === "guests" && (
                        <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Guest list</h3>
                                <p className="text-sm text-tertiary">Add up to {MAX_GUESTS} guests.</p>
                            </div>

                            <div className="space-y-4">
                                {guests.map((guest, index) => (
                                    <div key={guest.id} className="rounded-xl border border-primary/10 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-foreground">Guest {index + 1}</p>
                                            {guests.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeGuest(index)}
                                                    className="text-xs font-medium text-danger transition-colors duration-200 hover:text-danger-dark"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={guest.name}
                                            onChange={(event) => updateGuest(index, { name: event.target.value })}
                                            placeholder={`Guest ${index + 1} name`}
                                            className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={addGuest}
                                    disabled={guests.length >= MAX_GUESTS}
                                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Add another guest
                                </button>
                                <p className="text-xs text-tertiary">Maximum {MAX_GUESTS} guests per booking.</p>
                            </div>

                            {validationErrors.guests ? (
                                <p className="text-sm text-danger">{validationErrors.guests}</p>
                            ) : null}
                        </div>
                    )}

                    {stepId === "services" && (
                        <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Select services</h3>
                                <p className="text-sm text-tertiary">Choose services for each guest.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={serviceSearch}
                                        onChange={(event) => setServiceSearch(event.target.value)}
                                        placeholder="Search services..."
                                        className="w-full px-4 py-2.5 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    {serviceSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setServiceSearch("")}
                                            aria-label="Clear search"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-foreground transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {guests.map((guest, index) => (
                                        <button
                                            key={guest.id}
                                            type="button"
                                            onClick={() => setActiveGuestIndex(index)}
                                            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${index === activeGuestIndex
                                                ? "bg-primary text-white"
                                                : "bg-primary/10 text-primary"
                                                }`}
                                        >
                                            {guest.name.trim() || `Guest ${index + 1}`}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredServices.map((service) => {
                                        const isSelected = activeGuest.serviceIds.includes(service.id);
                                        const depositAmount = service.deposit_percentage
                                            ? (Number(service.price) * service.deposit_percentage) / 100
                                            : 0;

                                        return (
                                            <button
                                                key={`${activeGuest.id}-${service.id}`}
                                                type="button"
                                                onClick={() => toggleService(activeGuestIndex, service.id)}
                                                className={`text-left rounded-xl border p-4 transition-all bg-gradient-to-br from-white via-white to-primary/5 ${isSelected
                                                    ? "border-primary"
                                                    : "border-primary/10 hover:border-primary/30"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="text-base font-semibold text-foreground">{service.name}</h4>
                                                        <p className="text-sm text-tertiary mt-1">
                                                            {service.description || "No description provided."}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-foreground">${Number(service.price).toFixed(2)}</p>
                                                        <p className="text-xs text-tertiary">{service.duration_minutes} min</p>
                                                    </div>
                                                </div>

                                                {service.prep_notes ? (
                                                    <div className="mt-3 rounded-lg bg-primary/5 p-3 text-xs text-foreground">
                                                        {service.prep_notes}
                                                    </div>
                                                ) : null}

                                                <div className="mt-3 text-xs text-tertiary">
                                                    {service.deposit_percentage
                                                        ? `${service.deposit_percentage}% deposit required ($${depositAmount.toFixed(2)})`
                                                        : "No deposit required"}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {filteredServices.length === 0 && (
                                    <p className="text-sm text-tertiary">No services match your search.</p>
                                )}

                                {validationErrors.services ? (
                                    <p className="text-sm text-danger">{validationErrors.services}</p>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {stepId === "staff" && (
                        <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Staff preference</h3>
                                <p className="text-sm text-tertiary">Choose a preferred provider per guest.</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {guests.map((guest, index) => (
                                    <button
                                        key={guest.id}
                                        type="button"
                                        onClick={() => setActiveGuestIndex(index)}
                                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${index === activeGuestIndex
                                            ? "bg-primary text-white"
                                            : "bg-primary/10 text-primary"
                                            }`}
                                    >
                                        {guest.name.trim() || `Guest ${index + 1}`}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateGuest(activeGuestIndex, {
                                        preferredStaffId: "",
                                        slots: [],
                                        selectedSlot: null,
                                        slotError: null,
                                        lastAvailabilityKey: "",
                                    })}
                                    className={`rounded-xl border px-3 py-3 text-left transition-all bg-gradient-to-br from-white via-white to-primary/5 ${activeGuest.preferredStaffId === ""
                                        ? "border-primary"
                                        : "border-primary/10 hover:border-primary/30"
                                        }`}
                                >
                                    <div className="text-sm font-semibold text-foreground">Any available</div>
                                </button>
                                {teamMembers.map((member) => {
                                    const isSelected = activeGuest.preferredStaffId === member.id;
                                    return (
                                        <button
                                            key={`${activeGuest.id}-${member.id}`}
                                            type="button"
                                            onClick={() => updateGuest(activeGuestIndex, {
                                                preferredStaffId: member.id,
                                                slots: [],
                                                selectedSlot: null,
                                                slotError: null,
                                                lastAvailabilityKey: "",
                                            })}
                                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all bg-gradient-to-br from-white via-white to-primary/5 ${isSelected
                                                ? "border-primary"
                                                : "border-primary/10 hover:border-primary/30"
                                                }`}
                                        >
                                            {member.avatar_url ? (
                                                <img
                                                    src={member.avatar_url}
                                                    alt={member.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${isSelected
                                                    ? "bg-primary text-white"
                                                    : "bg-primary/10 text-primary"
                                                    }`}>
                                                    {member.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {stepId === "time" && (
                        <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Pick date and time</h3>
                                <p className="text-sm text-tertiary">Choose availability for each guest.</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {guests.map((guest, index) => (
                                    <button
                                        key={guest.id}
                                        type="button"
                                        onClick={() => setActiveGuestIndex(index)}
                                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${index === activeGuestIndex
                                            ? "bg-primary text-white"
                                            : "bg-primary/10 text-primary"
                                            }`}
                                    >
                                        {guest.name.trim() || `Guest ${index + 1}`}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                                <div className="rounded-xl border border-primary/10 p-4 w-full max-w-[280px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            type="button"
                                            onClick={() => changeMonth(activeGuestIndex, -1)}
                                            className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-dark"
                                        >
                                            Prev
                                        </button>
                                        <div className="text-sm font-semibold text-foreground">
                                            {getMonthLabel(activeGuest.calendarMonth)}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => changeMonth(activeGuestIndex, 1)}
                                            className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-dark"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 text-xs text-tertiary mb-2">
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                            <div key={`${activeGuest.id}-${day}`} className="text-center">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: getMonthStartWeekday(activeGuest.calendarMonth) }).map((_, idx) => (
                                            <div key={`${activeGuest.id}-empty-${idx}`} />
                                        ))}
                                        {Array.from({ length: getDaysInMonth(activeGuest.calendarMonth) }).map((_, dayIndex) => {
                                            const day = dayIndex + 1;
                                            const dateIso = `${activeGuest.calendarMonth.slice(0, 8)}${String(day).padStart(2, "0")}`;
                                            const isSelected = activeGuest.selectedDate === dateIso;
                                            const isToday = dateIso === todayIso;
                                            const isDisabled = isPastDate(dateIso);
                                            return (
                                                <button
                                                    key={`${activeGuest.id}-day-${dateIso}`}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => updateGuest(activeGuestIndex, {
                                                        selectedDate: dateIso,
                                                        slots: [],
                                                        selectedSlot: null,
                                                        slotError: null,
                                                        lastAvailabilityKey: "",
                                                    })}
                                                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${isSelected
                                                        ? "bg-primary text-white"
                                                        : isDisabled
                                                            ? "text-tertiary/40"
                                                            : "text-foreground hover:bg-primary/10"
                                                        } ${isToday && !isSelected ? "border border-primary/40" : ""}`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {activeGuest.slotError && (
                                        <p className="text-sm text-danger">{activeGuest.slotError}</p>
                                    )}
                                    {activeGuest.isLoadingSlots && (
                                        <p className="text-sm text-tertiary">Finding availability...</p>
                                    )}

                                    {activeGuest.slots.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {activeGuest.slots.map((slot) => {
                                                const isSelected = activeGuest.selectedSlot?.startTime === slot.startTime && activeGuest.selectedSlot?.teamMemberId === slot.teamMemberId;
                                                return (
                                                    <button
                                                        key={`${activeGuest.id}-${slot.teamMemberId}-${slot.startTime}`}
                                                        type="button"
                                                        onClick={() => updateGuest(activeGuestIndex, { selectedSlot: slot })}
                                                        className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-all ${isSelected
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-primary/10 text-foreground hover:border-primary/30"
                                                            }`}
                                                    >
                                                        <div>{slot.startTime}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {!activeGuest.isLoadingSlots && activeGuest.slots.length === 0 && !activeGuest.slotError && activeGuest.serviceIds.length > 0 ? (
                                        <p className="text-sm text-tertiary">No availability yet. Try another date or staff member.</p>
                                    ) : null}
                                </div>
                            </div>

                            {validationErrors.slot ? (
                                <p className="text-sm text-danger">{validationErrors.slot}</p>
                            ) : null}
                        </div>
                    )}

                    {stepId === "summary" && (
                        <div className="space-y-6">
                            <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-foreground">Contact details</h3>
                                    <p className="text-sm text-tertiary">Share one way to reach you.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-tertiary mb-2">
                                            Contact name
                                        </label>
                                        <input
                                            type="text"
                                            value={contactName}
                                            onChange={(event) => setContactName(event.target.value)}
                                            className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-tertiary mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(event) => setContactEmail(event.target.value)}
                                            className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-tertiary mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={contactPhone}
                                            onChange={(event) => setContactPhone(event.target.value)}
                                            className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="+1 (555) 555-1234"
                                        />
                                    </div>
                                </div>
                                {validationErrors.contact ? (
                                    <p className="text-sm text-danger">{validationErrors.contact}</p>
                                ) : null}
                            </div>

                            <div className="bg-white shadow-sm rounded-xl p-6 space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-foreground">Booking summary</h3>
                                    <p className="text-sm text-tertiary">Review details before payment.</p>
                                </div>
                                {selectedServicesByGuest.map((guestServices, index) => {
                                    const guest = guests[index];
                                    return (
                                        <div key={guest.id} className="border border-primary/10 rounded-xl p-4 space-y-2">
                                            <p className="text-sm font-semibold text-foreground">
                                                {guest.name.trim() || `Guest ${index + 1}`}
                                            </p>
                                            <p className="text-xs text-tertiary">
                                                {guest.selectedSlot ? `${guest.selectedDate} at ${guest.selectedSlot.startTime}` : "No time selected"}
                                            </p>
                                            {guestServices.length > 0 ? (
                                                <div className="space-y-2">
                                                    {guestServices.map((service) => (
                                                        <div key={service.id} className="flex items-start justify-between text-sm">
                                                            <div>
                                                                <p className="text-tertiary">{service.name}</p>
                                                                {service.prep_notes ? (
                                                                    <p className="text-xs text-tertiary mt-1">{service.prep_notes}</p>
                                                                ) : null}
                                                            </div>
                                                            <span className="font-medium text-foreground">${Number(service.price).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-tertiary">No services selected.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {stepId === "payment" && (
                        <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Payment method</h3>
                                <p className="text-sm text-tertiary">Deposit due: ${totalDeposit.toFixed(2)}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod("interac")}
                                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-200 ${selectedPaymentMethod === "interac"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-primary/10 text-foreground hover:border-primary/30"
                                        }`}
                                >
                                    Interac e-Transfer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod("card")}
                                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-200 ${selectedPaymentMethod === "card"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-primary/10 text-foreground hover:border-primary/30"
                                        }`}
                                >
                                    Card payment
                                </button>
                            </div>

                            {validationErrors.payment ? (
                                <p className="text-sm text-danger">{validationErrors.payment}</p>
                            ) : null}
                        </div>
                    )}

                    {stepId === "confirmation" && (
                        <div className="bg-white shadow-sm rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">Booking confirmed</h3>
                            <p className="text-sm text-tertiary">We will confirm your appointment details shortly.</p>
                            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-foreground">
                                <p className="font-semibold">Thank you for booking with {tenantName}.</p>
                                <p className="text-tertiary mt-1">A confirmation message will be sent to your contact details.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white shadow-sm rounded-xl p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-foreground">Overview</h3>
                            <p className="text-sm text-tertiary">Quick summary as you go.</p>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-tertiary">Guests</span>
                                <span className="font-medium text-foreground">{guests.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-tertiary">Services</span>
                                <span className="font-medium text-foreground">{totalServicesCount}</span>
                            </div>
                        </div>

                        {selectedServicesByGuest.some((guestServices) => guestServices.length > 0) ? (
                            <div className="border-t border-primary/10 pt-4 space-y-3 text-sm">
                                {selectedServicesByGuest.map((guestServices, index) => (
                                    <div key={`summary-${guests[index]?.id ?? index}`} className="space-y-2">
                                        <p className="text-xs text-tertiary uppercase tracking-wide">
                                            {guests[index]?.name?.trim() ? guests[index].name : `Guest ${index + 1}`}
                                        </p>
                                        {guestServices.map((service) => (
                                            <div key={`summary-${guests[index]?.id ?? index}-${service.id}`} className="flex items-center justify-between">
                                                <span className="text-tertiary">{service.name}</span>
                                                <span className="font-medium text-foreground">${Number(service.price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-tertiary">No services selected yet.</p>
                        )}

                        <div className="border-t border-primary/10 pt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-tertiary">Subtotal</span>
                                <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-tertiary">Tax ({taxSummary.description})</span>
                                <span className="font-medium text-foreground">${taxSummary.totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base font-semibold">
                                <span>Total</span>
                                <span>${taxSummary.total.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-tertiary">
                                <span>Deposit due</span>
                                <span>${totalDeposit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-xl p-4 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={stepId === "guests"}
                            className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-primary/10 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={stepId === "confirmation"}
                            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {stepId === "payment" || (stepId === "summary" && !requiresDeposit) ? "Confirm" : stepId === "confirmation" ? "Done" : "Continue"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

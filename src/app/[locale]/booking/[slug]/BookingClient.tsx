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

interface BookingClientProps {
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

export default function BookingClient({ tenantId, tenantName, taxProvince, services, teamMembers }: BookingClientProps) {
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
    const [contactName, setContactName] = useState<string>("");
    const [contactEmail, setContactEmail] = useState<string>("");
    const [contactPhone, setContactPhone] = useState<string>("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"interac" | "card" | "">("");
    const [currentStep, setCurrentStep] = useState<"details" | "payment" | "confirmation">("details");
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

    const taxSummary = useMemo(
        () => calculateTax(subtotal, taxProvince),
        [subtotal, taxProvince]
    );

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

    const addGuest = () => setGuests((prev) => [...prev, createGuest()]);

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

    const validateBooking = (step: "details" | "payment") => {
        const nextErrors: typeof validationErrors = {};
        const hasGuestName = guests.every((guest) => guest.name.trim().length > 0);
        const hasServices = guests.every((guest) => guest.serviceIds.length > 0);
        const hasSlots = guests.every((guest) => Boolean(guest.selectedSlot));

        if (!hasGuestName) {
            nextErrors.guests = "Add a name for each guest.";
        }

        if (!hasServices) {
            nextErrors.services = "Select services for each guest.";
        }

        if (!hasSlots) {
            nextErrors.slot = "Choose a time slot for each guest.";
        }

        if (!contactName.trim() || (!contactEmail.trim() && !contactPhone.trim())) {
            nextErrors.contact = "Add a contact name and at least one way to reach you.";
        }

        if (step === "payment" && requiresDeposit && !selectedPaymentMethod) {
            nextErrors.payment = "Select a payment method.";
        }

        setValidationErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleContinue = () => {
        if (!validateBooking("details")) return;
        setCurrentStep(requiresDeposit ? "payment" : "confirmation");
    };

    const handleConfirm = () => {
        if (requiresDeposit && !validateBooking("payment")) return;
        setCurrentStep("confirmation");
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

    return (
        <div className="space-y-8">
            <div className="space-y-8">
                {guests.map((guest, guestIndex) => (
                    <div key={guest.id} className="bg-white shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Guest {guestIndex + 1}</h2>
                                <p className="text-sm text-tertiary">Choose services and time for this guest.</p>
                            </div>
                            {guests.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeGuest(guestIndex)}
                                    className="text-sm font-medium text-danger hover:text-danger-dark transition-colors"
                                >
                                    Remove guest
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-tertiary mb-2">Guest name</label>
                            <input
                                type="text"
                                value={guest.name}
                                onChange={(e) => updateGuest(guestIndex, { name: e.target.value })}
                                placeholder={`Guest ${guestIndex + 1} name`}
                                className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Select services</h3>
                                <p className="text-sm text-tertiary">Choose one or more services.</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredServices.map((service) => {
                                    const isSelected = guest.serviceIds.includes(service.id);
                                    const depositAmount = service.deposit_percentage
                                        ? (Number(service.price) * service.deposit_percentage) / 100
                                        : 0;

                                    return (
                                        <button
                                            key={`${guest.id}-${service.id}`}
                                            type="button"
                                            onClick={() => toggleService(guestIndex, service.id)}
                                            className={`text-left rounded-xl border p-4 transition-all bg-gradient-to-br from-white via-white to-primary/5 ${isSelected
                                                ? "border-primary"
                                                : "border-primary/10 hover:border-primary/30"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-semibold text-foreground">{service.name}</h3>
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
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Staff preference</h3>
                                <p className="text-sm text-tertiary">Pick a preferred staff member or keep it open.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateGuest(guestIndex, {
                                        preferredStaffId: "",
                                        slots: [],
                                        selectedSlot: null,
                                        slotError: null,
                                        lastAvailabilityKey: "",
                                    })}
                                    className={`rounded-xl border px-3 py-3 text-left transition-all bg-gradient-to-br from-white via-white to-primary/5 ${guest.preferredStaffId === ""
                                        ? "border-primary"
                                        : "border-primary/10 hover:border-primary/30"
                                        }`}
                                >
                                    <div className="text-sm font-semibold text-foreground">Any available</div>
                                </button>
                                {teamMembers.map((member) => {
                                    const isSelected = guest.preferredStaffId === member.id;
                                    return (
                                        <button
                                            key={`${guest.id}-${member.id}`}
                                            type="button"
                                            onClick={() => updateGuest(guestIndex, {
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

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Pick a date and time</h3>
                                <p className="text-sm text-tertiary">Select a date to see available slots.</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                                <div className="rounded-xl border border-primary/10 p-4 w-full max-w-[280px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            type="button"
                                            onClick={() => changeMonth(guestIndex, -1)}
                                            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                                        >
                                            Prev
                                        </button>
                                        <div className="text-sm font-semibold text-foreground">
                                            {getMonthLabel(guest.calendarMonth)}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => changeMonth(guestIndex, 1)}
                                            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 text-xs text-tertiary mb-2">
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                            <div key={`${guest.id}-${day}`} className="text-center">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: getMonthStartWeekday(guest.calendarMonth) }).map((_, idx) => (
                                            <div key={`${guest.id}-empty-${idx}`} />
                                        ))}
                                        {Array.from({ length: getDaysInMonth(guest.calendarMonth) }).map((_, dayIndex) => {
                                            const day = dayIndex + 1;
                                            const dateIso = `${guest.calendarMonth.slice(0, 8)}${String(day).padStart(2, "0")}`;
                                            const isSelected = guest.selectedDate === dateIso;
                                            const isToday = dateIso === todayIso;
                                            const isDisabled = isPastDate(dateIso);
                                            return (
                                                <button
                                                    key={`${guest.id}-day-${dateIso}`}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => updateGuest(guestIndex, {
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
                                    {guest.slotError && (
                                        <p className="text-sm text-danger">{guest.slotError}</p>
                                    )}
                                    {guest.isLoadingSlots && (
                                        <p className="text-sm text-tertiary">Finding availability...</p>
                                    )}

                                    {guest.slots.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {guest.slots.map((slot) => {
                                                const isSelected = guest.selectedSlot?.startTime === slot.startTime && guest.selectedSlot?.teamMemberId === slot.teamMemberId;
                                                return (
                                                    <button
                                                        key={`${guest.id}-${slot.teamMemberId}-${slot.startTime}`}
                                                        type="button"
                                                        onClick={() => updateGuest(guestIndex, { selectedSlot: slot })}
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
                                    {!guest.isLoadingSlots && guest.slots.length === 0 && !guest.slotError && guest.serviceIds.length > 0 ? (
                                        <p className="text-sm text-tertiary">No availability yet. Try another date or staff member.</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addGuest}
                    className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                    Add another guest
                </button>

                {validationErrors.guests ? (
                    <p className="text-sm text-danger">{validationErrors.guests}</p>
                ) : null}
                {validationErrors.services ? (
                    <p className="text-sm text-danger">{validationErrors.services}</p>
                ) : null}
                {validationErrors.slot ? (
                    <p className="text-sm text-danger">{validationErrors.slot}</p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">Contact details</h2>
                            <p className="text-sm text-tertiary">How should we reach you?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-tertiary mb-2">
                                    Contact name
                                </label>
                                <input
                                    type="text"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
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
                                    onChange={(e) => setContactEmail(e.target.value)}
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
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full px-4 py-2 border border-primary/20 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="+1 (555) 555-1234"
                                />
                            </div>
                        </div>
                        {validationErrors.contact ? (
                            <p className="text-sm text-danger">{validationErrors.contact}</p>
                        ) : null}
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-2xl p-6 md:p-8 h-fit space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-foreground">Summary</h2>
                        <p className="text-sm text-tertiary">Review your booking.</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-tertiary">Guests</span>
                            <span className="font-medium text-foreground">{guests.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
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
                    ) : null}

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

                    {currentStep === "details" && (
                        <button
                            type="button"
                            onClick={handleContinue}
                            className="w-full inline-flex items-center justify-center h-11 rounded-lg bg-primary text-white text-sm font-medium transition-colors hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    )}

                    {currentStep === "payment" && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Payment method</p>
                                <div className="mt-3 grid grid-cols-1 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod("interac")}
                                        className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${selectedPaymentMethod === "interac"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-primary/10 text-foreground hover:border-primary/30"
                                            }`}
                                    >
                                        Interac e-Transfer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod("card")}
                                        className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${selectedPaymentMethod === "card"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-primary/10 text-foreground hover:border-primary/30"
                                            }`}
                                    >
                                        Card payment
                                    </button>
                                </div>
                                {validationErrors.payment ? (
                                    <p className="text-sm text-danger mt-2">{validationErrors.payment}</p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="w-full inline-flex items-center justify-center h-11 rounded-lg bg-primary text-white text-sm font-medium transition-colors hover:bg-primary-dark"
                            >
                                Confirm booking
                            </button>
                        </div>
                    )}

                    {currentStep === "confirmation" && (
                        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-foreground">
                            <p className="font-semibold">Booking request sent.</p>
                            <p className="text-tertiary mt-1">We will confirm your appointment shortly.</p>
                        </div>
                    )}

                    <p className="text-xs text-tertiary text-center">
                        {tenantName} will confirm your appointment details.
                    </p>
                </div>
            </div>
        </div>
    );
}

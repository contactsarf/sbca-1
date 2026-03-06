export interface DurationOption {
    label: string;
    value: number;
}

export const DURATION_OPTIONS: DurationOption[] = [
    // Short durations
    { label: "5 minutes", value: 5 },
    { label: "10 minutes", value: 10 },
    { label: "15 minutes", value: 15 },
    { label: "20 minutes", value: 20 },
    { label: "25 minutes", value: 25 },
    { label: "30 minutes", value: 30 },
    { label: "40 minutes", value: 40 },
    { label: "45 minutes", value: 45 },
    { label: "50 minutes", value: 50 },

    // 1-2 hours
    { label: "1 hour", value: 60 },
    { label: "1 hour 15 minutes", value: 75 },
    { label: "1 hour 30 minutes", value: 90 },
    { label: "1 hour 45 minutes", value: 105 },

    // 2-3 hours
    { label: "2 hours", value: 120 },
    { label: "2 hours 15 minutes", value: 135 },
    { label: "2 hours 30 minutes", value: 150 },
    { label: "2 hours 45 minutes", value: 165 },

    // 3-5 hours
    { label: "3 hours", value: 180 },
    { label: "3 hours 30 minutes", value: 210 },
    { label: "4 hours", value: 240 },
    { label: "4 hours 30 minutes", value: 270 },

    // Long durations
    { label: "5 hours", value: 300 },
    { label: "6 hours", value: 360 },
    { label: "7 hours", value: 420 },
    { label: "8 hours", value: 480 },
    { label: "9 hours", value: 540 },
    { label: "10 hours", value: 600 },
    { label: "11 hours", value: 660 },
    { label: "12 hours", value: 720 },
];

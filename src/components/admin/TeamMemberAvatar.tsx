"use client";

import { useState } from "react";

interface TeamMemberAvatarProps {
    src?: string | null;
    name: string;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: { wrapper: "w-8 h-8", text: "text-xs" },
    md: { wrapper: "w-12 h-12", text: "text-base" },
    lg: { wrapper: "w-20 h-20", text: "text-2xl" },
};

export default function TeamMemberAvatar({ src, name, size = "md" }: TeamMemberAvatarProps) {
    const [hasError, setHasError] = useState(false);
    const { wrapper, text } = sizeClasses[size];

    const initials = name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className={`${wrapper} shrink-0 rounded-full overflow-hidden`}>
            {src && !hasError ? (
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setHasError(true)}
                />
            ) : (
                <div className={`w-full h-full bg-primary/15 flex items-center justify-center ring-2 ring-primary/20`}>
                    <span className={`${text} font-semibold text-primary tracking-wide select-none`}>
                        {initials}
                    </span>
                </div>
            )}
        </div>
    );
}

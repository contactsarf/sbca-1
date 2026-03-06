"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";

interface AvatarUploadProps {
    defaultValue?: string;
    name?: string;
    onFileSelect: (file: File | null) => void;
}

export default function AvatarUpload({ defaultValue, name, onFileSelect }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(defaultValue || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initials = name
        ? name.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().substring(0, 2)
        : "";

    useEffect(() => {
        setPreview(defaultValue || null);
    }, [defaultValue]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onFileSelect(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group"
                aria-label="Upload profile picture"
            >
                {/* Avatar circle */}
                <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary transition-all bg-primary/10 flex items-center justify-center">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                        />
                    ) : initials ? (
                        <span className="text-4xl font-semibold text-primary tracking-wide select-none">
                            {initials}
                        </span>
                    ) : (
                        <Camera className="w-10 h-10 text-primary/40" />
                    )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-7 h-7 text-white" />
                </div>

                {/* Remove button */}
                {preview && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        aria-label="Remove avatar"
                        className="absolute -top-1 -right-1 bg-white border border-primary/20 rounded-full p-1 text-danger hover:bg-danger/10 transition-colors shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                name="avatar_file"
            />

            <p className="text-xs text-tertiary">Click to upload photo</p>
        </div>
    );
}

"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({
    isOpen,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false,
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg max-w-sm w-full border border-primary/10 animation-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-primary/10">
                        <div className="flex items-start gap-3">
                            {isDangerous && (
                                <div className="flex-shrink-0 mt-0.5">
                                    <AlertTriangle className="w-5 h-5 text-danger" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                                <p className="mt-1 text-sm text-tertiary">{description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Actions */}
                    <div className="p-6 flex items-center justify-end gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg font-medium text-tertiary hover:bg-primary/10 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
                                isDangerous
                                    ? "bg-danger hover:bg-danger-dark"
                                    : "bg-primary hover:bg-primary-dark"
                            }`}
                        >
                            {isLoading ? "..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

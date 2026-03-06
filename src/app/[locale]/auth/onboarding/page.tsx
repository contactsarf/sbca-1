"use client";

import { useTransition, useState } from "react";
import { onboardingAction } from "../actions";
import { useParams } from "next/navigation";

export default function OnboardingPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const locale = params.locale as string;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await onboardingAction(formData, locale);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">Almost There!</h1>
                    <p className="mt-2 text-tertiary">Let's set up your organization to get started.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="organizationName" className="block text-sm font-medium text-foreground">
                            Organization Name
                        </label>
                        <input
                            id="organizationName"
                            name="organizationName"
                            type="text"
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="e.g. Acme Spa & Wellness"
                        />
                        <p className="mt-2 text-xs text-tertiary">
                            This will be your business name displayed to clients.
                        </p>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                        >
                            {isPending ? "Setting up..." : "Complete Setup"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

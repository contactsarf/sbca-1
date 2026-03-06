"use client";

import { useTransition, useState } from "react";
import { forgotPasswordAction } from "../actions";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const params = useParams();
    const locale = params.locale as string;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await forgotPasswordAction(formData, locale);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                setSuccess(true);
            }
        });
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                    <h1 className="text-2xl font-semibold mb-4 text-primary">Email Sent</h1>
                    <p className="text-tertiary mb-6">
                        If an account exists for that email, we've sent instructions to reset your password.
                    </p>
                    <Link
                        href={`/${locale}/auth/login`}
                        className="inline-block w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Logo */}
            <div className="absolute top-6 left-4 sm:left-8">
                <Link href="/" className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg leading-none select-none">
                        S
                    </span>
                    <span className="text-base font-semibold tracking-tight text-foreground">
                        Stay<span className="font-bold text-primary">Booked</span>
                        <span className="text-slate-400">.ca</span>
                    </span>
                </Link>
            </div>

            {/* Form Container */}
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
                    <p className="mt-2 text-tertiary">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-primary"
                            placeholder="you@example.com"
                        />
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
                            {isPending ? "Sending..." : "Send Reset Link"}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-sm text-tertiary">
                        Remember your password?{" "}
                        <Link href={`/${locale}/auth/login`} className="font-medium text-primary hover:text-primary-dark">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
}

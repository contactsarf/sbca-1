"use client";

import { useTransition, useState } from "react";
import { loginAction } from "../actions";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const locale = params.locale as string;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await loginAction(formData, locale);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

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
                    <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
                    <p className="mt-2 text-tertiary">Log in to your account to manage your business.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
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

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <Link
                                    href={`/${locale}/auth/forgotpassword`}
                                    className="text-xs font-medium text-primary hover:text-primary-dark"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-primary"
                                placeholder="••••••••"
                            />
                        </div>
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
                            {isPending ? "Logging in..." : "Log In"}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-sm text-tertiary">
                        Don't have an account?{" "}
                        <Link href={`/${locale}/auth/signup`} className="font-medium text-primary hover:text-primary-dark">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
}

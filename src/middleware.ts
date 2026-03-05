import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware({
    locales: ["en", "fr"],
    defaultLocale: "en",
    localePrefix: "as-needed",
});

export async function middleware(request: NextRequest) {
    await updateSession(request);
    return intlMiddleware(request);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

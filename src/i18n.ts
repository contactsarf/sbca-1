import { getRequestConfig } from "next-intl/server";

const locales = ["en", "fr"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
    const locale = ((await requestLocale) ?? "en") as (typeof locales)[number];
    const resolvedLocale = locales.includes(locale) ? locale : "en";

    return {
        locale: resolvedLocale,
        messages: (await import(`./messages/${resolvedLocale}.json`)).default,
    };
});

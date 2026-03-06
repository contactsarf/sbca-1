---
trigger: always_on
---

# Antigravity Instructions

## Project snapshot
- Stack: Next.js + Next.js App Router + TypeScript + Tailwind CSS.
- Internationalization: Next.js i18n routing enabled.
- Backend: Supabase (Auth, Postgres, RLS policies for Tenant isolation, Edge Functions only if really required).


## Folder structure
- `src/app/marketing` (for public marketing pages at https://domain.com)
- `src/app/admin` (for tenant admin dashboard at https://domain.com/admin)
- `src/app/booking` (for public booking pages at https://domain.com/booking/[tenant])
- `src/lib/booking-engine` (for booking logic and helpers)
- `src/lib/tax-engine` (for tax calculation logic)
- `src/lib/supabase` (for Supabase client and helpers)
- `src/lib/hooks` (for React hooks)
- `src/components` (for shared UI components)
- `src/constants` (for design tokens, config, constants)
- `src/types` (for TypeScript types)
- `src/messages` (for i18n)

## Patterns to follow
- Prefer App Router server components for marketing pages
- use `use client` for admin and booking pages that require interactivity.
- i18n routing: keep locale in route params; do not hardcode locale paths.

## Design/UX instructions location
- All UI and UX rules are maintained in `.github/copilot-instructions-design.md`.

## Supabase integration
- Database: enforce RLS policies for tenant isolation
- Edge Functions: call via Supabase client or direct HTTP with auth headers.


## UI stack patterns
- Tailwind utilities for layout/spacing; avoid custom CSS unless justified.
- Use Lucide icon imports by name (e.g., `import { Search } from "lucide-react"`).
- Primary font is Inter.

## Design tokens
- Primary: Deep Professional Teal `#1F6F8B` (modern, medical-spa compatible, tech-clean).
- Secondary: Soft Mint Accent `#7ED6C3` (fresh, not loud).
- Tertiary: Warm Slate `#475569` (neutral for UI elements).
- Background: Off-white neutral `#F8FAFC` (very light, modern SaaS feel).
- Success: `#16A34A`.
- Warning: `#F59E0B`.
- Danger: `#DC2626`.

- Always use the stanard color variables from themes, donot ever use raw color codes in the pages such as bg-[#1F6F8B]

## Design principles
- Clean spacing.
- Mobile-first.
- Rounded corners (8px-12px).
- Minimal shadows.
- Clear typography hierarchy.
- Less text, clear sharp labels and captions.
- No extra text or descriptions, keep it simple and intuitive. Use tooltips for any extra info if needed.
- No punchlines when not needed.
- UI elements should be standard and same size, spacing and colors should be consistent across the app. Avoid using different shades of the same color for different elements, use the same color for all similar elements. For example, all buttons should have the same primary color, all secondary buttons should have the same secondary color, all text should have the same tertiary color etc. This will create a cohesive and professional look for the app.

## Admin Layout Requirements
Desktop:
- Left dark sidebar (always open)
- Logo on top, tenant name, nav links (Dashboard, Bookings, Calendar, Services, Staff, Clients, Settings) followed by Logout at bottom.

Tablet:
- Top horizontal nav
- Overflow into "..."

Mobile:
- Hamburger menu
- Slide-out sidebar


## Component standards
- All buttons: font-medium transition-colors duration-200
- All cards should have a white background and no borders, with a subtle shadow for separation from the background. The corners should be rounded (8px-12px) to match the overall design aesthetic. The padding inside the cards should be consistent (e.g., p-4 or p-6) to ensure a clean and cohesive look across the app.

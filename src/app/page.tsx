import { redirect } from "next/navigation";

// Root redirects to default locale — next-intl handles this via middleware
// but this acts as a safety fallback
export default function RootPage() {
  redirect("/");
}

import { Users } from "lucide-react";

export default function ClientsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
                <p className="text-sm text-tertiary">Manage your client profiles and history.</p>
            </div>

            <div className="flex flex-col items-center justify-center p-16 bg-white border border-primary/10 rounded-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
                <p className="text-sm text-tertiary mt-1 max-w-xs">
                    Client management is on the way. View profiles, booking history, and preferences all in one place.
                </p>
            </div>
        </div>
    );
}

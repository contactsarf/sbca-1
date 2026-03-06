export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-tertiary">Welcome to your business management portal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-medium text-tertiary uppercase tracking-wider">Today's Bookings</h3>
                    <p className="mt-2 text-3xl font-bold text-foreground">0</p>
                </div>
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-medium text-tertiary uppercase tracking-wider">Active Services</h3>
                    <p className="mt-2 text-3xl font-bold text-foreground">0</p>
                </div>
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-medium text-tertiary uppercase tracking-wider">Total Clients</h3>
                    <p className="mt-2 text-3xl font-bold text-foreground">0</p>
                </div>
            </div>

            <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-tertiary text-center italic">This is a placeholder for your detailed dashboard statistics and activity feed.</p>
            </div>
        </div>
    );
}

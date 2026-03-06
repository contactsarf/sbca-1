# Booking Engine Documentation

## Overview

The Booking Engine is the **single source of truth** for finding available appointment slots in the StayBooked system. It implements a robust, fail-proof algorithm that handles complex scheduling scenarios including multi-service bookings, staff skill matching, and timezone conversions.

## Key Features

✅ **Service Validation**: Ensures all requested services are active and available  
✅ **Staff Skill Matching**: Automatically finds staff members qualified for requested services  
✅ **Schedule Awareness**: Respects staff working hours by day of week  
✅ **Conflict Prevention**: Checks existing bookings to avoid double-booking  
✅ **Multi-Service Support**: Handles sequential bookings for multiple services  
✅ **Client Management**: Automatic upsert of client records based on email/phone  
✅ **Timezone Handling**: Prepared for cross-timezone booking scenarios  
✅ **Optimized for Scale**: Indexed queries designed for millions of booking records  

## Architecture

### Database Tables Used

1. **`services`**: Service definitions with `duration_minutes` and `is_paused` status
2. **`teams`**: Staff members
3. **`team_schedules`**: Weekly availability (day_of_week, start_time, end_time)
4. **`service_team_members`**: Junction table mapping staff skills to services
5. **`clients`**: Customer/client records (separate from system users)
6. **`bookings`**: Existing appointments (with composite indexes for fast lookups)

### Client Management

The booking system maintains a **separate `clients` table** for customers who book appointments. This is distinct from the `profiles` table which manages authenticated system users (staff, admins, owners).

**Why separate clients?**
- Track customer visit history and spending patterns
- Enable marketing campaigns and targeted offers
- Maintain customer data separate from staff authentication
- Support future features: loyalty programs, discounts based on spending, etc.

**Client Upsert Logic:**
When a booking is created, the system automatically:
1. Searches for existing client by email OR phone (per tenant)
2. If found: Updates client information
3. If not found: Creates new client record
4. Returns `client_id` for use in booking

This ensures:
- No duplicate client records per tenant
- Client information stays current
- Marketing data accuracy

### Algorithm Flow

```
1. Validate Services
   ├─ Check all services exist
   ├─ Ensure none are paused
   └─ Calculate total duration

2. Find Eligible Staff
   ├─ If preferred staff: Check their skills
   └─ Else: Find ALL staff who can perform services

3. For Each Eligible Staff:
   ├─ Get their schedule for requested day
   ├─ Get existing bookings for that date
   └─ Calculate free time slots

4. Generate Time Slots
   ├─ Slots match service duration exactly
   ├─ No overlap with existing bookings
   └─ Within working hours

5. Return Results
   ├─ Success: Array of available slots
   └─ Failure: Clear error + suggestions
```

## Usage

### Basic Example

```typescript
import { findAvailableSlots } from '@/lib/booking-engine';

const result = await findAvailableSlots({
    tenantId: 'uuid-here',
    serviceIds: ['haircut-id', 'shave-id'],
    date: '2026-03-15',
    preferredStaffId: 'staff-id-optional',  // Optional
    clientTimezone: 'America/Vancouver'     // Optional
});

if (result.success) {
    // Display slots to user
    result.slots?.forEach(slot => {
        console.log(`${slot.startTime} - ${slot.endTime} with ${slot.teamMemberName}`);
    });
} else {
    // Show error and suggestions
    console.error(result.error);
    result.suggestions?.forEach(s => console.log(s));
}
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | string | ✅ | Tenant ID for multi-tenancy |
| `serviceIds` | string[] | ✅ | Array of service UUIDs to book |
| `date` | string | ✅ | Date in YYYY-MM-DD format |
| `preferredStaffId` | string | ❌ | Optional staff member preference |
| `clientTimezone` | string | ❌ | IANA timezone (future use) |

### Output Structure

**Success Response:**
```typescript
{
    success: true,
    slots: [
        {
            startTime: "09:00",
            endTime: "10:30",
            teamMemberId: "uuid",
            teamMemberName: "Jane Doe",
            teamMemberAvatar: "https://..."
        }
    ],
    metadata: {
        totalDurationMinutes: 90,
        servicesInfo: [
            { id: "uuid", name: "Haircut", duration: 60 },
            { id: "uuid", name: "Shave", duration: 30 }
        ]
    }
}
```

**Error Response:**
```typescript
{
    success: false,
    error: "No available time slots for the selected date.",
    suggestions: [
        "Try selecting a different date.",
        "Consider booking individual services separately."
    ]
}
```

## Client Management

### Upserting Client Records

Before creating a booking, you must upsert the client record to get a `client_id`. The `upsertClient` function handles this automatically:

```typescript
import { upsertClient } from '@/lib/booking-engine';

const clientResult = await upsertClient(supabase, tenantId, {
    email: 'john@example.com',
    phone: '+1-555-0123',
    name: 'John Doe',
    notes: 'Prefers morning appointments'  // Optional
});

if (clientResult.success) {
    const clientId = clientResult.clientId;
    // Use clientId when creating booking
} else {
    console.error(clientResult.error);
}
```

### Client Upsert Logic

The function follows this logic:

1. **Search**: Look for existing client with matching email OR phone (per tenant)
2. **Update**: If found, update client information and return existing ID
3. **Create**: If not found, create new client record and return new ID

**Important Notes:**
- At least one contact method (email or phone) is required
- Email and phone are unique per tenant
- Updating existing clients keeps historical booking data intact
- Client records are separate from system user accounts (`profiles` table)

### Client Data Uses

The `clients` table enables:
- **Visit Tracking**: Count bookings per client
- **Spending Analytics**: Sum booking totals per client
- **Marketing Campaigns**: Send targeted offers based on behavior
- **Loyalty Programs**: Reward frequent customers (future)
- **Personalization**: Remember preferences and notes

## Multi-Service Booking Logic

When a client books multiple services (e.g., haircut + shave):

1. **Total Duration Calculated**: Sum of all service durations
2. **Sequential Execution**: Services performed one after another
3. **Staff Assignment**:
   - If one staff can do all: Assign to them
   - If multiple staff needed: Future feature (currently requires same staff)
4. **Single Contiguous Slot**: All services fit in one time block

Example: 
- Haircut (60 min) + Shave (30 min) = 90-minute slot needed
- Engine finds 90-minute gaps in staff schedules

## Performance Optimizations

### Database Indexes

**Bookings Table:**
```sql
-- Fast availability lookups (most frequent query)
idx_bookings_availability_lookup (tenant_id, team_member_id, booking_date, start_time, end_time)

-- Efficient date range queries
idx_bookings_tenant_date (tenant_id, booking_date) WHERE status NOT IN ('cancelled')

-- Client booking history
idx_bookings_client (client_id)
```

**Clients Table:**
```sql
-- Fast client lookup by email/phone
idx_clients_tenant_email (tenant_id, email) WHERE email IS NOT NULL
idx_clients_tenant_phone (tenant_id, phone) WHERE phone IS NOT NULL

-- Quick search across contact methods
idx_clients_email (email) WHERE email IS NOT NULL
idx_clients_phone (phone) WHERE phone IS NOT NULL
```

**Team Schedules:**
```sql
-- Quick staff schedule access
idx_team_schedules_member (team_member_id)
```

### Query Optimization

- Filters on status (`confirmed`, `pending` only) in WHERE clause
- Composite indexes reduce query time for conflict detection
- Designed to handle millions of booking records efficiently

## Error Handling

The engine provides **clear, actionable error messages**:

| Scenario | Error Message | Suggestions |
|----------|---------------|-------------|
| Service paused | "Service XYZ is currently unavailable" | "Try another service" |
| No qualified staff | "No staff available for this service" | "Contact us", "Try another date" |
| No slots available | "No available time slots" | "Try different date", "Book services separately" |
| Preferred staff unavailable | "Selected staff cannot perform service" | "Choose different staff", "Allow auto-assignment" |

## Timezone Handling

Currently stores timezone in `bookings.timezone` field for future implementation.

**Planned Logic:**
- Client books in their timezone (Vancouver)
- System stores in provider timezone (Toronto)
- Display converts back to client timezone for confirmation

**Implementation Note:** Full timezone conversion requires `date-fns-tz` or similar library. Placeholder function exists in `convertTimezone()`.

## Best Practices

### For Service Setup
- **Include cleanup time** in service duration (e.g., 60min haircut + 10min cleanup = 70min total)
- Mark services as `is_paused = true` when temporarily unavailable
- Regularly review service durations for accuracy

### For Staff Management
- Ensure staff have complete schedules (all 7 days configured)
- Assign services to staff via `service_team_members` junction table
- Update schedules when staff availability changes

### For Booking Implementation
- Always call `findAvailableSlots()` before showing booking form
- Display all available slots, let client choose
- Validate slot is still available when creating booking (race condition prevention)

## Testing Scenarios

1. **No conflicts**: Staff fully available, should return multiple slots
2. **Partial day**: Existing bookings should create gaps
3. **Fully booked**: Should return no slots with helpful message
4. **Multi-service**: Calculate total duration correctly
5. **Skill mismatch**: Reject if staff can't perform service
6. **Paused service**: Reject with clear error
7. **Weekend/Off-day**: Return no slots if staff not scheduled

## Future Enhancements

- [ ] Full timezone conversion with `date-fns-tz`
- [ ] Buffer time between bookings (configurable)
- [ ] Different staff for different services in one booking
- [ ] Recurring bookings
- [ ] Waitlist functionality
- [ ] Smart recommendations (suggest similar available times)

## Maintenance

### Adding New Fields
If adding fields to bookings table, update:
1. `ExistingBooking` interface
2. Query in `calculateSlotsForStaff()`
3. Index definitions if querying on new field

### Performance Monitoring
Monitor these queries in production:
- Availability lookup query (most frequent)
- Service-team member skill matching
- Schedule retrieval by day of week

## Support

For questions or issues with the booking engine:
- Check database indexes are properly created
- Verify RLS policies allow reads
- Ensure staff have schedules configured
- Confirm service-team mappings exist

---

**Version**: 1.0  
**Last Updated**: March 2026  
**Maintained By**: Development Team

### General idea of the public booking page 

### Available at [locale]/booking/[slug] 

### All files for this section should reside in (src/app/[locale]/booking/) folder in the source code 

1. This page is mobile first, best in-class, light-weight, attractive. 
2. The tenant organization name and logo should be displayed prominently 
3. Option to book a service by providing the booking details as below. 
    1. Name of the person booking a service 
    2. An option to add more names and remove added names easily 
    3. Select the services from a list of services, organized cleanly and neatly by service types if available, the information shown should consists of The service name, service(prerequisites or preparations client should be aware of) the service duration the price, any deposit % if required (converted into amount) required for booking this service. 
    4. client should be able to select 1 or more services. 
4. Option to choose a preferred service provider from the staff list per service, the staff list should be displayed crisp and clean, their names, avatar, speciality should be displayed for the user to tap or click and select one service provider, if the client selects "No Preference" or "Any Available" then the system should assign the correct staff based on their skills and avalability as instructed while creating the bookign engine refer to the readme in booking-engine and adjust as neccasary or required 
5. booking engine makes sure the bookigns for every guest and for every service the choose should be as closer to each other as possible, but should never overlap with a staff or a single client, (for example a man cannot have a hair cut and have at the same slot), need to make sure of this logic and requirement. 
6. Use the Shared library or function (The "Booking Engine") which is very strong and fail proof algorithm  
7. Show a booking summary, with the guest name, selected services, selected staff or (if no staff was chosen as "No Preference") , show the date and time slot, show the service prices, deposit requiremts, show the applicable taxes, gst/hst as calculated by the "Tax Engine" and show the final amount. 
8. Repeat the above steps 3 to 7 for all the guests if more than one guest. 
9. Finally show the entire booking details, listed clearly by guest name, selected service, (service preparation notes) and (selected or assigned staff), duration, price, deposit, taxes and total. 
10. If deposit is required show the payments screen with configured payment options such as (Interac, (Card payments) via Stripe Connect or other configured payment processors in future) 
11. After sucessfull payment, show a clear detailed confirmation page with an option to save the page, add reminders to calendar, print a recepit invoice (Thermal Format) and show an exit option, such as "close the window" or "go to bookign home" etc.


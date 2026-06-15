# Calendar Sync

This site can publish one combined availability calendar from Airbnb, Booking.com,
and Vrbo.

The private platform export URLs should not be committed to the repository. They
belong in GitHub Actions secrets. The generated public files are sanitized:

- `data/availability.json` for the website availability widget
- `calendar/la-sosta-availability.ics` for calendar subscriptions

Both outputs only show unavailable dates. They do not include guest names,
reservation notes, booking references, or the original platform feed URLs.

## Get the platform iCal URLs

Airbnb:

1. Open the listing calendar.
2. Go to Availability.
3. Under Connect calendars, choose Connect to another website.
4. Copy the Airbnb calendar link.

Official help: https://www.airbnb.com/help/article/99

Booking.com:

1. Open the property in the Booking.com extranet.
2. Go to the calendar/rates availability area.
3. Open Sync calendars.
4. Add a calendar connection or export the property calendar.
5. Copy the exported iCal URL.

Official help: https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/how-synchronize-your-calendars-across-channels

Vrbo:

1. Open the Vrbo Owner Dashboard.
2. Select the property.
3. Go to Calendar, then Settings, then Availability.
4. Under Calendar sync, choose Connect calendars.
5. Choose Export calendar, then Copy URL.

Official help: https://www.vrbo.com/en-gb/help/articles/Export-your-reservation-calendar

Vrbo has an "Include tentative bookings" option. Use that only for private
calendar viewing, not when exporting back into another booking site.

## Add the URLs to GitHub

In the GitHub repository:

1. Go to Settings.
2. Go to Secrets and variables, then Actions.
3. Add these repository secrets:
   - `AIRBNB_ICAL_URL`
   - `BOOKING_ICAL_URL`
   - `VRBO_ICAL_URL`
4. Go to Actions.
5. Run the "Update availability calendar" workflow.

The workflow also runs every 3 hours. If the generated files change, it commits:

- `data/availability.json`
- `calendar/la-sosta-availability.ics`

## Subscribe from calendars on multiple devices

Use this subscription URL after the site is deployed:

```text
https://www.villasosta.com/calendar/la-sosta-availability.ics
```

Apple Calendar on Mac:

1. Open Calendar.
2. Choose File, then New Calendar Subscription.
3. Paste the URL above.
4. Choose iCloud as the location if it should appear on all devices signed in to
   that Apple account.
5. Choose an auto-refresh interval.

Official help: https://support.apple.com/guide/calendar/subscribe-to-calendars-icl1022/mac

Google Calendar:

1. Open Google Calendar on a computer.
2. Next to Other calendars, choose Add other calendars, then From URL.
3. Paste the URL above.
4. Choose Add calendar.

Official help: https://support.google.com/calendar/answer/37100

Outlook:

Use Subscribe from web or From Internet, depending on the Outlook version, and
paste the same URL. Subscribe rather than importing from a downloaded file, so
updates keep flowing.

Official help: https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web-cff1429c-5af6-41ec-a5b4-74f2c278e98c

## Run locally

To test without GitHub Actions:

```sh
export AIRBNB_ICAL_URL="https://..."
export BOOKING_ICAL_URL="https://..."
export VRBO_ICAL_URL="https://..."
python3 scripts/build-availability.py --require-feed
```

For a one-off test feed:

```sh
python3 scripts/build-availability.py --feed "Test=/path/to/sample.ics"
```

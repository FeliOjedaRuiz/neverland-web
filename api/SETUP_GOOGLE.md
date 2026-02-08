# Google Calendar Integration Setup

To enable Google Calendar syncing for bookings, follow these steps:

## 1. Create a Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Google Calendar API**.
4. Go to **IAM & Admin** > **Service Accounts**.
5. Create a new Service Account.
6. Create a JSON Key for this service account and download it.

## 2. Add Credentials File

1. Rename the downloaded JSON file to `google-credentials.json`.
2. Place it in the `api/` folder of this project:
   `c:\Users\Asus\Desktop\Neverland\Neverland-Web-App\api\google-credentials.json`

## 3. Share Calendar

To see events on your personal calendar:

1. Open the JSON file and copy the `client_email` (e.g., `service-account@project.iam.gserviceaccount.com`).
2. Go to your Google Calendar settings (the one you want bookings to appear on).
3. Under "Share with specific people", add the service account email.
4. Set permissions to "Make changes to events".

## 4. Configuration (Optional)

If you want to use a specific calendar (not your primary one), get its Calendar ID from settings and update `api/.env`:
`GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com`

## 5. Test

Create a booking on the website. Check your Google Calendar for the new event!

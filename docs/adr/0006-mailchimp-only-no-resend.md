# Mailchimp only — no Resend

All email handling (newsletter signups and contact/inquiry form routing) uses Mailchimp. Resend is not used. Superbloom is already on Mailchimp for the newsletter; keeping all email in one provider avoids adding a second email vendor and credentials. Contact form submissions are mirrored to Sanity as `formSubmission` documents so editors can see them in Studio without a separate dashboard.

**Why not Resend**: The client wants to stay on Mailchimp. Adding Resend for transactional email would introduce a second email provider, additional secrets, and a separate dashboard — no benefit at this volume.

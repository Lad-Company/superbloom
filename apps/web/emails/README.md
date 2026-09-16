# Email templates

`newsletter-welcome.html` — The Microdose welcome email, sent via the Mailchimp
Customer Journey triggered by `src/pages/api/newsletter/subscribe.json.ts`.
Design source: [Figma frame 6970:2564](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6970-2564).

To update the email in Mailchimp: Journey → welcome email → paste this file as
custom HTML.

## Image assets

Header and footer typography is baked into PNG slices in `../public/emails/`
(served at `https://www.superbloomhouse.com/emails/` — requires a site deploy).
Footer contact links stay clickable because each word (`e-mail`, `phone`,
`web`) is its own linked slice; image maps are unreliable in email clients.

Slices are 2x renders of `src/*.html`, captured with headless Chromium:

```sh
cd apps/web/emails
playwright screenshot --device="Desktop Chrome HiDPI" --viewport-size=660,357 "file://$PWD/src/header.html" /tmp/slice-header.png
playwright screenshot --device="Desktop Chrome HiDPI" --viewport-size=612,51 "file://$PWD/src/footer-addresses.html" /tmp/slice-addresses.png
playwright screenshot --device="Desktop Chrome HiDPI" --viewport-size=612,17 "file://$PWD/src/footer-contact.html" /tmp/slice-contact.png
```

`slice-header.png` and `slice-addresses.png` save directly as
`microdose-header.png` / `microdose-footer-addresses.png`. The contact row is
cut into per-word slices (design x-positions 0 / 295 / 589, doubled for 2x)
and trimmed to the ink.

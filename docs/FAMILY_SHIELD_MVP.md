# LEGION FAMILY SHIELD — MVP 0.1

## Status
Implemented as a local-only, static family anti-impersonation protocol at `/family-shield/index.html`. No login, analytics, backend, storage, or personal-data collection is used.

## Included
- Five-step response to urgent voice/video money requests.
- Family preparedness checklist (in-memory only; resets on reload).
- Three-question synthetic scenario drill.
- Printable protocol / Save as PDF.
- Post-incident checklist for bank contact, evidence preservation, account recovery, and official reporting.

## Operating protocol
1. Stop; do not act under pressure.
2. End the suspicious call.
3. Independently call the person using a number already saved in the contact list.
4. Cross-check with another trusted family member or an in-person confirmation when needed.
5. Do not transfer funds until identity and request are independently verified.

Never share OTPs, PINs, passwords, recovery codes, or banking credentials. A family passphrase may be a supplemental signal, but it is not sufficient on its own and should not be entered into this web app.

## Privacy
- No form asks for names, phone numbers, passwords, secret phrases, bank details, or voice recordings.
- No localStorage, cookies, network requests, analytics, or remote assets.
- Checklist and quiz state exist only in the current page memory.
- Printing is initiated by the user's browser.

## Limitations
This is an education and process tool, not a deepfake detector or identity verification service. A voice or face match is not proof of identity. Use a separate trusted channel.

## Acceptance checks
- [x] Static app and responsive layout
- [x] Keyboard-operable quiz controls
- [x] Checklist reset
- [x] Quiz reset and score
- [x] Print stylesheet
- [ ] Browser automation and accessibility audit
- [ ] Family pilot with informed consent

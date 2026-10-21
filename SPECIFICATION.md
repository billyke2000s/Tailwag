# Prototype behaviour

TailWag provides separate dog and cat fixtures, discovery filters, swipe/rewind controls, profile details and edits, mock matches, chat simulations, park check-ins and playdate scheduling. Preserve these test behaviours; production services are outside the current scope.

- Local test images must work in production builds and the bundled APK. Broken external images fall back locally.
- Discovery tracks stable IDs per species. Filters include distance, energy, size, purpose, vaccination and neutering. Animation accepts one action at a time. Rewind restores the last visible swiped pet, including at deck end.
- Detail-screen likes consume the same pet in discovery.
- Messages and simulated replies survive tab changes and reloads. Replies remain associated with their original recipient. Reading a conversation clears its unread count.
- Check-in is identified by pet ID and park ID, is exclusive to one park per pet, and survives navigation. Roster display uses the current saved pet name.
- Park Meetup prompts for the recipient and preselects the chosen park. Plan Playdate from a profile opens that recipient's scheduler. Playdate acceptance and dates remain simulated prototype behaviour; no external calendar is written.
- Notification and sound preferences are shared and persisted. Disabling match alerts suppresses matching banners; muting suppresses ongoing and future sound output.
- Health and verification labels follow supplied true/false/unknown values. They describe fixtures, not real verification.
- Android Back/Escape dismisses the active modal, leaves a conversation, returns to discovery, then allows native exit.
- Profile edits, matches and preferences persist locally. No backend, account or cross-device synchronization is implied.

# Upstream tracking

| Field | Value |
| --- | --- |
| Original repository | https://github.com/fpr8653-afk/tailwag |
| Source author | fpr8653-afk |
| Tracked branch | main |
| Included source revision | f993919378a8bfa12456e9de5808901fd47ff36e |
| Source commit | feat: add cat support to platform |
| Last comparison | 2026-10-21 |

The comparison found the cat-support commit was still the latest upstream revision. It is already included: dog/cat switching, feline profiles/images, catios, UI adaptations and synthesized meow/purr audio. The repair preserves local text generation while removing browser-exposed provider-key handling.

The repair baseline was implemented in commit 18428e9 locally, based on that revision. Original development history is distinct from the destination repository's publication history.

## Updating from your mate's repository

1. Fetch upstream and inspect commits since the revision above.
2. Read upstream AGENTS.md and changed behaviour before merging/cherry-picking.
3. Preserve working repairs, test data and original notices; resolve conflicts deliberately.
4. Run type checks, Node/browser tests, production build and Android checks.
5. Update this file with the actual incorporated revision and record the change in CHANGELOG.md.

Do not replace the project wholesale or silently overwrite repairs with an upstream snapshot. Do not claim future upstream commits have been included before checking them.

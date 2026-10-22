# Licence and attribution boundaries

| Component | Source | Licence / treatment |
|---|---|---|
| Original TailWag files and idea | https://github.com/fpr8653-afk/tailwag | No root licence was present in the inspected original snapshot. Preserve attribution; public availability alone does not grant broad reuse rights. Obtain the original creator's permission before redistribution beyond established rights. |
| Operational foundation, Animal Shelter Manager | https://github.com/sheltermanager/asm3 | GPL-3.0; exact pin in platform/upstream.json. Copyright and notices retained in fetched source. |
| New operational platform adaptations | platform/ | GPL-3.0; platform/LICENSE. Does not relicense unrelated inherited root files. |
| Django | https://github.com/django/django | BSD-3-Clause; installed package notices retained |
| Native bundled libraries/assets | Pinned ASM source | Preserve their individual notices; do not assume every bundled asset is authored here |

This repository is an adaptation and improvement for a friend. It does not claim authorship of the original TailWag idea/files or ASM. Local native modifications are documented in platform/scripts/patch-core.py, platform/shelter/safety.py and ARCHITECTURE.md. The operational image contains the exact fetched source and modifications. Distribution must include applicable corresponding source and licence notices. No original prototype photos are reused as real shelter animals; platform demonstrations are explicitly synthetic illustrations.

Python dependency versions are locked in platform/requirements.txt; npm dependencies retain their original package licences. Review new dependencies and copied code before adoption. This inventory is not a legal opinion or a claim that every inherited asset has been independently cleared.

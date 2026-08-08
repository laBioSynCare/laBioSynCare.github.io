# Brand marks — the BSC Lab isotype, and how it was derived

> **Status: candidate under review, nothing adopted.** `static/favicon.svg` and
> `static/icons/*` are unchanged. This directory holds the exploration, the
> generator that produced it, and the reasoning — so the next person does not
> re-derive it from scratch or re-make the mistakes recorded here.

## The development history

**<https://claude.ai/code/artifact/6075e1f4-8dcd-43bc-8258-66cdb116feb1>**

Nine sections: the parent mark measured off its artwork, every candidate at four
sizes on both grounds, the colour matrix with computed contrast ratios, the
merge that produced the current front-runner, notes on the BSC colour system,
and the forms that were tried and cut with the reason each failed.

**That page is private to its owner.** Artifacts are not public unless shared
from the page's own share menu, so this link will 403 for anyone else until it
is shared. Everything the page shows is reproducible from this directory; the
page is the readable version, not the source of truth.

## What the mark is derived from

BioSynCare's isotype, measured off its 512 px artwork rather than traced. Those
measurements are the constants at the top of [`gen.py`](gen.py) and every
candidate is built from them, so none of them can drift away from the parent or
from each other:

| Measured | Value |
|---|---|
| Canvas | 512 × 512 |
| Centre | 256, 255.5 |
| Ring mid-radius | 193.5 |
| Stroke | 22 — 4.3% of the box |
| Wave crossings | x ±106, y 280 |
| Peak above centre | 86.5 |
| Trough below centre | 147 |
| Tails meet the ring | 28° up · 24° down |

The figure is mirror-symmetric left to right (mean pixel difference 1.24 against
its own mirror) and deliberately asymmetric top to bottom (28.19). That
asymmetry is what makes it read as a wave rather than a mandala; an early
symmetric draft was discarded for exactly that reason.

## The derivation

BioSynCare delivers sessions; BSC Lab publishes the ontology, the vocabulary and
the evidence graph that describe what a session *is*. So the mark annotates
rather than redraws: the wave's four critical points — the two crossings where
the curves superpose, the peak, the trough — become the subject. Those points
were already in the parent figure, unmarked.

**Current front-runner: `merge-e.svg`.** A Petroleum 500 disc, the wave in Warm
Ivory, the two side lenses filled in Mint, and Mint nodes on the peak and
trough. The lenses mark the crossings and the nodes mark the apexes, so each
structural feature is stated once — the four rejected merges each state one
twice. Every colour pair in it is one the BSC colour manual approves: Warm Ivory
on Petroleum 9.90:1, Mint on Petroleum 6.16:1. The nodes are held off the ivory
wave by a ring of the petroleum field, because Mint on Warm Ivory is 1.61:1 and
the manual lists that pair as not recommended.

## Files

```
gen.py         every mark, from one set of measured constants
contrast.py    WCAG audit of the BSC colour system as specified
marks/         the generated SVGs
```

Regenerate with `python3 gen.py` (no dependencies). `contrast.py` prints a
pass/fail table for every colour pair the system specifies; it is what found the
focus-ring problem noted below, and it is worth re-running whenever the tokens
change.

## Notes on the BSC colour system

Read from `Digital Color System BSC.pdf` (five sheets) and the implementation
guide. These concern the **BioSynCare** repository rather than this one, and are
recorded here only because the isotype work depends on them.

1. **The logo file is not in the brand colour.** Petroleum 500 is `#00424E`; the
   isotype in the app bundle measures `#1A4E66`, and the logo inside the brand
   PDF averages `#104558` — three values for one colour. Most likely an export
   pipeline converting rather than passing colour through.
2. **The focus ring contradicts the manual's own rule.** The manual requires
   ≥3:1 for focus rings; the token sets `--color-border-focus` to Mint 500,
   which is 2.27:1 on the light ground. Mint 700 reaches 5.0:1 and still reads
   as mint.
3. **Fourteen specified pairs miss the guide's own targets**, clustered in light
   mode on non-text objects, because Mint and Sage are light-value colours and
   cannot carry meaning on a near-white ground. Dark mode passes nearly
   everything.
4. **Two documents, two systems.** Eight ramp values differ between the PDF and
   the guide's `colors.ts`, and they disagree structurally on body text and the
   secondary action. One generated token source would make the drift impossible
   rather than merely discouraged.

## If a mark is adopted

Replace `static/favicon.svg` and `static/icons/icon.svg`, regenerate
`icon-192.png`, `icon-512.png` and `apple-touch-icon-180.png` with
`rsvg-convert`, and revisit `theme-color` in `src/app.html` — the current icon
is a light-blue ring on a `#1a1a2e` disc, and these candidates are built on the
BSC palette instead.

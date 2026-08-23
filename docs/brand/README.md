# Brand marks — the BSC Lab isotype, and how it was derived

> **Migration note.** The imported BSC Lab isotype is temporarily retained as
> the visual mark used by SSTIM Workbench so the repository move does not become
> an unrelated identity redesign. File/component keys such as `bsclab` preserve
> historical compatibility; they do not make BSC Lab the public identity of
> SSTIM. A future Community Group visual-identity decision should be handled as
> a separate, reviewed change.

> **Status: adopted 2026-08-08 — `marks/merge-d.svg`.** It is now
> `static/favicon.svg`, `static/icons/icon.svg` and, scaled into the safe zone,
> `static/icons/icon-maskable.svg`; the four PNGs are rasterised from those two.
> This directory holds the exploration that produced it, the generator, and the
> reasoning — so the next person does not re-derive it or re-make the mistakes
> recorded here.

## The development history

**<https://claude.ai/code/artifact/6075e1f4-8dcd-43bc-8258-66cdb116feb1>**

Nine sections: the parent mark measured off its artwork, every candidate at four
sizes on both grounds, the colour matrix with computed contrast ratios, the
merge that produced the adopted mark, notes on the BSC colour system,
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

**Adopted: `merge-d.svg`.** A Petroleum 500 disc, the wave in Warm Ivory, the
two side lenses filled in Mint, and Mint nodes on the peak and trough. The
lenses mark the crossings and the nodes mark the apexes, so each structural
feature is stated once — the three rejected merges each state one twice. Its
colour pairs are ones the BSC manual approves: Warm Ivory on Petroleum 9.90:1,
Mint on Petroleum 6.16:1.

**Known trade-off, accepted deliberately.** The mint nodes sit directly on the
ivory wave, and Mint on Warm Ivory is 1.61:1 — a pair the manual lists as not
recommended. At 16 px each node fuses into the stroke it sits on and reads as a
thickening rather than a node. `merge-e.svg` is the same mark with a ring of the
petroleum field holding the nodes off the wave, which fixes both; it was offered
and `merge-d` was chosen for its cleaner, less engineered look at display sizes.
If the tab icon ever needs to be crisper, `merge-e` is a drop-in replacement for
the favicon alone, and `bsclab-isotype-small.svg` (the kite) is the more radical
reduction.

## The other two marks in the ecosystem

`src/ui/brand/Isotype.svelte` renders three marks inline, for the entrance hero
and footer and the About page's layer cards:

| Mark | Source |
|---|---|
| `bsclab` | `marks/merge-d.svg` — the adopted isotype above |
| `biosyncare` | `marks/biosyncare-isotype.svg` — the parent redrawn on its measured constants, in the official Petroleum 500 rather than the `#1A4E66` its raster artwork contains. **Replace with an official SVG when one is exported.** |
| `aeterni-anima` | `marks/aeterni-anima-isotype.svg` — the Æ ligature of Cormorant Garamond Medium, the face `aeterni.github.io` loads, in that site's own `--accent` `#8a6d1d`. Converted to an outline with fontTools so it needs no webfont and cannot reflow per platform; Cormorant Garamond is OFL. |

The Æ is a letterform where the other two are geometric, so the component scales
it 1.3× to match their optical presence rather than their bounding box.

## Files

```
gen.py         every generated mark, from one set of measured constants
contrast.py    WCAG audit of the BSC colour system as specified
marks/         the SVGs (aeterni-anima-isotype.svg is extracted, not generated)
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

## Changing the mark again

The three SVGs under `static/` are copies of a generated file — do not hand-edit
them. Regenerate with `python3 gen.py`, copy the chosen `marks/*.svg` over
`static/favicon.svg` and `static/icons/icon.svg`, rebuild the maskable variant
(the mark scaled to a content radius of 184 on a full-bleed Petroleum field),
then rasterise:

```sh
cd static/icons
rsvg-convert -w 192 -h 192 icon.svg          -o icon-192.png
rsvg-convert -w 512 -h 512 icon.svg          -o icon-512.png
rsvg-convert -w 512 -h 512 icon-maskable.svg -o icon-maskable-512.png
rsvg-convert -w 180 -h 180 icon-maskable.svg -o apple-touch-icon-180.png
```

`theme-color` in `src/app.html` and the manifest stays `#f7f3ea`: it is the
paper skin's background applied pre-paint, not an icon colour, and the icon
change does not bear on it.

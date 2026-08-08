<script>
  // The ecosystem's marks, inline rather than <img> so they never flash in
  // late and cost no extra request. Both are generated — see docs/brand/gen.py
  // and docs/brand/README.md; do not hand-edit the path data here, regenerate
  // and re-inline it.
  //
  // `biosyncare` is a redraw on the parent mark's own measured constants, set
  // in the official Petroleum 500 rather than the #1A4E66 its raster artwork
  // actually contains. Swap in the official SVG when one is exported.
  //
  // `aeternianima` is the Æ ligature of Cormorant Garamond Medium — the face
  // aeterni.github.io loads — in that site's own --accent #8a6d1d, converted to
  // an outline so it needs no webfont and renders identically everywhere. It is
  // a typographic mark where the other two are geometric, which is why it is
  // given a little more height than they are at the same nominal size.
  const { name, size = 40, title = '' } = $props()

  // The Æ is a letterform centred in the same 512 box the geometric marks fill
  // edge to edge, so at an equal nominal size it reads noticeably smaller.
  // Scale it up to match their optical presence rather than their bounding box.
  const OPTICAL = { 'aeterni-anima': 1.3 }
  const box = $derived(Math.round(size * (OPTICAL[name] ?? 1)))

  const MARKS = {
    bsclab: `<circle cx="256" cy="255.5" r="204.5" fill="#00424E" stroke="none"/><path d="M85.1 164.7 A193.5 193.5 0 0 0 79.2 334.2 Q132.6 307.1 150 280 Q135.6 222.3 85.1 164.7 Z" fill="#78D2AF" stroke="none"/><path d="M426.9 164.7 A193.5 193.5 0 0 1 432.8 334.2 Q379.4 307.1 362 280 Q376.4 222.3 426.9 164.7 Z" fill="#78D2AF" stroke="none"/><g fill="none" stroke="#FFF1CB" stroke-width="22" stroke-linecap="round"><path d="M79.2 334.2 C101.2 314 129.6 311.4 150 280 C182.1 211.2 215.7 169 256 169 C296.3 169 329.9 211.2 362 280"/> <path d="M432.8 334.2 C410.8 314 382.4 311.4 362 280"/> <path d="M85.1 164.7 C99.8 209.6 121.7 232.2 150 280 C182.1 355.6 215.7 402 256 402 C296.3 402 329.9 355.6 362 280"/> <path d="M426.9 164.7 C412.2 209.6 390.3 232.2 362 280"/><circle cx="256" cy="255.5" r="193.5" fill="none"/></g><circle cx="256" cy="169" r="31" fill="#78D2AF" stroke="none"/><circle cx="256" cy="402" r="31" fill="#78D2AF" stroke="none"/>`,
    biosyncare: `<g fill="none" stroke="#00424E" stroke-width="22" stroke-linecap="round"><circle cx="256" cy="255.5" r="193.5"/>
  <path d="M79.2 334.2 C101.2 314 129.6 311.4 150 280 C182.1 211.2 215.7 169 256 169 C296.3 169 329.9 211.2 362 280"/>
  <path d="M432.8 334.2 C410.8 314 382.4 311.4 362 280"/>
  <path d="M85.1 164.7 C99.8 209.6 121.7 232.2 150 280 C182.1 355.6 215.7 402 256 402 C296.3 402 329.9 355.6 362 280"/>
  <path d="M426.9 164.7 C412.2 209.6 390.3 232.2 362 280"/></g>`,
    'aeterni-anima': `<g transform="translate(48.01 413.37) scale(0.50360 -0.50360)">
    <path fill="#8a6d1d" d="M0 0Q-4 0 -4.0 6.0Q-4 12 0 12Q34 12 71.0 42.0Q108 72 149 132L448 574Q467 600 456.5 606.5Q446 613 384 613Q381 613 381.0 619.0Q381 625 384 625H788Q798 625 798 616L800 490Q800 487 794.5 486.5Q789 486 788 489Q786 517 770.0 543.0Q754 569 728.0 585.0Q702 601 670 601H619Q591 601 575.0 596.5Q559 592 552.5 579.0Q546 566 546 543V85Q546 61 552.0 47.5Q558 34 572.5 28.5Q587 23 614 23H679Q711 23 739.5 40.0Q768 57 789.5 86.0Q811 115 819 152Q819 155 824.5 154.0Q830 153 830 150Q827 123 824.0 85.0Q821 47 821 15Q821 0 806 0H389Q387 0 387.0 6.0Q387 12 389 12Q423 12 440.5 17.0Q458 22 464.0 37.0Q470 52 470 81V588L498 604L181 130Q143 72 155.5 42.0Q168 12 229 12Q234 12 234.0 6.0Q234 0 229 0Q197 0 170.0 2.0Q143 4 101 4Q68 4 47.5 2.0Q27 0 0 0ZM290 314 305 337H522L529 314ZM750 230Q750 273 725.5 293.5Q701 314 648 314H498V337H650Q702 337 725.0 354.5Q748 372 748 409Q748 411 754.0 411.0Q760 411 760 409Q760 378 759.5 361.0Q759 344 759 325Q759 302 760.0 279.0Q761 256 761 230Q761 228 755.5 228.0Q750 228 750 230Z"/>
  </g>`,
  }
</script>

{#if MARKS[name]}
  <svg
    class="isotype"
    viewBox="0 0 512 512"
    width={box}
    height={box}
    role={title ? 'img' : 'presentation'}
    aria-label={title || undefined}
    aria-hidden={title ? undefined : 'true'}
  >
    {#if title}<title>{title}</title>{/if}
    {@html MARKS[name]}
  </svg>
{/if}

<style>
  .isotype {
    display: block;
    flex: 0 0 auto;
  }
</style>

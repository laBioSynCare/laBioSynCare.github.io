#!/usr/bin/env python3
"""BSC Lab isotype candidates, derived on BioSynCare's measured grid.

Measured from BioSynCare/dist/logo-square.png (512x512), not eyeballed:
  centre            (256, 255.5)
  ring              mid-radius 193.5, stroke 22  (4.3% of the box)
  crossings         x = 256 +- 106, y ~ 280
  bell apex         y = 169    (86.5 above centre)
  trough apex       y = 402    (147 below centre)  <- asymmetric on purpose
  tails meet ring   28 deg above horizontal (trough tails),
                    24 deg below horizontal (arch tails)
  colour            #1a4e66

Symmetry test on the parent bitmap: left-right mirror mean diff 1.24 (symmetric),
top-bottom 28.19 (asymmetric). The vertical asymmetry is what makes the figure
read as a wave rather than a mandala, so it is preserved here.
"""
import math
from pathlib import Path

CX, CY = 256.0, 255.5
R = 193.5
S = 22.0
XL, XR = 150.0, 362.0
CROSS_Y = 280.0
PEAK_Y = 169.0
TROUGH_Y = 402.0
UP_DEG, DOWN_DEG = 28.0, 24.0

TEAL = '#1a4e66'   # BioSynCare
BLUE = '#3366a3'   # BSC Lab --app-accent (paper skin)

def ring_point(deg, left, below):
    a = math.radians(deg)
    x = CX - R * math.cos(a) if left else CX + R * math.cos(a)
    y = CY + R * math.sin(a) if below else CY - R * math.sin(a)
    return (x, y)

UL = ring_point(UP_DEG, True, False)
UR = ring_point(UP_DEG, False, False)
LL = ring_point(DOWN_DEG, True, True)
LR = ring_point(DOWN_DEG, False, True)

def f(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s

def half_bell(x0, y0, apex_x, apex_y, tension=0.55):
    """Cubic from a crossing to the apex, arriving with a horizontal tangent."""
    dx = apex_x - x0
    c1 = (x0 + dx * tension * 0.55, y0 + (apex_y - y0) * 0.62)
    c2 = (x0 + dx * 0.62, apex_y)
    return f'C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(apex_x)} {f(apex_y)}'

def tail(ring_pt, cross, toward, pull=0.42):
    """Cubic from a ring contact to a crossing, tangent-continuous with the bell."""
    tx, ty = toward[0] - cross[0], toward[1] - cross[1]
    n = math.hypot(tx, ty) or 1.0
    k = math.hypot(cross[0] - ring_pt[0], cross[1] - ring_pt[1]) * pull
    c2 = (cross[0] - k * tx / n, cross[1] - k * ty / n)
    # Leave the ring along the chord to the crossing, bowed slightly outward.
    # An earlier version left along the ring's own tangent, which made the tail
    # hug the ring and pinched the side lens thinner than the parent's — visible
    # the moment the redraw was overlaid on the original.
    chord = (cross[0] - ring_pt[0], cross[1] - ring_pt[1])
    cn = math.hypot(*chord) or 1.0
    outward = ((ring_pt[0] - CX) / R, (ring_pt[1] - CY) / R)
    c1 = (ring_pt[0] + chord[0] * 0.46 + outward[0] * cn * 0.13,
          ring_pt[1] + chord[1] * 0.46 + outward[1] * cn * 0.13)
    return f'M{f(ring_pt[0])} {f(ring_pt[1])} C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(cross[0])} {f(cross[1])}'

def wave(arch=True):
    apex_y = PEAK_Y if arch else TROUGH_Y
    start, end = (LL, LR) if arch else (UL, UR)
    cl, cr = (XL, CROSS_Y), (XR, CROSS_Y)
    first_ctrl = (XL + (XR - XL) * 0.34, apex_y)   # what the tail must aim at
    d = tail(start, cl, first_ctrl)
    d += ' ' + half_bell(XL, CROSS_Y, CX, apex_y)
    # mirrored half, then the outgoing tail reversed into a continuation
    d += ' ' + half_bell_mirror(CX, apex_y, XR, CROSS_Y)
    t = tail(end, cr, (XR - (XR - XL) * 0.34, apex_y))
    return d, t

def half_bell_mirror(apex_x, apex_y, x1, y1, tension=0.55):
    dx = x1 - apex_x
    c1 = (apex_x + dx * 0.38, apex_y)
    c2 = (x1 - dx * tension * 0.55, y1 + (apex_y - y1) * 0.62)
    return f'C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(x1)} {f(y1)}'

NODES = [(XL, CROSS_Y), (XR, CROSS_Y), (CX, PEAK_Y), (CX, TROUGH_Y)]

def head(colour, w=512):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" '
            f'width="{w}" height="{w}" fill="none" stroke="{colour}" '
            f'stroke-width="{f(S)}" stroke-linecap="round">')

def ring(gap=0.0):
    if not gap:
        return f'<circle cx="{f(CX)}" cy="{f(CY)}" r="{f(R)}"/>'
    half = math.radians(gap / 2)
    x1, y1 = CX - R * math.sin(half), CY - R * math.cos(half)
    x2, y2 = CX + R * math.sin(half), CY - R * math.cos(half)
    return f'<path d="M{f(x2)} {f(y2)} A{f(R)} {f(R)} 0 1 1 {f(x1)} {f(y1)}"/>'

def nodes(colour, r=31.0):
    return '\n  '.join(
        f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{colour}" stroke="none"/>'
        for x, y in NODES)

def wave_paths():
    d_arch, t_arch = wave(True)
    d_tr, t_tr = wave(False)
    return [f'<path d="{d_arch}"/>', f'<path d="{t_arch}"/>',
            f'<path d="{d_tr}"/>', f'<path d="{t_tr}"/>']

def parent(colour=TEAL):
    return '\n  '.join([head(colour), ring(), *wave_paths(), '</svg>'])

def candidate_a(colour=BLUE):
    return '\n  '.join([head(colour), ring(), *wave_paths(), nodes(colour), '</svg>'])

def candidate_b(colour=BLUE):
    return '\n  '.join([head(colour), ring(gap=52), *wave_paths(), nodes(colour), '</svg>'])

def candidate_c(colour=BLUE):
    (lx, ly), (rx, ry), (tx, ty), (bx, by) = NODES
    kite = (f'<path d="M{f(lx)} {f(ly)} L{f(tx)} {f(ty)} L{f(rx)} {f(ry)} '
            f'L{f(bx)} {f(by)} Z" stroke-linejoin="round"/>')
    return '\n  '.join([head(colour), ring(), kite, nodes(colour), '</svg>'])

def candidate_a_small(colour=BLUE):
    """16-24px reduction of A: the kite's nodes and the ring only."""
    return '\n  '.join([
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" '
        f'height="512" fill="none" stroke="{colour}" stroke-width="34" stroke-linecap="round">',
        f'<circle cx="{f(CX)}" cy="{f(CY)}" r="{f(R - 6)}"/>',
        nodes(colour, r=44), '</svg>'])

# ---------------------------------------------------------------------------
# Second pass, 2026-08-08: a wider candidate set to choose from. Every one is
# built from the same measured constants above — no new geometry is invented,
# each explores a different way of saying "this is the layer that describes it".
# ---------------------------------------------------------------------------

def bell_points(apex_y, tension=0.55):
    """The bell as explicit points, so it can also be walked backwards."""
    dxl = CX - XL
    a1 = (XL + dxl * tension * 0.55, CROSS_Y + (apex_y - CROSS_Y) * 0.62)
    a2 = (XL + dxl * 0.62, apex_y)
    dxr = XR - CX
    b1 = (CX + dxr * 0.38, apex_y)
    b2 = (XR - dxr * tension * 0.55, CROSS_Y + (apex_y - CROSS_Y) * 0.62)
    return a1, a2, (CX, apex_y), b1, b2

def bell_forward(apex_y):
    a1, a2, apex, b1, b2 = bell_points(apex_y)
    return (f'C{f(a1[0])} {f(a1[1])} {f(a2[0])} {f(a2[1])} {f(apex[0])} {f(apex[1])} '
            f'C{f(b1[0])} {f(b1[1])} {f(b2[0])} {f(b2[1])} {f(XR)} {f(CROSS_Y)}')

def bell_backward(apex_y):
    a1, a2, apex, b1, b2 = bell_points(apex_y)
    return (f'C{f(b2[0])} {f(b2[1])} {f(b1[0])} {f(b1[1])} {f(apex[0])} {f(apex[1])} '
            f'C{f(a2[0])} {f(a2[1])} {f(a1[0])} {f(a1[1])} {f(XL)} {f(CROSS_Y)}')

def lens_path():
    """The central leaf: bell over the top, trough back along the bottom."""
    return (f'M{f(XL)} {f(CROSS_Y)} {bell_forward(PEAK_Y)} '
            f'{bell_backward(TROUGH_Y)} Z')

def radial_tick(deg, inner, outer, left=False, below=False):
    a = math.radians(deg)
    sx = -1 if left else 1
    sy = 1 if below else -1
    x1, y1 = CX + sx * inner * math.cos(a), CY + sy * inner * math.sin(a)
    x2, y2 = CX + sx * outer * math.cos(a), CY + sy * outer * math.sin(a)
    return f'<path d="M{f(x1)} {f(y1)} L{f(x2)} {f(y2)}"/>'

def candidate_lens(colour=BLUE):
    """4 · Solid lens — the described object, filled."""
    return '\n  '.join([head(colour), ring(), *wave_paths(),
                        f'<path d="{lens_path()}" fill="{colour}" stroke="none"/>',
                        '</svg>'])

def candidate_breakout(colour=BLUE):
    """5 · Breakout — both upper tails continue past the ring: open, unbounded.

    One escaping tail (the first attempt) read as a leak, and asymmetry fought
    the parent, which is mirror-symmetric left to right. Extending both makes it
    a property of the figure instead of an accident on one side.
    """
    def pt(deg, r=R):
        a = math.radians(deg)
        return (CX + r * math.cos(a), CY - r * math.sin(a))

    half = 15.0
    r_lo, r_hi = pt(UP_DEG - half), pt(UP_DEG + half)
    l_lo, l_hi = pt(180 - UP_DEG + half), pt(180 - UP_DEG - half)
    top = (f'<path d="M{f(r_hi[0])} {f(r_hi[1])} A{f(R)} {f(R)} 0 0 0 '
           f'{f(l_hi[0])} {f(l_hi[1])}"/>')
    bottom = (f'<path d="M{f(l_lo[0])} {f(l_lo[1])} A{f(R)} {f(R)} 0 0 0 '
              f'{f(r_lo[0])} {f(r_lo[1])}"/>')

    exts = []
    for ring_pt, cross, toward in (
            (UR, (XR, CROSS_Y), (XR - (XR - XL) * 0.34, TROUGH_Y)),
            (UL, (XL, CROSS_Y), (XL + (XR - XL) * 0.34, TROUGH_Y))):
        chord = (cross[0] - ring_pt[0], cross[1] - ring_pt[1])
        cn = math.hypot(*chord) or 1.0
        outward = ((ring_pt[0] - CX) / R, (ring_pt[1] - CY) / R)
        c1 = (ring_pt[0] + chord[0] * 0.46 + outward[0] * cn * 0.13,
              ring_pt[1] + chord[1] * 0.46 + outward[1] * cn * 0.13)
        tan = (ring_pt[0] - c1[0], ring_pt[1] - c1[1])
        tn = math.hypot(*tan) or 1.0
        reach = 54.0
        end = (ring_pt[0] + tan[0] / tn * reach, ring_pt[1] + tan[1] / tn * reach)
        exts.append(f'<path d="M{f(ring_pt[0])} {f(ring_pt[1])} L{f(end[0])} {f(end[1])}"/>')

    return '\n  '.join([head(colour), top, bottom, *wave_paths(), *exts,
                        nodes(colour, r=27), '</svg>'])


def candidate_orbit(colour=BLUE):
    """6 · Orbit — a second contour: the lab as the layer that holds the wave."""
    inner = f'<circle cx="{f(CX)}" cy="{f(CY)}" r="{f(R - 52)}" stroke-width="11"/>'
    return '\n  '.join([head(colour), ring(), inner, *wave_paths(), '</svg>'])

def candidate_gauge(colour=BLUE):
    """7 · Gauge — ticks at the angles the parent's own geometry lands on."""
    cross_deg = math.degrees(math.atan2(CROSS_Y - CY, CX - XL))
    ticks = [
        radial_tick(90, R + 20, R + 52),                      # peak axis
        radial_tick(90, R + 20, R + 52, below=True),          # trough axis
        radial_tick(cross_deg, R + 20, R + 52, left=True, below=True),
        radial_tick(cross_deg, R + 20, R + 52, below=True),
    ]
    return '\n  '.join([head(colour), ring(), *wave_paths(),
                        *[t.replace('/>', ' stroke-width="14"/>') for t in ticks],
                        nodes(colour, r=27), '</svg>'])

def candidate_axis(colour=BLUE):
    """8 · Axis — the reference line the description is stated against."""
    # Solid, not dashed: a dash pattern at this scale disappeared by 32 px and
    # read as dirt at 16, which is the opposite of "the stated reference frame".
    axis = (f'<path d="M{f(CX - 172)} {f(CROSS_Y)} L{f(CX + 172)} {f(CROSS_Y)}" '
            f'stroke-width="12"/>')
    return '\n  '.join([head(colour), ring(), *wave_paths(), axis,
                        nodes(colour, r=27), '</svg>'])

def candidate_negative(colour=BLUE):
    """9 · Negative — the same figure as a solid artifact, wave knocked out."""
    outer = R + S / 2
    paths = ' '.join(p.replace('<path d="', '<path stroke="#000" stroke-width="26" d="')
                     for p in wave_paths())
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" '
            f'height="512">\n'
            f'  <mask id="knockout">\n'
            f'    <circle cx="{f(CX)}" cy="{f(CY)}" r="{f(outer)}" fill="#fff"/>\n'
            f'    <g fill="none" stroke-linecap="round">{paths}</g>\n'
            f'  </mask>\n'
            f'  <circle cx="{f(CX)}" cy="{f(CY)}" r="{f(outer)}" fill="{colour}" '
            f'mask="url(#knockout)"/>\n</svg>')

EXTRAS = {
    'cand-lens': candidate_lens,
    'cand-breakout': candidate_breakout,
    'cand-orbit': candidate_orbit,
    'cand-gauge': candidate_gauge,
    'cand-axis': candidate_axis,
    'cand-negative': candidate_negative,
}


# ---------------------------------------------------------------------------
# Third pass, 2026-08-08: proposals in the official BSC palette, read from
# "Digital Color System BSC.pdf" (5 sheets, image-only, rendered to check).
#
#   Petroleum 500 #00424E  primary identity — logo, navigation, CTAs, headings
#   Warm Ivory 300 #FFF1CB  warm base; approved as the mark ON petroleum
#   Mint 400 #78D2AF        wellness accent, dark-mode CTA
#   Sage 400 #86C08F        natural support, data
#   Petroleum 400 #378EA3   the only in-system single colour clearing 3:1 on
#                           BOTH the light (#FFFCF2) and dark (#001B22) grounds
#
# Approved pairs used below (sheet 08): Warm Ivory on Petroleum 9.90:1,
# Mint on Petroleum 6.16:1, Petroleum on Mint 6.16:1, Sage on Petroleum 5.27:1.
# Deliberately NOT used: Mint on Warm Ivory (1.61:1, "not recommended").
# ---------------------------------------------------------------------------

PETROL_500, PETROL_400 = '#00424E', '#378EA3'
IVORY_300, MINT_400, SAGE_400, SAGE_600 = '#FFF1CB', '#78D2AF', '#86C08F', '#4E8C59'

def _disc(colour):
    return f'<circle cx="{f(CX)}" cy="{f(CY)}" r="{f(R + S / 2)}" fill="{colour}" stroke="none"/>'

def _wave_group(colour, width=S):
    paths = ' '.join(p.replace('<path d="', f'<path d="') for p in wave_paths())
    return (f'<g fill="none" stroke="{colour}" stroke-width="{f(width)}" '
            f'stroke-linecap="round">{paths}'
            f'<circle cx="{f(CX)}" cy="{f(CY)}" r="{f(R)}" fill="none"/></g>')

def _svg(body, extra=''):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" '
            f'height="512"{extra}>\n  ' + body + '\n</svg>')

def prop_roundel():
    """Petroleum disc, mark in Warm Ivory — the brand's own 'dark hero' pairing."""
    return _svg(_disc(PETROL_500) + '\n  ' + _wave_group(IVORY_300))

def prop_roundel_mint_nodes():
    """Petroleum disc, ivory wave, mint nodes: all three brand colours, every
    pair one the manual approves."""
    nodes_mint = '\n  '.join(
        f'<circle cx="{f(x)}" cy="{f(y)}" r="31" fill="{MINT_400}"/>' for x, y in NODES)
    return _svg(_disc(PETROL_500) + '\n  ' + _wave_group(IVORY_300) + '\n  ' + nodes_mint)

def prop_petroleum_mono():
    """The accepted candidate, in the official primary identity colour."""
    return candidate_a(PETROL_500)

def prop_petroleum_400():
    """Same, in the one in-system value that survives both grounds."""
    return candidate_a(PETROL_400)

def prop_sage_lens():
    """Petroleum figure, central lens in Sage 600 — sage is the system's colour
    for data and natural support, and 600 is the lightest sage that clears 3:1
    on the light ground (3.94:1); Sage 400 would be 2.07:1."""
    return '\n  '.join([head(PETROL_500), ring(), *wave_paths(),
                        f'<path d="{lens_path()}" fill="{SAGE_600}" stroke="none"/>',
                        '</svg>'])

def prop_aperture():
    """New geometry: the two side lenses filled instead of the central one, so
    the crossings — where superposition happens — are what the eye lands on."""
    def side(left):
        ring_hi, ring_lo = (UL, LL) if left else (UR, LR)
        cross = (XL if left else XR, CROSS_Y)
        sweep = 0 if left else 1
        return (f'M{f(ring_hi[0])} {f(ring_hi[1])} '
                f'A{f(R)} {f(R)} 0 0 {sweep} {f(ring_lo[0])} {f(ring_lo[1])} '
                f'Q{f((ring_lo[0] + cross[0]) / 2 + (18 if left else -18))} '
                f'{f((ring_lo[1] + cross[1]) / 2)} {f(cross[0])} {f(cross[1])} '
                f'Q{f((ring_hi[0] + cross[0]) / 2 + (18 if left else -18))} '
                f'{f((ring_hi[1] + cross[1]) / 2)} {f(ring_hi[0])} {f(ring_hi[1])} Z')
    fills = ''.join(f'<path d="{side(l)}" fill="{MINT_400}" stroke="none"/>' for l in (True, False))
    return _svg(_disc(PETROL_500) + '\n  ' + fills + '\n  ' + _wave_group(IVORY_300))

PROPOSALS = {
    'prop-roundel': prop_roundel,
    'prop-roundel-mint': prop_roundel_mint_nodes,
    'prop-petroleum': prop_petroleum_mono,
    'prop-petroleum400': prop_petroleum_400,
    'prop-sage-lens': prop_sage_lens,
    'prop-aperture': prop_aperture,
}


# ---------------------------------------------------------------------------
# Fourth pass: merging "Roundel + mint nodes" with "Aperture".
# Both mark where the wave's structure is. The aperture fills the two side
# lenses (the crossings); the nodes mark crossings + peak + trough. Overlaying
# them naively double-marks the crossings, so the variants below differ in how
# that redundancy is resolved.
# ---------------------------------------------------------------------------

def _side_lens(left):
    ring_hi, ring_lo = (UL, LL) if left else (UR, LR)
    cross = (XL if left else XR, CROSS_Y)
    sweep = 0 if left else 1
    bow = 18 if left else -18
    return (f'M{f(ring_hi[0])} {f(ring_hi[1])} '
            f'A{f(R)} {f(R)} 0 0 {sweep} {f(ring_lo[0])} {f(ring_lo[1])} '
            f'Q{f((ring_lo[0] + cross[0]) / 2 + bow)} {f((ring_lo[1] + cross[1]) / 2)} '
            f'{f(cross[0])} {f(cross[1])} '
            f'Q{f((ring_hi[0] + cross[0]) / 2 + bow)} {f((ring_hi[1] + cross[1]) / 2)} '
            f'{f(ring_hi[0])} {f(ring_hi[1])} Z')

def _lenses(colour):
    return ''.join(f'<path d="{_side_lens(l)}" fill="{colour}" stroke="none"/>'
                   for l in (True, False))

def _nodes_at(points, colour, r=31.0):
    return ''.join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{colour}" stroke="none"/>'
                   for x, y in points)

CROSSINGS = [(XL, CROSS_Y), (XR, CROSS_Y)]
APEXES = [(CX, PEAK_Y), (CX, TROUGH_Y)]

def merge_a():
    """Everything: mint lenses AND all four mint nodes."""
    return _svg(_disc(PETROL_500) + _lenses(MINT_400) + _wave_group(IVORY_300)
                + _nodes_at(NODES, MINT_400))

def merge_b():
    """Mint lenses, ivory nodes — the nodes read as part of the wave."""
    return _svg(_disc(PETROL_500) + _lenses(MINT_400) + _wave_group(IVORY_300)
                + _nodes_at(NODES, IVORY_300))

def merge_c():
    """Sage lenses, mint nodes: two accents in their assigned roles — Sage for
    support/data, Mint for positive/active."""
    return _svg(_disc(PETROL_500) + _lenses(SAGE_400) + _wave_group(IVORY_300)
                + _nodes_at(NODES, MINT_400))

def merge_d():
    """The non-redundant merge: the lenses already mark the crossings, so only
    the peak and trough carry nodes. Each structural feature is stated once."""
    return _svg(_disc(PETROL_500) + _lenses(MINT_400) + _wave_group(IVORY_300)
                + _nodes_at(APEXES, MINT_400))

MERGES = {'merge-a': merge_a, 'merge-b': merge_b, 'merge-c': merge_c, 'merge-d': merge_d}


def merge_e():
    """merge_d, with the mint nodes held off the ivory wave by a ring of the
    petroleum field. Mint on Warm Ivory is 1.61:1 — the manual lists it as not
    recommended — and in merge_d each node touches the ivory stroke it sits on.
    A 5px petroleum gap means mint only ever meets petroleum (6.16:1, approved).
    """
    halo = ''.join(f'<circle cx="{f(x)}" cy="{f(y)}" r="36" fill="{PETROL_500}" stroke="none"/>'
                   for x, y in APEXES)
    return _svg(_disc(PETROL_500) + _lenses(MINT_400) + _wave_group(IVORY_300)
                + halo + _nodes_at(APEXES, MINT_400))

MERGES['merge-e'] = merge_e


def write_all(out):
    named = {'parent-on-grid': parent(), 'candidate-a': candidate_a(),
             'candidate-b': candidate_b(), 'candidate-c': candidate_c(),
             'candidate-a-small': candidate_a_small(),
             'bsclab-isotype': candidate_a(BLUE),
             'bsclab-isotype-teal': candidate_a(TEAL),
             'bsclab-isotype-current': candidate_a('currentColor'),
             'bsclab-isotype-small': candidate_c(BLUE),
             'bsclab-isotype-small-current': candidate_c('currentColor')}
    for name, fn in EXTRAS.items():
        named[name] = fn(BLUE)
        named[f'{name}-teal'] = fn(TEAL)
    for name, fn in PROPOSALS.items():
        named[name] = fn()
    for name, fn in MERGES.items():
        named[name] = fn()
    for name, svg in named.items():
        (out / f'{name}.svg').write_text(svg + '\n')
    return len(named)


if __name__ == '__main__':
    target = Path(__file__).parent / 'marks'
    target.mkdir(exist_ok=True)
    print('wrote', write_all(target), 'svgs to', target)

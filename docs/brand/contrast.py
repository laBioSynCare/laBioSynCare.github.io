#!/usr/bin/env python3
"""WCAG contrast audit of the BSC colour system as specified in the guide."""

def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def lum(hexv):
    h = hexv.lstrip('#')
    r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

P = {  # petroleum
 50:'#E6F1F3',100:'#CDE3E8',200:'#9BC7D1',300:'#69AABA',400:'#378EA3',
 500:'#00424E',600:'#003844',700:'#002F39',800:'#00252E',900:'#001B22'}
I = {50:'#FFFDF2',100:'#FFF9E3',200:'#FFF4D5',300:'#FFF1CB',400:'#F2DFAE',500:'#E6CC91',
 600:'#C7A968',700:'#9F834A',800:'#705C31',900:'#3F321C'}
M = {50:'#F0FBF6',100:'#DDF7EC',200:'#BDEED9',300:'#9BE3C6',400:'#78D2AF',500:'#51BD94',
 600:'#349D78',700:'#237E60',800:'#175E49',900:'#0D3F31'}
S = {50:'#F3FAF4',100:'#E8F3E7',200:'#CAE4CE',300:'#A4D5B1',400:'#86C08F',500:'#67A873',
 600:'#4E8C59',700:'#387045',800:'#2A5433',900:'#1B3922'}
N = {'white':'#FFFFFF',50:'#FAF8F1',100:'#F4F1E8',200:'#E7E1D4',300:'#D4CBBF',400:'#AFA795',
 500:'#817A6D',600:'#625D53',700:'#46423B',800:'#2F3433',900:'#1E2423'}

def check(label, fg, bg, need):
    r = ratio(fg, bg)
    verdict = 'PASS' if r >= need else 'FAIL'
    print(f'{verdict}  {r:5.2f}:1  (need {need})  {label}   {fg} on {bg}')
    return verdict == 'FAIL'

fails = 0
print('=== LIGHT MODE, text (4.5:1 normal / 3:1 large) ===')
bg = I[50]                      # background.primary
card = N['white']               # surface.primary
fails += check('text.primary on bg',      P[700], bg, 4.5)
fails += check('text.secondary on bg',    P[500], bg, 4.5)
fails += check('text.tertiary on bg',     N[600], bg, 4.5)
fails += check('text.muted on bg',        N[500], bg, 4.5)
fails += check('text.muted on card',      N[500], card, 4.5)
fails += check('text.disabled on card',   N[400], card, 4.5)
fails += check('CTA text on petroleum',   I[50],  P[500], 4.5)
print()
print('=== LIGHT MODE, non-text objects: borders, focus rings, icons (3:1) ===')
fails += check('border.focus (mint 500) on bg',   M[500], bg, 3.0)
fails += check('border.focus on card',            M[500], card, 3.0)
fails += check('border.default on card',          N[300], card, 3.0)
fails += check('border.subtle on card',           N[200], card, 3.0)
fails += check('icon.accent (mint 500) on card',  M[500], card, 3.0)
fails += check('icon.secondary (sage 500) on card', S[500], card, 3.0)
print()
print('=== LIGHT MODE, state badges (text 4.5, border 3) ===')
for name, b, br, t in (('success','#E8F7EF','#78D2AF','#176B4D'),
                       ('warning','#FFF4D6','#F2C94C','#8A6200'),
                       ('error','#FDEAEA','#E06A6A','#9F1D1D'),
                       ('info','#E8F4F7','#69AABA','#00576A'),
                       ('inactive','#F4F1E8','#AFA795','#625D53')):
    fails += check(f'{name}.text on its background', t, b, 4.5)
    fails += check(f'{name}.border on page bg',      br, bg, 3.0)
print()
print('=== DARK MODE ===')
dbg, dcard = P[900], P[800]
fails += check('text.primary on bg',       I[100], dbg, 4.5)
fails += check('text.secondary on card',   I[200], dcard, 4.5)
fails += check('text.tertiary on bg',      N[300], dbg, 4.5)
fails += check('text.muted on bg',         N[400], dbg, 4.5)
fails += check('text.disabled on card',    N[600], dcard, 4.5)
fails += check('CTA: petroleum900 on mint400', P[900], M[400], 4.5)
fails += check('icon.accent (mint400) on bg',  M[400], dbg, 3.0)
fails += check('icon.secondary (sage300) on bg', S[300], dbg, 3.0)
fails += check('tertiary action text (mint300) on bg', M[300], dbg, 4.5)
print()
print('=== The ramp gap the guide inherits ===')
for a, b in ((300,400),(400,500),(500,600)):
    print(f'petroleum {a}->{b}: contrast {ratio(P[a], P[b]):.2f}:1, '
          f'luminance {lum(P[a]):.4f} -> {lum(P[b]):.4f}')
print()
print(f'TOTAL FAILURES: {fails}')

// Flash-rate safety for visual stimulation.
//
// Photosensitive-epilepsy guidance (WCAG 2.3.1; Harding / ITU-R BT.1702) caps
// general and red flashing at no more than three per second; provocation peaks
// roughly in the 15–25 Hz band. This module is the runtime hard gate that
// complements the global on/off policy in visualSafety.js. The same threshold
// is modelled in the ontology as sstim-ex:limitFlickerWcag (ADR 0011).
//
// Pure functions only — no DOM, no stores — so they are unit-testable and can
// be reused by the visual engine later.

// No more than three flashes per second is the recognised general-safe ceiling.
export const FLASH_SAFE_MAX_HZ = 3

// Peak photosensitive-provocation band (Hz). Flashing here is highest risk.
export const FLASH_RISK_BAND = { min: 3, max: 60 }
export const FLASH_PEAK_BAND = { min: 15, max: 25 }

/**
 * Risk level for a flash rate.
 * @param {number} rateHz
 * @param {{ isRed?: boolean, highContrast?: boolean }} [opts]
 * @returns {'safe'|'caution'|'high'}
 */
export function flashRiskLevel(rateHz, opts = {}) {
  const rate = Number(rateHz) || 0
  if (rate <= FLASH_SAFE_MAX_HZ) return 'safe'
  const inPeak = rate >= FLASH_PEAK_BAND.min && rate <= FLASH_PEAK_BAND.max
  if (inPeak && (opts.isRed || opts.highContrast)) return 'high'
  if (inPeak) return 'high'
  return 'caution'
}

/**
 * Clamp a flash rate to the general-safe ceiling unless the user has explicitly
 * accepted the risk band this session.
 * @param {number} rateHz
 * @param {{ accepted?: boolean }} [opts]
 * @returns {number}
 */
export function clampFlashRate(rateHz, opts = {}) {
  const rate = Math.max(0, Number(rateHz) || 0)
  if (opts.accepted) return rate
  return Math.min(rate, FLASH_SAFE_MAX_HZ)
}

/** Whether a flash rate needs an explicit risk-band acknowledgement to run. */
export function requiresFlashAcknowledgement(rateHz) {
  return (Number(rateHz) || 0) > FLASH_SAFE_MAX_HZ
}

/** Short human-readable caption for a risk level (conservative wellness framing). */
export function flashRiskMessage(level) {
  switch (level) {
    case 'high':
      return 'This flash rate is in the highest-risk band for photosensitive epilepsy. Use with caution, or keep the rate at or below 3 Hz.'
    case 'caution':
      return 'This flash rate is above the general-safe 3 Hz guidance. Please be careful and stop if you feel unwell.'
    default:
      return 'At or below the general-safe 3 Hz flash guidance.'
  }
}

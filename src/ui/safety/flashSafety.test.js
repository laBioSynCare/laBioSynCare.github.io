import { describe, expect, it } from 'vitest'
import {
  FLASH_SAFE_MAX_HZ,
  clampFlashRate,
  flashRiskLevel,
  requiresFlashAcknowledgement,
} from './flashSafety.js'

describe('flashSafety', () => {
  it('caps the flash rate at the general-safe ceiling unless accepted', () => {
    expect(clampFlashRate(18)).toBe(FLASH_SAFE_MAX_HZ)
    expect(clampFlashRate(2)).toBe(2)
    expect(clampFlashRate(18, { accepted: true })).toBe(18)
    expect(clampFlashRate(-5)).toBe(0)
  })

  it('classifies risk by rate and band', () => {
    expect(flashRiskLevel(2)).toBe('safe')
    expect(flashRiskLevel(3)).toBe('safe')
    expect(flashRiskLevel(8)).toBe('caution') // above 3, outside the peak band
    expect(flashRiskLevel(18)).toBe('high') // in the 15–25 Hz peak band
    expect(flashRiskLevel(18, { isRed: true })).toBe('high')
  })

  it('requires acknowledgement only above the safe ceiling', () => {
    expect(requiresFlashAcknowledgement(3)).toBe(false)
    expect(requiresFlashAcknowledgement(3.5)).toBe(true)
  })
})

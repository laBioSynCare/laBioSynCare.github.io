import { describe, expect, it } from 'vitest'
import { repairWidocoLinks } from './fix-widoco-links.mjs'

describe('WIDOCO link repair', () => {
  it('routes an orphaned SSTIM term to the mounted Graph Navigator relatively', () => {
    const input = '<a href="evidenceNotes" title="https://w3id.org/sstim#evidenceNotes">notes</a>'
    const result = repairWidocoLinks(input)
    expect(result.repairs).toBe(1)
    expect(result.output).toContain('href="../../graph/#sstim:evidenceNotes"')
  })

  it('leaves valid local anchors and unrelated links unchanged', () => {
    const input = [
      '<a href="#FrequencyBand" title="https://w3id.org/sstim#FrequencyBand">band</a>',
      '<a href="vocab/">vocabulary</a>',
    ].join('')
    expect(repairWidocoLinks(input)).toEqual({ output: input, repairs: 0 })
  })
})

import { describe, expect, it } from 'vitest'
import { MANUAL_CHAPTERS, MANUAL_IDS, getManualChapter } from '../src/ui/manual/chapters.js'

const EXPECTED = ['workbench', 'ontology', 'python', 'javascript', 'mcp', 'repository']

describe('public SSTIM manual tutorials', () => {
  it('has six distinct, addressable public chapter routes', () => {
    expect(MANUAL_IDS).toEqual(EXPECTED)
    expect(new Set(MANUAL_IDS).size).toBe(MANUAL_IDS.length)
    expect(MANUAL_CHAPTERS.map(x => x.id)).toEqual(EXPECTED)
    for (const id of EXPECTED) expect(getManualChapter(id)?.id).toBe(id)
    expect(getManualChapter('does-not-exist')).toBeUndefined()
  })
  it('has practical user tasks and nonempty examples across every interface', () => {
    for (const chapter of MANUAL_CHAPTERS) {
      expect(chapter.title.length).toBeGreaterThan(5)
      expect(chapter.short.length).toBeGreaterThan(15)
      expect(chapter.intro.length).toBeGreaterThan(80)
      expect(chapter.examples.length, chapter.id).toBeGreaterThanOrEqual(5)
      expect(chapter.more.length).toBeGreaterThan(0)
      for (const example of chapter.examples) {
        expect(example.title.length).toBeGreaterThan(9)
        expect(example.goal.length).toBeGreaterThan(25)
        expect(example.steps.length).toBeGreaterThan(0)
        expect(example.code || example.prompt || example.links?.length).toBeTruthy()
        if (example.code) {
          expect(example.language).toMatch(/^(bash|python|javascript|json|toml|sparql)$/)
          expect(example.code.length).toBeGreaterThan(15)
        }
        for (const link of example.links ?? []) {
          expect(link.href.startsWith('/') || link.href.startsWith('https://')).toBe(true)
          expect(link.label).toBeTruthy()
        }
      }
    }
  })
  it('documents practical MCP use cases without promising writes or clinical proof', () => {
    const mcp = getManualChapter('mcp')
    expect(mcp.examples.length).toBeGreaterThanOrEqual(8)
    expect(mcp.examples.filter(e => e.prompt).length).toBeGreaterThanOrEqual(6)
    expect(mcp.examples.some(e => e.code?.includes('@sstim/mcp@0.2.0'))).toBe(true)
    expect(mcp.examples.some(e => /contribution/i.test(e.title))).toBe(true)
    expect(mcp.intro).toContain('read-only')
  })
  it('distinguishes Python Full SHACL from partial JavaScript SHACL', () => {
    expect(getManualChapter('javascript').intro).toContain('PARTIAL')
    expect(getManualChapter('python').intro).toContain('SHACL')
    expect(getManualChapter('ontology').intro).toContain('mint')
  })
})

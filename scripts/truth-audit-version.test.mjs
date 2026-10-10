import { describe, expect, it } from 'vitest'
import { isSstimNpmVersion } from './truth-audit-version.js'

function staleMentions(line) {
  return [...line.matchAll(/\bv?(\d+\.\d+\.\d+)\b/g)]
    .filter(match => !isSstimNpmVersion(line, match.index))
    .map(match => match[1])
}

describe('truth-audit distinguishes npm packages from ontology releases', () => {
  it('ignores exact pinned SSTIM package versions in prose and install commands', () => {
    expect(staleMentions('Published @sstim/mcp@0.2.0')).toEqual([])
    expect(staleMentions('`@sstim/core@0.2.0`')).toEqual([])
    expect(staleMentions('args = ["--yes", "@sstim/mcp@0.2.0"]')).toEqual([])
    expect(staleMentions('https://www.npmjs.com/package/@sstim/mcp/v/0.2.0'))
      .toEqual(['0.2.0'])
  })

  it('still catches a stale bare SSTIM suite version on the same line', () => {
    expect(staleMentions('Current SSTIM 0.17.0; install @sstim/mcp@0.2.0'))
      .toEqual(['0.17.0'])
    expect(staleMentions('SSTIM v0.17.0')).toEqual(['0.17.0'])
    expect(staleMentions('SSTIM 0.18.0')).toEqual(['0.18.0'])
  })

  it('does not broadly exempt other package names, ranges, or unrelated prose', () => {
    expect(staleMentions('SSTIM 0.1.0 and @elsewhere/mcp@0.2.0'))
      .toEqual(['0.1.0', '0.2.0'])
    expect(staleMentions('Version 0.2.0')).toEqual(['0.2.0'])
    expect(staleMentions('SSTIM 0.20.0-dev with @sstim/mcp@0.2.0'))
      .toEqual(['0.20.0'])
  })
})

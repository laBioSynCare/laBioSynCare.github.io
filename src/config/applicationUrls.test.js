import { describe, expect, it } from 'vitest'

import { deploymentBase } from '../../deployment.config.js'
import {
  applicationAsset,
  applicationRoute,
  logicalApplicationPath,
} from './applicationUrls.js'

describe('central application URL resolver', () => {
  it('receives the validated deployment mount from Vite', () => {
    expect(applicationRoute('/')).toBe(`${deploymentBase}/` || '/')
    expect(applicationRoute('/graph/#StimulationMechanism'))
      .toBe(`${deploymentBase}/graph/#StimulationMechanism`)
    expect(applicationAsset('/worklets/bsc-osc.wasm?build=1#module'))
      .toBe(`${deploymentBase}/worklets/bsc-osc.wasm?build=1#module`)
  })

  it('passes canonical and external URLs through unchanged', () => {
    expect(applicationRoute('https://w3id.org/sstim#Stimulus'))
      .toBe('https://w3id.org/sstim#Stimulus')
    expect(applicationAsset('//cdn.example.test/file.js'))
      .toBe('//cdn.example.test/file.js')
    expect(applicationRoute('#section')).toBe('#section')
  })

  it('maps mounted browser URLs back to logical repository paths', () => {
    const mounted = `${deploymentBase}/ontology/manifest.json`
    expect(logicalApplicationPath(mounted)).toBe('/ontology/manifest.json')
  })

  it('rejects ambiguous relative paths', () => {
    expect(() => applicationRoute('graph/')).toThrow(/root-relative/)
    expect(() => applicationAsset('worklets/bsc-osc.wasm')).toThrow(/root-relative/)
  })
})

import { describe, expect, it } from 'vitest'
import { NullAudioEngine } from './NullAudioEngine.js'

describe('NullAudioEngine', () => {
  it('runs without browser or Web Audio globals', async () => {
    let nowMs = 1_000
    const engine = new NullAudioEngine({ now: () => nowMs })

    await expect(engine.initialize()).resolves.toBeUndefined()
    const clock = engine.getAudioContext()

    expect(clock.state).toBe('suspended')
    expect(clock.currentTime).toBe(0)
    expect(engine.getCapabilities()).toEqual({
      supportsAudioWorklet: false,
      supportsWasm: false,
      supportsSharedArrayBuffer: false,
      sampleRate: 0,
      outputLatency: 0,
      implementationName: 'Silent',
    })

    nowMs = 1_500
    expect(clock.currentTime).toBe(0)
  })

  it('is monotonic while running and pauses while suspended', async () => {
    let nowMs = 2_000
    const engine = new NullAudioEngine({ now: () => nowMs })
    await engine.initialize()
    const clock = engine.getAudioContext()

    await engine.resume()
    nowMs = 2_250
    expect(clock.currentTime).toBeCloseTo(0.25)

    nowMs = 2_100 // a wall-clock regression must not move session time back
    expect(clock.currentTime).toBeCloseTo(0.25)

    await engine.suspend()
    nowMs = 7_000
    expect(clock.currentTime).toBeCloseTo(0.25)

    await engine.resume()
    nowMs = 7_400
    expect(clock.currentTime).toBeCloseTo(0.65)
  })

  it('closes cleanly and can be initialized again', async () => {
    let nowMs = 0
    const engine = new NullAudioEngine({ now: () => nowMs })
    await engine.initialize()
    const firstClock = engine.getAudioContext()

    await engine.resume()
    nowMs = 300
    await engine.dispose()

    expect(firstClock.state).toBe('closed')
    expect(firstClock.currentTime).toBeCloseTo(0.3)
    expect(engine.getAudioContext()).toBeNull()

    await engine.initialize()
    expect(engine.getAudioContext()).not.toBe(firstClock)
    expect(engine.getAudioContext().state).toBe('suspended')
  })
})

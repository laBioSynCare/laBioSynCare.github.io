// Shared release/teardown helpers for the audio engines.
//
// Both live between the audio clock and the main thread, and both got that
// relationship wrong in the same way: teardown was scheduled from the moment
// stopVoice() was *called* rather than from the moment the release ramp
// *ends*. Stopping a voice ahead of time — which is what any lookahead
// scheduler does, and what the planned Worker scheduler will do at 100 ms of
// lookahead — therefore disconnected the voice long before it was meant to
// stop sounding. The engines share this module so the two cannot drift again.

/**
 * Wall-clock delay, in milliseconds, until it is safe to disconnect a voice
 * whose release ramp ends at `tEnd` on the audio clock. Derived from the audio
 * clock every time: `setTimeout` is used only for garbage collection, never
 * for anything audible (CLAUDE.md §3.1).
 *
 * @param {BaseAudioContext} ctx
 * @param {number} tEnd  AudioContext time at which the release ramp completes.
 * @param {number} [graceSeconds]
 * @returns {number}
 */
export function teardownDelayMs(ctx, tEnd, graceSeconds = 0.05) {
  const now = ctx?.currentTime ?? 0
  return Math.max(0, (tEnd - now + graceSeconds) * 1000)
}

/**
 * Hold a gain AudioParam at whatever value its automation reaches at `t`, then
 * ramp it to silence by `tEnd`.
 *
 * `cancelAndHoldAtTime` exists for exactly this and preserves the value the
 * curve *will* have at `t`. The fallback pins `param.value`, which is the value
 * now — stopping a voice mid-attack then snaps the gain and clicks.
 *
 * @param {AudioParam} param
 * @param {number} t
 * @param {number} tEnd
 */
export function holdThenRelease(param, t, tEnd) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(t)
  } else {
    param.cancelScheduledValues(t)
    param.setValueAtTime(param.value, t)
  }
  param.linearRampToValueAtTime(0.0001, tEnd)
}

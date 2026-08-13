// Records one session as it runs, on the engine's clock and nothing else.
//
// The recorder exists because "what happened, in what order" is a question the
// old model could not answer: there was no event, no clock origin, and no way
// to tell a paused session from a short one. Competency questions 1, 2 and 6 in
// improvement plan 2.3 are the acceptance test for this file.
//
// ## Why the clock is passed in
//
// `engine.getAudioContext()` is the sole timing authority (CLAUDE.md 3.1).
// Sounding engines return a real AudioContext whose hardware clock is accurate
// to about 0.02 ms at 48 kHz; the Silent engine returns the documented
// monotonic surface. Either way the recorder reads `currentTime` and stores
// offsets from the origin it captured at open. It never calls `Date.now()`,
// `performance.now()` or `setTimeout` to place an event, because those clocks
// drift against the audio hardware and a timeline built from them cannot be
// aligned to the stimulus it is supposed to describe.
//
// Wall-clock time is different in kind and is treated as such: `startedAt` and
// `endedAt` place the session in the calendar, are supplied by the caller
// rather than read from a global clock, and order nothing. Passing them in also
// makes the recorder deterministic, which is what lets the golden fixtures be
// byte-stable.
//
// ## Why an instance is append-only
//
// A session record is evidence of nothing except itself, and it is only that
// much if it was not edited afterwards. `close()` freezes the bundle; reports
// collected later attach as additional records with their own phase and
// timestamp rather than overwriting what an earlier phase said.

import {
  SESSION_BUNDLE_MODEL,
  assertId,
  deriveCompletionStatus,
  sessionIds,
} from './sessionContract.js'

/**
 * Open a session instance and begin recording.
 *
 * @param {object} options
 * @param {object} options.specification  a specification object conforming to the schema
 * @param {{ currentTime: number }} options.timingContext  the active engine's timing context
 * @param {string} options.instanceId     stable id; every part is derived from it
 * @param {string} options.startedAt      ISO wall clock for calendar placement only
 * @param {'audio-context'|'silent-monotonic'} [options.clockSource]
 * @param {string[]} [options.deliveryModalities]
 */
export function openSession({
  specification,
  timingContext,
  instanceId,
  startedAt,
  clockSource = 'audio-context',
  deliveryModalities = [],
}) {
  if (!specification?.id) throw new Error('A session needs a specification with a stable id.')
  if (typeof timingContext?.currentTime !== 'number') {
    throw new Error('A session needs the engine timing context; it is the only clock (CLAUDE.md 3.1).')
  }
  if (!startedAt) throw new Error('openSession needs a startedAt wall clock for calendar placement.')

  const ids = sessionIds(assertId(instanceId, 'A session instance'))
  if (specification.id !== ids.specification) {
    throw new Error(`Specification id must be "${ids.specification}" to stay derivable from the instance id; got "${specification.id}".`)
  }

  const clockOriginSeconds = timingContext.currentTime
  const events = []
  const reports = []

  let closed = false
  let pausedAtOffset = null
  let pausedTotal = 0
  let endOffset = null

  const offset = () => Math.max(0, timingContext.currentTime - clockOriginSeconds)

  const assertOpen = () => {
    if (closed) throw new Error('This session instance is closed; a closed record is never modified.')
  }

  /**
   * @param {string} type
   * @param {object} [detail]
   * @param {number} [at]  explicit offset, for the closing event only — see close()
   */
  function mark(type, detail, at) {
    assertOpen()
    const event = { id: ids.event(events.length), type, offsetSeconds: at ?? round(offset()) }
    if (detail && Object.keys(detail).length > 0) event.detail = detail
    events.push(event)
    return event
  }

  mark('session-open')

  return {
    get clockOriginSeconds() { return clockOriginSeconds },
    get offsetSeconds() { return round(offset()) },
    get events() { return events.slice() },

    /** Record an occurrence on the engine clock. */
    mark,

    /** Pause: stops delivered time accumulating, keeps elapsed time running. */
    pause() {
      assertOpen()
      if (pausedAtOffset !== null) return null
      const event = mark('playback-pause')
      pausedAtOffset = event.offsetSeconds
      return event
    },

    resume() {
      assertOpen()
      if (pausedAtOffset === null) return null
      const event = mark('playback-resume')
      pausedTotal += event.offsetSeconds - pausedAtOffset
      pausedAtOffset = null
      return event
    },

    /**
     * Attach a report collection.
     *
     * A during-session report is placed on the engine clock like any other
     * occurrence; pre-session and follow-up reports carry only wall clock,
     * because the session clock does not extend to them.
     */
    attachReport(report) {
      assertOpen()
      if (!report?.id) throw new Error('A report needs a stable id.')
      if (report.phase === 'during-session' && report.collectedAtOffsetSeconds === undefined) {
        report = { ...report, collectedAtOffsetSeconds: round(offset()) }
      }
      reports.push(report)
      mark('report-collected', { reportId: report.id })
      return report
    },

    /**
     * Close the instance and return the finished bundle.
     *
     * `status` may be forced (a stop button gives 'interrupted' regardless of
     * arithmetic); left out, it is derived from delivered time against the
     * intended duration.
     */
    close({ endedAt, status, privacy, label }) {
      assertOpen()
      if (!endedAt) throw new Error('close() needs an endedAt wall clock.')
      if (!privacy) throw new Error('close() needs a privacy profile; a session record without one cannot be stored or exported.')

      endOffset = round(offset())

      // Closing while paused settles the accounting; it does not invent a
      // resume. An earlier version emitted one so the pause had a partner,
      // which put an event that never happened into a timeline whose whole
      // purpose is recording what did. A session paused and then ended reads as
      // pause → interrupt, because that is what occurred.
      if (pausedAtOffset !== null) {
        pausedTotal += endOffset - pausedAtOffset
        pausedAtOffset = null
      }

      const deliveredSeconds = round(Math.max(0, endOffset - pausedTotal))
      const completionStatus = status ?? deriveCompletionStatus(deliveredSeconds, specification.durationSeconds)

      // At exactly endOffset, not at "now": re-reading the clock here would put
      // the closing event a few microseconds past the duration the same close()
      // just recorded, leaving a timeline that runs beyond its own session.
      mark(completionStatus === 'completed' ? 'session-complete' : 'session-interrupt', undefined, endOffset)
      closed = true

      const instance = {
        id: ids.instance,
        label: label ?? `Session ${ids.instance}`,
        specificationId: specification.id,
        startedAt,
        endedAt,
        clockOriginSeconds: round(clockOriginSeconds),
        clockSource,
        actualDurationSeconds: endOffset,
        deliveredSeconds,
        completionStatus,
      }
      if (deliveryModalities.length > 0) instance.deliveryModalities = deliveryModalities.slice()

      return {
        model: SESSION_BUNDLE_MODEL,
        specification,
        instance,
        events: events.slice(),
        reports: reports.slice(),
        privacy,
      }
    },
  }
}

/**
 * Six decimals: finer than any audio clock resolves, coarse enough that the
 * same recording serialises identically on two machines.
 */
function round(seconds) {
  return Math.round(seconds * 1e6) / 1e6
}

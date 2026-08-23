// Golden synthetic sessions — the cases improvement plan 2.3 requires the model
// to answer before it is accepted:
//
//   helpful / no unwanted experience · unhelpful with one experience ·
//   multiple experiences · declined / not asked · pre, during and post reports ·
//   follow-up · an interrupted session
//
// Every fixture is `classification: "synthetic"`, machine-checked by the gate:
// nothing here describes a person, and the public-repository lint refuses to
// let anything else be committed. Values are illustrative and are not evidence
// of anything — a report is an observation, and only a separate governed
// assessment can turn observations into an evidence claim.
//
// They are written as data rather than recorded through the recorder so that a
// change in the recorder cannot quietly rewrite the contract's own fixtures.
// `sessionRecorder.test.js` checks the recorder produces the same shape.

const PRIVACY_SYNTHETIC = {
  classification: 'synthetic',
  reportingRole: 'synthetic',
  consentBasis: 'none-required-synthetic',
  policyVersion: '1.0.0',
  visibility: 'public',
  deidentification: 'none',
  withdrawn: false,
  freeTextIncluded: false,
}

const INSTRUMENT = { id: 'bsc-lab-core-report', version: '1.0.0', language: 'en' }

const SOURCE = {
  kind: 'preset',
  ref: 'https://w3id.org/sstim/implementation/bsclab/preset/perform-alpha-10-seed',
  label: 'Perform — Alpha 10 seed',
  // A real hash of a real (if trivial) document, so a reader can reproduce it:
  // sha256 of canonicalJson({ preset: 'perform-alpha-10-seed', synthetic: true }).
  // A plausible-looking string of hex would have been indistinguishable from a
  // hash of nothing, which is the failure mode content hashes exist to prevent.
  contentHash: '32e114684d8a8e9d03a2a45d85b004d0aa9ddf21bfcc19b35bdf49b0e62ab79e',
  contentHashAlgorithm: 'sha256-canonical-json',
}

const scale5 = (minLabel, maxLabel) => ({ kind: 'ordinal', min: 1, max: 5, minLabel, maxLabel })

function item(id, role, value, scale, prompt) {
  return {
    id,
    role,
    responseState: 'supplied',
    value,
    scale,
    prompt: { id: prompt, text: PROMPTS[prompt] },
  }
}

/** Neutral prompts: none names the session's intended target. */
const PROMPTS = {
  affect: 'How do you feel right now?',
  focus: 'How would you describe your attention right now?',
  sleepiness: 'How alert or drowsy do you feel?',
  quality: 'How would you rate this session?',
  helpfulness: 'How much did this session help with what you wanted from it?',
  goal: 'Did the session do what you wanted from it?',
}

function specification(id, overrides = {}) {
  return {
    id,
    label: 'Synthetic reference session specification',
    created: '2026-08-13T09:00:00Z',
    source: SOURCE,
    durationSeconds: 600,
    masterVolume: 0.2,
    breathingPeriodInitial: null,
    breathingPeriodFinal: null,
    breathingTransitionDuration: null,
    environment: {
      audioEngine: 'audio-worklet',
      audioEngineVersion: '0.1.0',
      outputRoute: 'headphones',
      sampleRateHz: 48000,
      outputLatencySeconds: 0.021,
      platform: 'web',
      appVersion: '0.1.0',
      sstimRelease: '0.13.0',
    },
    outputGuarantee: 'perceptually-equivalent',
    ...overrides,
  }
}

// ── 1. Helpful, no unwanted experience, pre + immediate-post ────────────────
export const helpfulNoUnwanted = {
  model: 'bsc-lab-session-bundle-1',
  specification: specification('synthetic-helpful-spec'),
  instance: {
    id: 'synthetic-helpful',
    label: 'Synthetic session — helpful, no unwanted experience',
    specificationId: 'synthetic-helpful-spec',
    startedAt: '2026-08-13T09:01:00Z',
    endedAt: '2026-08-13T09:11:02Z',
    clockOriginSeconds: 12.5,
    clockSource: 'audio-context',
    actualDurationSeconds: 602,
    deliveredSeconds: 602,
    completionStatus: 'completed',
    deliveryModalities: ['auditory'],
  },
  events: [
    { id: 'synthetic-helpful-event-0000', type: 'session-open', offsetSeconds: 0 },
    { id: 'synthetic-helpful-event-0001', type: 'playback-start', offsetSeconds: 0.4 },
    { id: 'synthetic-helpful-event-0002', type: 'session-complete', offsetSeconds: 602 },
    { id: 'synthetic-helpful-event-0003', type: 'report-collected', offsetSeconds: 602.5, detail: { reportId: 'synthetic-helpful-report-immediate-post' } },
  ],
  reports: [
    {
      id: 'synthetic-helpful-report-pre-session',
      phase: 'pre-session',
      collectedAt: '2026-08-13T09:00:30Z',
      instrument: INSTRUMENT,
      statedGoal: { responseState: 'supplied', text: 'Settle before a long stretch of writing.' },
      items: [
        item('synthetic-helpful-report-pre-session-item-primary-affect', 'primary-affect', 3, scale5('very negative', 'very positive'), 'affect'),
        item('synthetic-helpful-report-pre-session-item-focus', 'focus', 2, scale5('scattered', 'highly focused'), 'focus'),
        item('synthetic-helpful-report-pre-session-item-sleepiness', 'sleepiness', 3, scale5('alert', 'very drowsy'), 'sleepiness'),
      ],
      unwantedExperiences: { responseState: 'not-asked' },
    },
    {
      id: 'synthetic-helpful-report-immediate-post',
      phase: 'immediate-post',
      collectedAt: '2026-08-13T09:12:05Z',
      instrument: INSTRUMENT,
      items: [
        item('synthetic-helpful-report-immediate-post-item-primary-affect', 'primary-affect', 4, scale5('very negative', 'very positive'), 'affect'),
        item('synthetic-helpful-report-immediate-post-item-focus', 'focus', 4, scale5('scattered', 'highly focused'), 'focus'),
        item('synthetic-helpful-report-immediate-post-item-sleepiness', 'sleepiness', 2, scale5('alert', 'very drowsy'), 'sleepiness'),
        item('synthetic-helpful-report-immediate-post-item-subjective-quality', 'subjective-quality', 4, scale5('poor', 'excellent'), 'quality'),
        item('synthetic-helpful-report-immediate-post-item-perceived-helpfulness', 'perceived-helpfulness', 4, scale5('not at all', 'a great deal'), 'helpfulness'),
        item('synthetic-helpful-report-immediate-post-item-goal-achieved', 'goal-achieved', true, { kind: 'boolean' }, 'goal'),
      ],
      unwantedExperiences: { responseState: 'none-reported' },
    },
  ],
  privacy: PRIVACY_SYNTHETIC,
}

// ── 2. Unhelpful, one unwanted experience, interrupted, with a follow-up ────
export const unhelpfulInterrupted = {
  model: 'bsc-lab-session-bundle-1',
  specification: specification('synthetic-interrupted-spec', {
    label: 'Synthetic interrupted session specification',
    breathingPeriodInitial: 4.5,
    disabledTracks: ['ambience-rain'],
  }),
  instance: {
    id: 'synthetic-interrupted',
    label: 'Synthetic session — interrupted, one unwanted experience',
    specificationId: 'synthetic-interrupted-spec',
    startedAt: '2026-08-13T14:00:00Z',
    endedAt: '2026-08-13T14:06:40Z',
    clockOriginSeconds: 3.25,
    clockSource: 'audio-context',
    actualDurationSeconds: 400,
    deliveredSeconds: 340,
    completionStatus: 'interrupted',
    deliveryModalities: ['auditory', 'visual'],
  },
  events: [
    { id: 'synthetic-interrupted-event-0000', type: 'session-open', offsetSeconds: 0 },
    { id: 'synthetic-interrupted-event-0001', type: 'playback-start', offsetSeconds: 0.3 },
    { id: 'synthetic-interrupted-event-0002', type: 'safety-clamp-applied', offsetSeconds: 45.2, detail: { clampedParameter: 'visual.blinkRateHz', requestedValue: 12, deliveredValue: 8 } },
    { id: 'synthetic-interrupted-event-0003', type: 'playback-pause', offsetSeconds: 190 },
    { id: 'synthetic-interrupted-event-0004', type: 'playback-resume', offsetSeconds: 250 },
    { id: 'synthetic-interrupted-event-0005', type: 'playback-stop', offsetSeconds: 399.5 },
    { id: 'synthetic-interrupted-event-0006', type: 'session-interrupt', offsetSeconds: 400 },
  ],
  reports: [
    {
      id: 'synthetic-interrupted-report-immediate-post',
      phase: 'immediate-post',
      collectedAt: '2026-08-13T14:07:45Z',
      instrument: INSTRUMENT,
      statedGoal: { responseState: 'declined' },
      items: [
        item('synthetic-interrupted-report-immediate-post-item-primary-affect', 'primary-affect', 2, scale5('very negative', 'very positive'), 'affect'),
        item('synthetic-interrupted-report-immediate-post-item-subjective-quality', 'subjective-quality', 2, scale5('poor', 'excellent'), 'quality'),
        item('synthetic-interrupted-report-immediate-post-item-perceived-helpfulness', 'perceived-helpfulness', 1, scale5('not at all', 'a great deal'), 'helpfulness'),
        {
          id: 'synthetic-interrupted-report-immediate-post-item-focus',
          role: 'focus',
          responseState: 'declined',
          value: null,
          prompt: { id: 'focus', text: PROMPTS.focus },
        },
      ],
      unwantedExperiences: {
        responseState: 'supplied',
        records: [
          {
            id: 'synthetic-interrupted-report-immediate-post-ue-00',
            category: 'eye-strain',
            participantReportedSeverity: 'mild',
            onsetPhase: 'during-session',
            onsetOffsetSeconds: 180,
            persistence: 'resolved-same-day',
            actionTaken: 'paused-session',
            resolution: 'improved',
            participantPerceivedRelatedness: 'possibly-related',
          },
        ],
      },
    },
    {
      id: 'synthetic-interrupted-report-follow-up',
      phase: 'follow-up',
      collectedAt: '2026-08-14T09:00:00Z',
      instrument: INSTRUMENT,
      items: [
        item('synthetic-interrupted-report-follow-up-item-primary-affect', 'primary-affect', 3, scale5('very negative', 'very positive'), 'affect'),
      ],
      unwantedExperiences: { responseState: 'none-reported' },
    },
  ],
  privacy: PRIVACY_SYNTHETIC,
}

// ── 3. During-session report, multiple experiences, declined and not-asked ──
export const multipleExperiences = {
  model: 'bsc-lab-session-bundle-1',
  specification: specification('synthetic-multiple-spec', {
    label: 'Synthetic multi-experience session specification',
    masterBrightness: 0.4,
    scheduledStart: '2026-08-13T20:00:00Z',
  }),
  instance: {
    id: 'synthetic-multiple',
    label: 'Synthetic session — during-session report and several unwanted experiences',
    specificationId: 'synthetic-multiple-spec',
    startedAt: '2026-08-13T20:00:00Z',
    endedAt: '2026-08-13T20:10:05Z',
    clockOriginSeconds: 0.75,
    clockSource: 'audio-context',
    actualDurationSeconds: 605,
    deliveredSeconds: 605,
    completionStatus: 'completed',
    deliveryModalities: ['auditory', 'visual'],
  },
  events: [
    { id: 'synthetic-multiple-event-0000', type: 'session-open', offsetSeconds: 0 },
    { id: 'synthetic-multiple-event-0001', type: 'playback-start', offsetSeconds: 0.25 },
    { id: 'synthetic-multiple-event-0002', type: 'engine-fallback', offsetSeconds: 1.1, detail: { fromEngine: 'audio-worklet-wasm', toEngine: 'audio-worklet', reason: 'WASM module unavailable' } },
    { id: 'synthetic-multiple-event-0003', type: 'report-collected', offsetSeconds: 300, detail: { reportId: 'synthetic-multiple-report-during-session' } },
    { id: 'synthetic-multiple-event-0004', type: 'session-complete', offsetSeconds: 605 },
  ],
  reports: [
    {
      id: 'synthetic-multiple-report-during-session',
      phase: 'during-session',
      collectedAt: '2026-08-13T20:05:00Z',
      collectedAtOffsetSeconds: 300,
      instrument: INSTRUMENT,
      items: [
        item('synthetic-multiple-report-during-session-item-primary-affect', 'primary-affect', 3, scale5('very negative', 'very positive'), 'affect'),
      ],
      unwantedExperiences: { responseState: 'not-asked' },
    },
    {
      id: 'synthetic-multiple-report-immediate-post',
      phase: 'immediate-post',
      collectedAt: '2026-08-13T20:11:10Z',
      instrument: INSTRUMENT,
      statedGoal: { responseState: 'not-asked' },
      items: [
        item('synthetic-multiple-report-immediate-post-item-primary-affect', 'primary-affect', 3, scale5('very negative', 'very positive'), 'affect'),
        {
          id: 'synthetic-multiple-report-immediate-post-item-sleepiness',
          role: 'sleepiness',
          responseState: 'not-asked',
          value: null,
        },
        {
          id: 'synthetic-multiple-report-immediate-post-item-perceived-helpfulness',
          role: 'perceived-helpfulness',
          responseState: 'unknown',
          value: null,
        },
      ],
      unwantedExperiences: {
        responseState: 'supplied',
        records: [
          {
            id: 'synthetic-multiple-report-immediate-post-ue-00',
            category: 'head-sensation',
            participantReportedSeverity: 'mild',
            onsetPhase: 'during-session',
            persistence: 'resolved-during-session',
            actionTaken: 'reduced-intensity',
            resolution: 'resolved',
            participantPerceivedRelatedness: 'possibly-related',
          },
          {
            id: 'synthetic-multiple-report-immediate-post-ue-01',
            category: 'restlessness',
            participantReportedSeverity: 'moderate',
            onsetPhase: 'during-session',
            persistence: 'ongoing',
            actionTaken: 'none',
            resolution: 'unchanged',
            participantPerceivedRelatedness: 'unknown',
          },
          {
            id: 'synthetic-multiple-report-immediate-post-ue-02',
            category: 'sleep-disruption',
            participantReportedSeverity: 'declined',
            onsetPhase: 'next-day',
            persistence: 'unknown',
            actionTaken: 'declined',
            resolution: 'unknown',
            participantPerceivedRelatedness: 'declined',
          },
        ],
      },
    },
  ],
  privacy: PRIVACY_SYNTHETIC,
}

// ── 4. Abandoned, everything declined or not asked ─────────────────────────
// The case that proves absence carries its reason: this session produced a
// report that says nothing, and says why, six different ways.
export const abandonedDeclined = {
  model: 'bsc-lab-session-bundle-1',
  specification: specification('synthetic-abandoned-spec', { label: 'Synthetic abandoned session specification' }),
  instance: {
    id: 'synthetic-abandoned',
    label: 'Synthetic session — abandoned, nothing reported',
    specificationId: 'synthetic-abandoned-spec',
    startedAt: '2026-08-13T07:00:00Z',
    endedAt: '2026-08-13T07:01:30Z',
    clockOriginSeconds: 0,
    clockSource: 'silent-monotonic',
    actualDurationSeconds: 90,
    deliveredSeconds: 90,
    completionStatus: 'abandoned',
  },
  events: [
    { id: 'synthetic-abandoned-event-0000', type: 'session-open', offsetSeconds: 0 },
    { id: 'synthetic-abandoned-event-0001', type: 'playback-start', offsetSeconds: 0.2 },
    { id: 'synthetic-abandoned-event-0002', type: 'playback-stop', offsetSeconds: 89.5 },
    { id: 'synthetic-abandoned-event-0003', type: 'session-interrupt', offsetSeconds: 90 },
  ],
  reports: [
    {
      id: 'synthetic-abandoned-report-immediate-post',
      phase: 'immediate-post',
      collectedAt: '2026-08-13T07:02:40Z',
      instrument: INSTRUMENT,
      statedGoal: { responseState: 'declined' },
      items: [
        { id: 'synthetic-abandoned-report-immediate-post-item-primary-affect', role: 'primary-affect', responseState: 'declined', value: null },
        { id: 'synthetic-abandoned-report-immediate-post-item-focus', role: 'focus', responseState: 'not-asked', value: null },
        { id: 'synthetic-abandoned-report-immediate-post-item-subjective-quality', role: 'subjective-quality', responseState: 'not-applicable', value: null },
        { id: 'synthetic-abandoned-report-immediate-post-item-perceived-helpfulness', role: 'perceived-helpfulness', responseState: 'not-applicable', value: null },
      ],
      unwantedExperiences: { responseState: 'declined' },
    },
  ],
  privacy: PRIVACY_SYNTHETIC,
}

export const GOLDEN_SESSIONS = {
  'helpful, no unwanted experience': helpfulNoUnwanted,
  'unhelpful, interrupted, one experience, follow-up': unhelpfulInterrupted,
  'during-session report, multiple experiences': multipleExperiences,
  'abandoned, everything declined or not asked': abandonedDeclined,
}

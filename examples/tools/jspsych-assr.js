// A 40 Hz auditory steady-state block in jsPsych, recorded as an SSTIM session.
//
// The tone is generated on jsPsych's own AudioContext, so the session's clock
// is the audio hardware's and the record can say so. Everything SSTIM-specific
// is the `session` calls. Load it from a page like this one, after a first
// trial the participant answers, so the browser allows audio:
//
//   <script src="https://unpkg.com/jspsych@8"></script>
//   <script src="https://unpkg.com/@jspsych/plugin-html-keyboard-response@2"></script>
//   <script type="importmap">{ "imports": {
//     "@sstim/core/session": "https://esm.sh/@sstim/core@0.2.0/session" } }</script>
//   <script type="module">
//     import { assrBlock } from './jspsych-assr.js'
//     const jsPsych = initJsPsych()
//     const block = assrBlock(jsPsych, jsPsychHtmlKeyboardResponse)
//     await jsPsych.run([{ type: jsPsychHtmlKeyboardResponse, stimulus: 'Press a key to start.' }, block.trial])
//     const file = new Blob([block.turtle()], { type: 'text/turtle' })
//     Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: 'assr-001.ttl' }).click()
//   </script>
//
// Validate what it wrote with `npx @sstim/core validate run.ttl --profile full`,
// or with the Python client, which also evaluates the SPARQL constraints.

import { Session } from '@sstim/core/session'

const DURATION = 60       // seconds; an SSTIM session plans 60 to 7200
const CARRIER_HZ = 1000
const RATE_HZ = 40
const VOLUME = 0.5

function startTone (ctx, at) {
  const carrier = ctx.createOscillator()
  const modulator = ctx.createOscillator()
  const depth = ctx.createGain()
  const envelope = ctx.createGain()
  const output = ctx.createGain()
  carrier.frequency.value = CARRIER_HZ
  modulator.frequency.value = RATE_HZ
  depth.gain.value = 0.5       // envelope gain swings 0.5 ± 0.5: full depth
  envelope.gain.value = 0.5
  output.gain.value = VOLUME
  modulator.connect(depth).connect(envelope.gain)
  carrier.connect(envelope).connect(output).connect(ctx.destination)
  carrier.start(at)
  modulator.start(at)
  return (when) => { carrier.stop(when); modulator.stop(when) }
}

export function assrBlock (jsPsych, htmlKeyboardResponse) {
  const ctx = jsPsych.pluginAPI.audioContext()
  let session, stop, started
  const trial = {
    type: htmlKeyboardResponse,
    stimulus: '<p>Listen. Press Escape to stop early.</p>',
    choices: ['Escape'],
    trial_duration: DURATION * 1000,
    on_start () {
      ctx.resume()
      session = new Session('https://example.org/lab/assr-001/', {   // your namespace
        label: '40 Hz auditory steady-state block', duration: DURATION,
        masterVolume: VOLUME, timing: 'audio-hardware', clock: ctx.currentTime
      })
      const tone = session.signal({ hz: RATE_HZ, shape: 'sine' })
      session.channel('Tone, headphones', {
        modality: 'auditory', medium: 'air-conducted-sound', placement: 'ears',
        signal: tone, parameter: 'amplitude', mechanism: 'amplitude-modulation',
        carrierHz: CARRIER_HZ
      })
      started = ctx.currentTime
      stop = startTone(ctx, started)
      session.event('playback-start', { at: started })
    },
    on_finish (data) {
      const now = Math.max(ctx.currentTime, started)
      stop(now)
      session.close({ at: now, completed: data.response === null })
    }
  }
  return { trial, turtle: () => session.toTurtle() }
}

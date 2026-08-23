;; bsc-osc.wat — minimal WASM oscillator kernel for the WASM AudioWorklet engine.
;;
;; Compiled to bsc-osc.wasm with:  wat2wasm bsc-osc.wat -o bsc-osc.wasm
;; (regenerate after any edit; the .wasm is the artifact loaded at runtime).
;;
;; The host (bsc-voice-wasm.worklet.js) owns linear memory and lays it out as:
;;   bytes [0, 16384)  : 4096-entry Float32 sine lookup table, one full cycle,
;;                       index i holds sin(2*pi * i/4096).
;;   bytes [16384, ...) : scratch output blocks the host reads back per render
;;                        quantum (filled by render_osc).
;;
;; render_osc advances a normalized phase (cycles, in [0,1)) and writes one
;; band-limited-enough sine block via linear interpolation of the table. It
;; allocates nothing; the host calls it once per oscillator per process() block.
(module
  (import "env" "memory" (memory 1))

  ;; render_osc(outPtr, n, phase, inc) -> newPhase
  ;;   outPtr : byte offset of the Float32 output block
  ;;   n      : number of samples to write
  ;;   phase  : starting phase in cycles, [0,1)
  ;;   inc    : per-sample phase increment = frequency / sampleRate
  (func (export "render_osc")
        (param $outPtr i32) (param $n i32) (param $phase f32) (param $inc f32)
        (result f32)
    (local $i i32)
    (local $idxf f32)
    (local $idx i32)
    (local $frac f32)
    (local $a f32)
    (local $b f32)
    (block $done
      (loop $loop
        (br_if $done (i32.ge_s (local.get $i) (local.get $n)))

        ;; idxf = phase * 4096
        (local.set $idxf (f32.mul (local.get $phase) (f32.const 4096)))
        (local.set $idx (i32.trunc_f32_s (local.get $idxf)))
        (local.set $frac
          (f32.sub (local.get $idxf) (f32.convert_i32_s (local.get $idx))))

        ;; a = table[idx & 4095]
        (local.set $a
          (f32.load
            (i32.shl (i32.and (local.get $idx) (i32.const 4095)) (i32.const 2))))
        ;; b = table[(idx + 1) & 4095]
        (local.set $b
          (f32.load
            (i32.shl
              (i32.and (i32.add (local.get $idx) (i32.const 1)) (i32.const 4095))
              (i32.const 2))))

        ;; out[i] = a + (b - a) * frac
        (f32.store
          (i32.add (local.get $outPtr) (i32.shl (local.get $i) (i32.const 2)))
          (f32.add (local.get $a)
                   (f32.mul (f32.sub (local.get $b) (local.get $a))
                            (local.get $frac))))

        ;; phase += inc; phase -= floor(phase)   (wrap into [0,1))
        (local.set $phase (f32.add (local.get $phase) (local.get $inc)))
        (local.set $phase (f32.sub (local.get $phase) (f32.floor (local.get $phase))))

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)))
    (local.get $phase))
)

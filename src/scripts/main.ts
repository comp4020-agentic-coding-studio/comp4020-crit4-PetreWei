import { bendFactor, tiltGainFactor } from "./motion.ts";
import { freqForX, gainForY, hueForFreq } from "./range.ts";
// IDLE_READOUT isn't imported here: the served HTML now renders it, so the
// dashes shipped in the markup and the dashes the script writes back come from
// one constant without this file restating it.
import { formatHz } from "./readout.ts";

const stage = document.querySelector<HTMLElement>("#stage");
const hint = document.querySelector<HTMLElement>("#hint");
const infoToggle = document.querySelector<HTMLButtonElement>("#info-toggle");
const infoPanel = document.querySelector<HTMLElement>("#info-panel");

if (infoToggle && infoPanel) {
  infoToggle.addEventListener("click", () => {
    const open = infoPanel.hidden;
    infoPanel.hidden = !open;
    infoToggle.setAttribute("aria-expanded", String(open));
  });
}

if (stage) {
  instrument(stage);
}

// The whole instrument, given the one element it cannot work without. Taking
// `stage` as a parameter rather than closing over the narrowed `const` is what
// lets the body drop the non-null assertions: TypeScript does not carry a
// narrowing into a hoisted function declaration, and the two workarounds that
// used to paper over that --- an alias for one element, `!` for the other ---
// were the only reason to read this as two different problems.
function instrument(stage: HTMLElement): void {
  const RAMP_SECONDS = 0.05;

  let audioContext: AudioContext | null = null;

  interface Voice {
    oscillator: OscillatorNode;
    gain: GainNode;
    glow: HTMLElement;
    // Last pointer position, so a tilt can re-voice a note nobody is moving.
    x: number;
    y: number;
  }

  const voices = new Map<string, Voice>();

  function ensureAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
    return audioContext;
  }

  // --- Motion -------------------------------------------------------------
  // The mapping itself lives in ./motion.ts so it can be unit-tested; this is
  // only the plumbing. Nothing can sound before the stage has been touched,
  // and desktop fires no orientation events at all, so on desktop both factors
  // stay at 1 and the instrument is exactly as it was.

  let motionListening = false;
  let hasReference = false;
  let liveGamma = 0;
  let liveBeta = 0;
  let refGamma = 0;
  let refBeta = 0;

  // No ternary on hasReference: before any reading, live and ref are both 0,
  // and bendFactor(0, 0) and tiltGainFactor(0, 0) are each exactly 1 --- the
  // guard could only ever return the value it was guarding against.
  function currentBend(): number {
    return bendFactor(liveGamma, refGamma);
  }

  function currentTiltGain(): number {
    return tiltGainFactor(liveBeta, refBeta);
  }

  function handleOrientation(event: DeviceOrientationEvent): void {
    if (event.gamma === null || event.beta === null) return;
    liveGamma = event.gamma;
    liveBeta = event.beta;
    if (!hasReference) {
      hasReference = true;
      refGamma = liveGamma;
      refBeta = liveBeta;
    }
    for (const [id, voice] of voices) {
      updateVoice(id, voice.x, voice.y);
    }
  }

  function listenForMotion(): void {
    if (motionListening || !("DeviceOrientationEvent" in window)) return;
    motionListening = true;
    window.addEventListener("deviceorientation", handleOrientation);
  }

  // iOS only hands out orientation from inside a user gesture, so the ask rides
  // on the first touch instead of a button: there is still nothing to read
  // before you play, and refusing it costs only the tilt.
  function requestMotion(): void {
    if (motionListening || !("DeviceOrientationEvent" in window)) return;
    const request = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<PermissionState | string>;
      }
    ).requestPermission;
    if (typeof request !== "function") {
      listenForMotion();
      return;
    }
    void request
      .call(DeviceOrientationEvent)
      .then((state) => {
        if (state === "granted") listenForMotion();
      })
      .catch(() => {
        /* Denied or unavailable: touch and keyboard still play it in full. */
      });
  }

  // The cabinet's frequency meter. Whichever voice moved last owns the
  // reading, which with several fingers down is the one you are paying
  // attention to.
  const meterValue = document.querySelector<HTMLElement>("#meter-value");

  function showFrequency(freq: number | null): void {
    if (!meterValue) return;
    meterValue.textContent = formatHz(freq);
    if (freq === null) {
      delete meterValue.dataset.live;
    } else {
      meterValue.dataset.live = "true";
    }
  }

  function startVoice(id: string, x: number, y: number): void {
    // However the phone is being held as the first note starts is "centre".
    // Needs no "has a reading arrived yet" guard: before the first one, live
    // and ref are both 0, so this assignment is 0 = 0, and handleOrientation
    // adopts the first reading it sees anyway.
    if (voices.size === 0) {
      refGamma = liveGamma;
      refBeta = liveBeta;
    }
    const ctx = ensureAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    const rect = stage.getBoundingClientRect();
    const freq = freqForX(x - rect.left, rect.width);
    oscillator.frequency.value = freq;
    gain.gain.value = 0;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    // No gain set here: updateVoice runs before this function returns and sets
    // it with the tilt factor applied. Setting it twice only meant computing a
    // value that was overwritten on the next line.

    const glow = document.createElement("div");
    glow.className = "glow";
    stage.appendChild(glow);

    voices.set(id, { oscillator, gain, glow, x, y });
    updateVoice(id, x, y);
    // Idempotent, so it needs no "have we sounded yet" flag beside it.
    hint?.setAttribute("data-faded", "true");
  }

  function updateVoice(id: string, x: number, y: number): void {
    const voice = voices.get(id);
    if (!voice || !audioContext) return;
    voice.x = x;
    voice.y = y;
    const rect = stage.getBoundingClientRect();
    const localX = x - rect.left;
    const localY = y - rect.top;
    const freq = freqForX(localX, rect.width) * currentBend();
    const gainValue = gainForY(localY, rect.height) * currentTiltGain();
    voice.oscillator.frequency.setTargetAtTime(freq, audioContext.currentTime, RAMP_SECONDS);
    voice.gain.gain.setTargetAtTime(gainValue, audioContext.currentTime, RAMP_SECONDS);

    voice.glow.style.left = `${localX}px`;
    voice.glow.style.top = `${localY}px`;
    voice.glow.style.setProperty("--hue", `${hueForFreq(freq)}`);
    voice.glow.style.setProperty("--glow-size", `${40 + gainValue * 300}px`);

    showFrequency(freq);
  }

  function stopVoice(id: string): void {
    const voice = voices.get(id);
    if (!voice || !audioContext) return;
    const ctx = audioContext;
    voice.gain.gain.setTargetAtTime(0, ctx.currentTime, RAMP_SECONDS);
    voice.oscillator.stop(ctx.currentTime + RAMP_SECONDS * 6);
    voice.oscillator.addEventListener("ended", () => {
      voice.oscillator.disconnect();
      voice.gain.disconnect();
      voice.glow.remove();
    });
    voices.delete(id);
    // Nothing sounding, nothing to report — dashes, not the last number.
    if (voices.size === 0) showFrequency(null);
  }

  stage.addEventListener("pointerdown", (event) => {
    stage.setPointerCapture(event.pointerId);
    requestMotion();
    startVoice(`pointer-${event.pointerId}`, event.clientX, event.clientY);
  });

  stage.addEventListener("pointermove", (event) => {
    updateVoice(`pointer-${event.pointerId}`, event.clientX, event.clientY);
  });

  function endPointer(event: PointerEvent): void {
    stopVoice(`pointer-${event.pointerId}`);
  }

  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  // Keyboard: arrow keys move a virtual hand and sustain a note while any of
  // them is held, so the instrument is playable without a pointer at all.
  const KEYBOARD_ID = "keyboard";
  const heldArrowKeys = new Set<string>();
  // One table: which keys play, and how far each moves the virtual hand. The
  // membership test and the four directions used to be separate structures
  // that had to agree.
  const ARROW_STEPS: Record<string, readonly [number, number]> = {
    ArrowLeft: [-24, 0],
    ArrowRight: [24, 0],
    ArrowUp: [0, -24],
    ArrowDown: [0, 24],
  };
  let keyboardX = 0;
  let keyboardY = 0;

  stage.addEventListener("keydown", (event) => {
    const step = ARROW_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    if (heldArrowKeys.size === 0) {
      keyboardX = rect.left + rect.width / 2;
      keyboardY = rect.top + rect.height / 2;
    }
    heldArrowKeys.add(event.key);
    keyboardX += step[0];
    keyboardY += step[1];
    keyboardX = Math.min(Math.max(keyboardX, rect.left), rect.right);
    keyboardY = Math.min(Math.max(keyboardY, rect.top), rect.bottom);

    if (!voices.has(KEYBOARD_ID)) {
      startVoice(KEYBOARD_ID, keyboardX, keyboardY);
    } else {
      updateVoice(KEYBOARD_ID, keyboardX, keyboardY);
    }
  });

  stage.addEventListener("keyup", (event) => {
    if (!(event.key in ARROW_STEPS)) return;
    heldArrowKeys.delete(event.key);
    if (heldArrowKeys.size === 0) {
      stopVoice(KEYBOARD_ID);
    }
  });

  stage.addEventListener("blur", () => {
    heldArrowKeys.clear();
    stopVoice(KEYBOARD_ID);
  });
}

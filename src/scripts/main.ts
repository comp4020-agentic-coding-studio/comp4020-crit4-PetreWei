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

if (stage && hint) {
  const hintEl = hint;
  const MIN_FREQ = 110;
  const MAX_FREQ = 880;
  const MIN_GAIN = 0.0001;
  const MAX_GAIN = 0.3;
  const RAMP_SECONDS = 0.05;

  let audioContext: AudioContext | null = null;
  let hasSounded = false;

  interface Voice {
    oscillator: OscillatorNode;
    gain: GainNode;
    glow: HTMLElement;
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

  function freqForX(x: number, width: number): number {
    const ratio = Math.min(Math.max(x / width, 0), 1);
    return MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** ratio;
  }

  function gainForY(y: number, height: number): number {
    const ratio = Math.min(Math.max(1 - y / height, 0), 1);
    return MIN_GAIN + ratio * (MAX_GAIN - MIN_GAIN);
  }

  // Warm valve-glow, deep red up to lamp yellow: a rainbow sweep reads as a
  // modern colour picker, which fights the cabinet the instrument sits in.
  function hueForFreq(freq: number): number {
    const ratio = Math.log(freq / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ);
    return 6 + ratio * 46;
  }

  function markSounded(): void {
    if (!hasSounded) {
      hasSounded = true;
      hintEl.dataset.faded = "true";
    }
  }

  function startVoice(id: string, x: number, y: number): void {
    const ctx = ensureAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    const rect = stage!.getBoundingClientRect();
    const freq = freqForX(x - rect.left, rect.width);
    oscillator.frequency.value = freq;
    gain.gain.value = 0;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    gain.gain.setTargetAtTime(gainForY(y - rect.top, rect.height), ctx.currentTime, RAMP_SECONDS);

    const glow = document.createElement("div");
    glow.className = "glow";
    stage!.appendChild(glow);

    voices.set(id, { oscillator, gain, glow });
    updateVoice(id, x, y);
    markSounded();
  }

  function updateVoice(id: string, x: number, y: number): void {
    const voice = voices.get(id);
    if (!voice || !audioContext) return;
    const rect = stage!.getBoundingClientRect();
    const localX = x - rect.left;
    const localY = y - rect.top;
    const freq = freqForX(localX, rect.width);
    const gainValue = gainForY(localY, rect.height);
    voice.oscillator.frequency.setTargetAtTime(freq, audioContext.currentTime, RAMP_SECONDS);
    voice.gain.gain.setTargetAtTime(gainValue, audioContext.currentTime, RAMP_SECONDS);

    voice.glow.style.left = `${localX}px`;
    voice.glow.style.top = `${localY}px`;
    voice.glow.style.setProperty("--hue", `${hueForFreq(freq)}`);
    voice.glow.style.setProperty("--glow-size", `${40 + gainValue * 300}px`);
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
  }

  stage.addEventListener("pointerdown", (event) => {
    stage.setPointerCapture(event.pointerId);
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
  const ARROW_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  let keyboardX = 0;
  let keyboardY = 0;

  stage.addEventListener("keydown", (event) => {
    if (!ARROW_KEYS.includes(event.key)) return;
    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    if (heldArrowKeys.size === 0) {
      keyboardX = rect.left + rect.width / 2;
      keyboardY = rect.top + rect.height / 2;
    }
    heldArrowKeys.add(event.key);
    const step = 24;
    if (event.key === "ArrowLeft") keyboardX -= step;
    if (event.key === "ArrowRight") keyboardX += step;
    if (event.key === "ArrowUp") keyboardY -= step;
    if (event.key === "ArrowDown") keyboardY += step;
    keyboardX = Math.min(Math.max(keyboardX, rect.left), rect.right);
    keyboardY = Math.min(Math.max(keyboardY, rect.top), rect.bottom);

    if (!voices.has(KEYBOARD_ID)) {
      startVoice(KEYBOARD_ID, keyboardX, keyboardY);
    } else {
      updateVoice(KEYBOARD_ID, keyboardX, keyboardY);
    }
  });

  stage.addEventListener("keyup", (event) => {
    if (!ARROW_KEYS.includes(event.key)) return;
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

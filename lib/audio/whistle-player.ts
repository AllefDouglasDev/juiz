// Web Audio whistle player. Uses HTMLAudioElement-free playback so mobile
// browsers give us instant, overlappable sounds, and a gain + compressor
// chain pushes loudness to the ceiling without harsh clipping. The real
// ceiling is always the device's physical volume.
//
// Source (CC0, freesound.org): long = #218318.

export type WhistleType = "long";

type BufferName = "long";

const SOUND_URLS: Record<BufferName, string> = {
  long: "/sounds/whistle-long.mp3",
};

let context: AudioContext | null = null;
let output: AudioNode | null = null;
const buffers = new Map<BufferName, AudioBuffer>();
let loadPromise: Promise<void> | null = null;

function getContext(): AudioContext {
  if (!context) {
    context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = 2.5;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 6;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.001;
    compressor.release.value = 0.1;
    gain.connect(compressor);
    compressor.connect(context.destination);
    output = gain;
  }
  return context;
}

function loadBuffers(ctx: AudioContext): Promise<void> {
  const names = Object.keys(SOUND_URLS) as BufferName[];
  return Promise.all(
    names.map(async (name) => {
      if (buffers.has(name)) return;
      const response = await fetch(SOUND_URLS[name]);
      if (!response.ok) throw new Error(`Failed to load ${SOUND_URLS[name]}`);
      const data = await response.arrayBuffer();
      buffers.set(name, await ctx.decodeAudioData(data));
    })
  ).then(() => undefined);
}

// Call from (or right after) a user gesture: resumes the AudioContext —
// required by mobile autoplay policies — and preloads/decodes the sounds.
export function initWhistlePlayer(): void {
  if (typeof window === "undefined") return;
  const ctx = getContext();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  loadPromise ??= loadBuffers(ctx).catch(() => {
    loadPromise = null; // allow retry on the next tap
  });
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, delayS = 0): void {
  if (!output) return;
  // A fresh BufferSource per play — sources are one-shot, and this allows
  // rapid re-taps to overlap.
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(output);
  source.start(ctx.currentTime + delayS);
}

// Last-resort synthesized whistle (two detuned oscillators) so the referee
// is never left silent if the audio files fail to load (e.g. offline
// before the first visit cached them).
function playSynthWhistle(ctx: AudioContext, durationS: number, delayS = 0): void {
  if (!output) return;
  const start = ctx.currentTime + delayS;
  const end = start + durationS;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(1, start + 0.02);
  envelope.gain.setValueAtTime(1, end - 0.05);
  envelope.gain.linearRampToValueAtTime(0, end);
  envelope.connect(output);
  for (const frequency of [2100, 2180]) {
    const oscillator = ctx.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    oscillator.connect(envelope);
    oscillator.start(start);
    oscillator.stop(end);
  }
}

export function playWhistle(type: WhistleType): void {
  if (typeof window === "undefined") return;
  initWhistlePlayer();
  const ctx = getContext();

  const play = () => {
    const long = buffers.get("long");
    switch (type) {
      case "long":
        if (long) playBuffer(ctx, long);
        else playSynthWhistle(ctx, 1.5);
        break;
    }
  };

  if (loadPromise) {
    void loadPromise.then(play);
  } else {
    play();
  }
}

export type WhistleType = "short" | "double" | "long";

// TODO(Phase 5): real Web Audio implementation — preloaded whistle buffers,
// GainNode + compressor for maximum loudness.
export function playWhistle(type: WhistleType): void {
  console.debug(`[whistle stub] ${type}`);
}

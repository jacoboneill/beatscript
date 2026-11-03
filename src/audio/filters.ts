export const FREQ_MIN = 20;
export const FREQ_MAX = 20_000;

function cutoff(n: number) {
	return FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** n;
}

export function hpf(ctx: AudioContext, n: number): BiquadFilterNode {
	return new BiquadFilterNode(ctx, { type: "highpass", frequency: cutoff(n) });
}

export function lpf(ctx: AudioContext, n: number): BiquadFilterNode {
	return new BiquadFilterNode(ctx, { type: "lowpass", frequency: cutoff(n) });
}

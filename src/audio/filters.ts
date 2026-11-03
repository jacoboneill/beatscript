import { type ADSR, envelope } from "./envelope";

const MIN = 20;
const MAX = 20_000;
const RANGE_CENTS = 1200 * Math.log2(MAX / MIN);

function cutoff(n: number) {
	if (n < 0 || n > 1) {
		throw new RangeError("percentage must be between 0 and 1");
	}

	return MIN * (MAX / MIN) ** n;
}

export function hpf(ctx: AudioContext, n: number): BiquadFilterNode {
	return new BiquadFilterNode(ctx, { type: "highpass", frequency: cutoff(n) });
}

export function lpf(ctx: AudioContext, n: number): BiquadFilterNode {
	return new BiquadFilterNode(ctx, { type: "lowpass", frequency: cutoff(n) });
}

export type FilterEnv = ADSR | { adsr: ADSR; amount: number };
export function filter_env(
	filter: BiquadFilterNode,
	n: number,
	env: FilterEnv,
	time: number,
	duration: number,
): number {
	const { adsr, amount } = Array.isArray(env) ? { adsr: env, amount: 1 } : env;
	const peak = amount * (1 - n) * RANGE_CENTS;
	return envelope(filter.detune, adsr, 0, peak, time, duration);
}

import { FREQ_MAX, FREQ_MIN } from "./filters";

const RANGE_CENTS = 1200 * Math.log2(FREQ_MAX / FREQ_MIN);

export type ADSR = [
	attack: number,
	decay: number,
	sustain: number,
	release: number,
];

export function envelope(
	param: AudioParam,
	[a, d, s, r]: ADSR,
	from: number,
	peak: number,
	time: number,
	duration: number,
): number {
	const sustain = from + (peak - from) * s;
	const end = time + Math.max(duration, a);

	param.setValueAtTime(from, time);
	param.linearRampToValueAtTime(peak, time + a);
	param.setTargetAtTime(sustain, time + a, d / 4);
	param.setTargetAtTime(from, end, r / 4);
	return end + r;
}

export type FilterEnvelope = ADSR | { adsr: ADSR; amount: number };
export function filterEnvelope(
	filter: BiquadFilterNode,
	n: number,
	env: FilterEnvelope,
	time: number,
	duration: number,
): number {
	const { adsr, amount } = Array.isArray(env) ? { adsr: env, amount: 1 } : env;
	const peak = amount * (1 - n) * RANGE_CENTS;
	return envelope(filter.detune, adsr, 0, peak, time, duration);
}

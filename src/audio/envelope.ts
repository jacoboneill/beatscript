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

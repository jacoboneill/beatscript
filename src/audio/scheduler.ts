const BEATSPERBAR = 4; // numerator of time signature, assumed 4/4
const LOOKAHEAD = 0.1; // seconds
const MARGIN = 0.05; // seconds
const INTERVAL = 25; // milliseconds

export type Schedule = (
	from: number,
	to: number,
	timeOf: (bar: number) => number,
) => void;

export type Scheduler = {
	start: () => void;
	stop: () => void;
	position: () => number;
};

export function createScheduler(
	ctx: AudioContext,
	bpm: number,
	schedule: Schedule,
): Scheduler {
	const barLength = (BEATSPERBAR * 60) / bpm;
	let origin = 0;
	let scheduled = 0;
	let timer: number | undefined;

	const timeOf = (bar: number) => origin + bar * barLength;
	const barAt = (time: number) => (time - origin) / barLength;

	function tick() {
		const to = barAt(ctx.currentTime + LOOKAHEAD);
		if (to <= scheduled) return;
		schedule(scheduled, to, timeOf);
		scheduled = to;
	}

	return {
		start() {
			if (timer !== undefined) return;
			origin = ctx.currentTime + MARGIN;
			scheduled = 0;
			tick();
			timer = setInterval(tick, INTERVAL);
		},
		stop() {
			clearInterval(timer);
			timer = undefined;
		},
		position: () => barAt(ctx.currentTime),
	};
}

import { startEngine } from "./audio/engine";
import { createScheduler, type Scheduler } from "./audio/scheduler";
import { Synthesiser } from "./audio/synth";
import { type Controller, Sequencer } from "./controllers/sequencer";

// what the user's code asked for when it ran
type Program = { bpm: number; controllers: Controller[] } | "stop" | undefined;

let scheduler: Scheduler | undefined;
let bpm = 0;
let current: Controller[] = [];
let pending: { controllers: Controller[]; at: number } | undefined;
let booked = 0; // bars handed to controllers so far

// Run the user's code without touching what's playing, so an error keeps the
// last working version going
function evaluate(code: string): Program {
	let program: Program;

	const play = (bpm: number, ...controllers: Controller[]) => {
		if (!(bpm > 0) || !Number.isFinite(bpm)) {
			throw new RangeError(`bpm must be more than 0: (${bpm})`);
		}
		program = { bpm, controllers };
	};
	const stop = () => {
		program = "stop";
	};

	new Function("Sequencer", "Synthesiser", "play", "stop", code)(
		Sequencer,
		Synthesiser,
		play,
		stop,
	);
	return program;
}

// throw any error in the user's code, without playing or stopping anything
export function check(code: string): void {
	evaluate(code);
}

export async function run(code: string): Promise<void> {
	const program = evaluate(code);
	if (program === undefined) return;
	if (program === "stop") {
		stop();
		return;
	}

	// already playing at this tempo, swap in at the next bar
	if (scheduler !== undefined && program.bpm === bpm) {
		pending = { controllers: program.controllers, at: Math.ceil(booked) };
		return;
	}

	// otherwise start fresh
	stop();
	const { ctx, master } = await startEngine();
	bpm = program.bpm;
	current = program.controllers;
	booked = 0;

	scheduler = createScheduler(ctx, bpm, (from, to, timeOf) => {
		const book = (controllers: Controller[], from: number, to: number) => {
			for (const controller of controllers) {
				controller.schedule(ctx, master, from, to, timeOf);
			}
		};

		if (pending !== undefined && to > pending.at) {
			book(current, from, pending.at);
			from = Math.max(from, pending.at);
			current = pending.controllers;
			pending = undefined;
		}
		book(current, from, to);
		booked = to;
	});
	scheduler.start();
}

// notes already booked (up to the scheduler's lookahead) still play
export function stop(): void {
	scheduler?.stop();
	scheduler = undefined;
	pending = undefined;
	current = [];
}

export const isPlaying = () => scheduler !== undefined;

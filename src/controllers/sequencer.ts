import type { Patch } from "../audio/synth";
import { lex } from "../parser/lexer";
import { parse } from "../parser/parser";

export type Controller = {
	add: (patch: Patch) => Controller;
	schedule: (
		ctx: AudioContext,
		out: AudioNode,
		from: number,
		to: number,
		timeOf: (bar: number) => number,
	) => void;
};

export type SequencerOpts = {
	notes: string;
	step?: number; // bars
};

export function Sequencer(opts: SequencerOpts): Controller {
	const steps = parse(lex(opts.notes));
	if (steps.length === 0) {
		throw new Error("notes must have at least one note or rest");
	}

	const step = opts.step ?? 1 / 16;
	if (!(step > 0) || !Number.isFinite(step)) {
		throw new RangeError(`step must be more than 0: (${step})`);
	}

	const patches: Patch[] = [];

	const controller: Controller = {
		add(patch) {
			patches.push(patch);
			return controller;
		},

		// play every step that starts between from and to (in bars)
		schedule(ctx, out, from, to, timeOf) {
			for (let k = Math.ceil(from / step); k * step < to; k++) {
				const time = timeOf(k * step);
				const duration = timeOf((k + 1) * step) - time;

				for (const freq of steps[k % steps.length]) {
					for (const patch of patches) {
						patch.play(ctx, out, freq, time, duration);
					}
				}
			}
		},
	};

	return controller;
}

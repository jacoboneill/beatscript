import { type ADSR, envelope } from "../audio/modulators";
import type { CVSource, Patch } from "../audio/synth";
import { lex } from "../parser/lexer";
import { parse } from "../parser/parser";

// shape of the cv each note sends out: snap up to 1, fall back to 0
const CV_ENVELOPE: ADSR = [0.005, 0.25, 0, 0];

export type Controller = CVSource & {
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

	// a control voltage that jumps to 1 on every note, for sidechaining
	let cv: ConstantSourceNode | undefined;
	function cvSource(ctx: AudioContext): ConstantSourceNode {
		if (cv === undefined) {
			cv = new ConstantSourceNode(ctx, { offset: 0 });
			cv.start();
		}
		return cv;
	}

	const controller: Controller = {
		add(patch) {
			patches.push(patch);
			return controller;
		},

		cv: cvSource,

		// play every step that starts between from and to (in bars)
		schedule(ctx, out, from, to, timeOf) {
			for (let k = Math.ceil(from / step); k * step < to; k++) {
				const time = timeOf(k * step);
				const duration = timeOf((k + 1) * step) - time;
				const freqs = steps[k % steps.length];

				if (freqs.length > 0) {
					envelope(cvSource(ctx).offset, CV_ENVELOPE, 0, 1, time, duration);
				}

				for (const freq of freqs) {
					for (const patch of patches) {
						patch.play(ctx, out, freq, time, duration);
					}
				}
			}
		},
	};

	return controller;
}

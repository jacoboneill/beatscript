import { hpf, lpf } from "./filters";
import {
	type ADSR,
	ampEnvelope,
	type FilterEnvelope,
	filterEnvelope,
	type PitchEnvelope,
	pitchEnvelope,
} from "./modulators";

export type SoundFn = (
	ctx: AudioContext,
	freq: number,
	out: AudioNode,
) => OscillatorNode[];

function sine(
	ctx: AudioContext,
	freq: number,
	out: AudioNode,
): OscillatorNode[] {
	const osc = new OscillatorNode(ctx, { type: "sine", frequency: freq });
	osc.connect(out);
	return [osc];
}

function supersaw(
	ctx: AudioContext,
	freq: number,
	out: AudioNode,
): OscillatorNode[] {
	const VOICES = 7;
	const SPREAD = 10; // cents
	const PAN = 0.4;

	const mix = new GainNode(ctx, { gain: 1 / Math.sqrt(VOICES) });
	mix.connect(out);

	return Array.from({ length: VOICES }, (_, i) => {
		const spread = (i / (VOICES - 1)) * 2 - 1; // -1 to 1
		const osc = new OscillatorNode(ctx, {
			type: "sawtooth",
			frequency: freq,
			detune: spread * SPREAD,
		});

		const pan = new StereoPannerNode(ctx, { pan: (i % 2 ? 1 : -1) * PAN });
		osc.connect(pan).connect(mix);
		return osc;
	});
}

const sounds = { sine, supersaw } satisfies Record<string, SoundFn>;
export type Sound = keyof typeof sounds;

function oscillators(
	ctx: AudioContext,
	sound: Sound,
	freq: number,
	out: AudioNode,
) {
	return sounds[sound](ctx, freq, out);
}

export type SynthOpts = {
	sound: Sound;
	pitchEnvelope?: PitchEnvelope;
	hpf?: number;
	lpf?: number;
	filterEnvelope?: FilterEnvelope;
	ampEnvelope?: ADSR;
	postGain?: number;
};

export type Patch = {
	play: (
		ctx: AudioContext,
		out: AudioNode,
		freq: number,
		time: number,
		duration: number,
	) => void;
};

function checkRange(
	name: string,
	value: number | undefined,
	min: number,
	max: number,
) {
	if (value !== undefined && (value < min || value > max)) {
		throw new RangeError(
			`${name} must be between ${min} and ${max}: (${value})`,
		);
	}
}

export function Synthesiser(opts: SynthOpts): Patch {
	checkRange(
		"pitchEnvelope's semitones",
		opts.pitchEnvelope?.semitones,
		-48,
		48,
	);
	checkRange("hpf", opts.hpf, 0, 1);
	checkRange("lpf", opts.lpf, 0, 1);
	checkRange("postGain", opts.postGain, 0, 1);

	if (
		opts.filterEnvelope !== undefined &&
		!Array.isArray(opts.filterEnvelope) &&
		(opts.filterEnvelope.amount < 0 || opts.filterEnvelope.amount > 1)
	) {
		throw new RangeError(
			`filterEnvelope's amount must be between 0 and 1: (${opts.filterEnvelope.amount})`,
		);
	}

	return {
		play(ctx, out, freq, time, duration) {
			const input = new GainNode(ctx);

			/*
			 * Add FX
			 *
			 *      input -> hpf -------> lpf ----------> amp (VCA) -> post gain -> out
			 *        ↑                    ↑                 ↑
			 *   pitch envelope      filter envelope    amp envelope
			 */

			const highPassFilter =
				opts.hpf !== undefined ? hpf(ctx, opts.hpf) : undefined;

			let lowPassFilter: BiquadFilterNode | undefined;
			if (opts.lpf !== undefined) {
				lowPassFilter = lpf(ctx, opts.lpf);
				if (opts.filterEnvelope !== undefined) {
					filterEnvelope(
						lowPassFilter,
						opts.lpf,
						opts.filterEnvelope,
						time,
						duration,
					);
				}
			}

			// Amp Envelope is the only non-optional effect in the chain, to stop clicking
			const amp = new GainNode(ctx);
			const end = ampEnvelope(
				amp,
				opts.ampEnvelope ?? [0.01, 0, 1, 0.05],
				time,
				duration,
			);

			let postGain: GainNode | undefined;
			if (opts.postGain !== undefined) {
				postGain = new GainNode(ctx, { gain: opts.postGain });
			}

			const signalPath: (AudioNode | undefined)[] = [
				input,
				highPassFilter,
				lowPassFilter,
				amp,
				postGain,
				out,
			];
			let signalChain: AudioNode = input;
			for (const node of signalPath.slice(1)) {
				if (node) signalChain = signalChain.connect(node);
			}

			// Start Playing Oscillators
			const oscs = oscillators(ctx, opts.sound, freq, input);
			for (const osc of oscs) {
				if (opts.pitchEnvelope !== undefined) {
					pitchEnvelope(osc, opts.pitchEnvelope, time, duration);
				}
				osc.start(time);
				osc.stop(end);
			}

			oscs[0].onended = () => {
				for (const node of signalPath.slice(0, -1)) {
					if (node !== undefined) node.disconnect();
				}
				for (const osc of oscs) {
					osc.disconnect();
				}
			};
		},
	};
}

import { type FilterEnv, filter_env, hpf, lpf } from "./filters";

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
	lpf?: number;
	hpf?: number;
	filterEnv?: FilterEnv;
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

export function Synthesiser(opts: SynthOpts): Patch {
	return {
		play(ctx, out, freq, time, duration) {
			const mix = new GainNode(ctx);

			// Add FX
			const highPassFilter =
				opts.hpf !== undefined ? hpf(ctx, opts.hpf) : undefined;

			const lowPassFilter = lpf(ctx, opts.lpf ?? 1);

			if (opts.filterEnv !== undefined) {
				filter_env(
					lowPassFilter,
					opts.lpf ?? 1,
					opts.filterEnv,
					time,
					duration,
				);
			}

			let chain: AudioNode = mix;
			for (const i of [highPassFilter, lowPassFilter, out]) {
				if (i) chain = chain.connect(i);
			}

			// Start Playing Oscillators
			const oscs = oscillators(ctx, opts.sound, freq, mix);
			for (const osc of oscs) {
				osc.start(time);
				osc.stop(time + duration);
			}
		},
	};
}

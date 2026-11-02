export type Engine = {
	ctx: AudioContext;
	master: GainNode;
};

let engine: Engine | undefined;

export async function startEngine(): Promise<Engine> {
	if (!engine) {
		const ctx = new AudioContext();

		const master = ctx.createGain();
		master.gain.value = 0.8;

		const limiter = ctx.createDynamicsCompressor();
		limiter.threshold.value = -3;
		limiter.knee.value = 0;
		limiter.ratio.value = 20;
		limiter.attack.value = 0.001;
		limiter.release.value = 0.1;

		master.connect(limiter).connect(ctx.destination);

		engine = { ctx, master };
	}

	if (engine.ctx.state === "suspended") {
		await engine.ctx.resume();
	}

	return engine;
}

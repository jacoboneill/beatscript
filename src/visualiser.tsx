import AudioMotionAnalyzer from "audiomotion-analyzer";
import { useEffect, useRef } from "preact/hooks";
import type { Engine } from "./audio/engine";

type VisualiserProps = {
	// undefined until the first play, the AudioContext can't exist before then
	engine: Engine | undefined;
};

export function Visualiser({ engine }: VisualiserProps) {
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = container.current;
		if (el === null || engine === undefined) return;

		// listen to master, connectSpeakers: false or it plays everything twice
		const analyser = new AudioMotionAnalyzer(el, {
			audioCtx: engine.ctx,
			source: engine.master,
			connectSpeakers: false,
			mode: 2, // 1/12 octave bands
			frequencyScale: "log",
			minFreq: 30,
			maxFreq: 16000,
			smoothing: 0.7,
			roundBars: true,
			barSpace: 0.25,
			showScaleX: true, // frequency labels along the bottom
			// transparent, so the CSS background shows through
			overlay: true,
			showBgColor: false,
		});

		return () => analyser.destroy();
	}, [engine]);

	// audiomotion sizes itself from the inner div, padding goes on the outer one
	return (
		<div class="visualiser">
			<div ref={container} class="visualiser-inner" />
		</div>
	);
}

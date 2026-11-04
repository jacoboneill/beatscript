import { useEffect, useRef, useState } from "preact/hooks";
import { type Engine, startEngine } from "./audio/engine";
import { Editor } from "./editor";
import { PlayButton } from "./play-button";
import { isPlaying, run, stop } from "./runtime";
import { Visualiser } from "./visualiser";

// starting code, until it's saved between visits (#16)
const EXAMPLE = `const kick = Sequencer({
  notes: "c1",
  step: 1 / 4,
}).add(
  Synthesiser({
    sound: "sine",
    pitchEnvelope: { adsr: [0, 0.08, 0.05, 0], semitones: 36 },
    ampEnvelope: [0, 0.3, 0, 0.05],
  }),
);

// duck by 0.4 on every kick
const sidechained = { value: 0.8, sidechain: { source: kick, amount: 0.4 } };

const synthConfig = {
  sound: "supersaw",
  ampEnvelope: [0.01, 8.5, 0.1, 0.03],
  postGain: sidechained,
};

const arp = Sequencer({
  notes: "[b3 g3 e3]!16 [a3 g3 e3]!16 [a3 g3 d3]!16 [a3 f#3 d3]!16",
  step: 1 / 16,
}).add(Synthesiser({ ...synthConfig, lpf: 0.5 }));

// "~ [b2,e2] ~ [b2,e2] ~ [b2,e2] ~ [b2,e2]", one bar of off-beats
const offbeat = (chord) => ("~ " + chord + " ").repeat(4);

const bass = Sequencer({
  notes:
    offbeat("[b2,e2]") + offbeat("[a2,e2]") + offbeat("[a2,d2]") + offbeat("[a2,d2]"),
  step: 1 / 8,
}).add(
  Synthesiser({
    ...synthConfig,
    hpf: 0.2,
    lpf: 0.3,
    filterEnvelope: { adsr: [0.01, 0.2, 0.1, 0.03], amount: 0.4 },
    ampEnvelope: [0.01, 0.2, 0.6, 0.03],
  }),
);

play(120, arp, bass, kick);
`;

export function App() {
	const code = useRef(EXAMPLE);
	const [error, setError] = useState<string | undefined>(undefined);
	const [playing, setPlaying] = useState(false);
	const [engine, setEngine] = useState<Engine | undefined>(undefined);

	const apply = async () => {
		try {
			await run(code.current);
			setError(undefined);
		} catch (e) {
			setError(String(e));
		}
		setPlaying(isPlaying());

		// the engine only exists once something has played
		if (isPlaying()) setEngine(await startEngine());
	};

	const halt = () => {
		stop();
		setPlaying(false);
	};

	// Cmd/Ctrl+Enter toggles play/stop, Cmd/Ctrl+S applies while playing.
	// Capture phase, so the editor never sees them (no newline, no Save Page)
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (!(e.metaKey || e.ctrlKey)) return;

			if (e.key === "Enter") {
				e.preventDefault();
				e.stopPropagation();
				if (isPlaying()) {
					halt();
				} else {
					apply();
				}
			} else if (e.key === "s") {
				e.preventDefault();
				e.stopPropagation();
				if (isPlaying()) apply();
			}
		};

		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	});

	return (
		<>
			<PlayButton playing={playing} onClick={playing ? halt : apply} />
			<main class="workspace">
				<section class="code">
					{error && <pre class="error">{error}</pre>}
					<Editor
						initial={EXAMPLE}
						onChange={(next) => {
							code.current = next;
						}}
					/>
				</section>
				<Visualiser engine={engine} />
			</main>
		</>
	);
}

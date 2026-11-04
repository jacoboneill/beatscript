import { useState } from "preact/hooks";
import { isPlaying, run, stop } from "./runtime";

// Temporary #9 test page, a textarea until the editor (#10)
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
	const [code, setCode] = useState(EXAMPLE);
	const [error, setError] = useState<string | undefined>(undefined);
	const [playing, setPlaying] = useState(false);

	const apply = async () => {
		try {
			await run(code);
			setError(undefined);
		} catch (e) {
			setError(String(e));
		}
		setPlaying(isPlaying());
	};

	const halt = () => {
		stop();
		setPlaying(false);
	};

	return (
		<>
			<h1>beatscript</h1>
			<button type="button" onClick={apply}>
				{playing ? "Apply" : "Run"}
			</button>
			<button type="button" onClick={halt} disabled={!playing}>
				Stop
			</button>
			{error && <pre style={{ color: "red" }}>{error}</pre>}
			<textarea
				value={code}
				onInput={(e) => setCode(e.currentTarget.value)}
				rows={40}
				cols={90}
				spellcheck={false}
				style={{ display: "block", fontFamily: "monospace" }}
			/>
		</>
	);
}

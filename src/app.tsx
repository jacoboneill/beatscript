import { useEffect, useRef, useState } from "preact/hooks";
import { type Engine, startEngine } from "./audio/engine";
import { Editor } from "./editor";
import { PlayButton } from "./play-button";
import { check, isPlaying, run, stop } from "./runtime";
import { Visualiser } from "./visualiser";
import { DEFAULT_VOLUME, Volume } from "./volume";

export function App() {
	const START_STATE = "";
	const code = useRef(START_STATE);
	const [error, setError] = useState<string | undefined>(undefined);
	const [playing, setPlaying] = useState(false);
	const [engine, setEngine] = useState<Engine | undefined>(undefined);
	const [volume, setVolume] = useState(DEFAULT_VOLUME);

	// master volume, a short glide so dragging the slider doesn't crackle.
	// Before the first play there's no engine, so this runs again once there is
	useEffect(() => {
		if (engine === undefined) return;
		engine.master.gain.setTargetAtTime(volume, engine.ctx.currentTime, 0.02);
	}, [engine, volume]);

	// "saved" means the code that's playing, or the example before anything has
	const saved = useRef(START_STATE);
	const [dirty, setDirty] = useState(false);

	const apply = async () => {
		const submitted = code.current;
		try {
			await run(submitted);
			saved.current = submitted;
			setDirty(code.current !== submitted);
			setError(undefined);
		} catch (e) {
			setError(String(e));
		}
		setPlaying(isPlaying());

		// the engine only exists once something has played
		if (isPlaying()) setEngine(await startEngine());
	};

	// Cmd/Ctrl+S while stopped, check the code and mark it saved if it's fine
	const save = () => {
		const submitted = code.current;
		try {
			check(submitted);
			saved.current = submitted;
			setDirty(false);
			setError(undefined);
		} catch (e) {
			setError(String(e));
		}
	};

	const halt = () => {
		stop();
		setPlaying(false);
	};

	// Cmd/Ctrl+Enter toggles play/stop, Cmd/Ctrl+S applies while playing and
	// checks while stopped.
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
				if (isPlaying()) {
					apply();
				} else {
					save();
				}
			}
		};

		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	});

	return (
		<>
			<header class="toolbar">
				<PlayButton playing={playing} onClick={playing ? halt : apply} />
				<Volume value={volume} onChange={setVolume} />
			</header>
			<main class="workspace">
				<section class="code">
					{error && <pre class="error">{error}</pre>}
					<Editor
						initial={START_STATE}
						onChange={(next) => {
							code.current = next;
							setDirty(next !== saved.current);
						}}
						dirty={dirty}
					/>
				</section>
				<Visualiser engine={engine} />
			</main>
		</>
	);
}

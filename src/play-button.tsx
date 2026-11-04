import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faPlay, faStop } from "@fortawesome/free-solid-svg-icons";

// draw a Font Awesome icon straight from its path data, no React wrapper needed
function Icon({ icon }: { icon: IconDefinition }) {
	const [width, height, , , path] = icon.icon;
	return (
		<svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
			<path d={Array.isArray(path) ? path.join(" ") : path} />
		</svg>
	);
}

type PlayButtonProps = {
	playing: boolean;
	onClick: () => void;
};

export function PlayButton({ playing, onClick }: PlayButtonProps) {
	const label = playing ? "Stop (Cmd/Ctrl+Enter)" : "Play (Cmd/Ctrl+Enter)";

	return (
		<button
			type="button"
			class="play-button"
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			<Icon icon={playing ? faStop : faPlay} />
		</button>
	);
}

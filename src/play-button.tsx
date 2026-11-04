import { faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "./icon";

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

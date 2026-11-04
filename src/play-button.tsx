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
			<svg viewBox="0 0 24 24" aria-hidden="true">
				{playing ? (
					<rect x="6" y="6" width="12" height="12" rx="1.5" />
				) : (
					<path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" />
				)}
			</svg>
		</button>
	);
}

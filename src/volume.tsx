import {
	faVolumeHigh,
	faVolumeLow,
	faVolumeXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "./icon";

// the engine's master gain when it starts
export const DEFAULT_VOLUME = 0.8;

type VolumeProps = {
	value: number; // 0-1
	onChange: (value: number) => void;
};

export function Volume({ value, onChange }: VolumeProps) {
	const icon =
		value === 0 ? faVolumeXmark : value < 0.5 ? faVolumeLow : faVolumeHigh;

	return (
		<label
			class="volume"
			title={`Volume ${Math.round(value * 100)}% (double click to reset)`}
		>
			<Icon icon={icon} />
			<input
				type="range"
				min={0}
				max={1}
				step={0.01}
				value={value}
				onInput={(e) => onChange(Number(e.currentTarget.value))}
				onDblClick={() => onChange(DEFAULT_VOLUME)}
				aria-label="Volume"
			/>
		</label>
	);
}

import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

// draw a Font Awesome icon straight from its path data, no React wrapper needed
export function Icon({ icon }: { icon: IconDefinition }) {
	const [width, height, , , path] = icon.icon;
	return (
		<svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
			<path d={Array.isArray(path) ? path.join(" ") : path} />
		</svg>
	);
}

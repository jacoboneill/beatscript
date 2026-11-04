import { CodeJar } from "codejar";
import { useEffect, useRef } from "preact/hooks";
import Prism from "prismjs";

function highlight(editor: HTMLElement) {
	editor.innerHTML = Prism.highlight(
		editor.textContent ?? "",
		Prism.languages.javascript,
		"javascript",
	);
}

type EditorProps = {
	initial: string;
	onChange: (code: string) => void;
	// shows a dot above the line numbers, like an unsaved tab in VS Code
	dirty: boolean;
};

export function Editor({ initial, onChange, dirty }: EditorProps) {
	const container = useRef<HTMLDivElement>(null);

	// keep the latest callback without rebuilding the editor every render
	const changed = useRef(onChange);
	changed.current = onChange;

	useEffect(() => {
		const el = container.current;
		if (el === null) return;

		// CodeJar owns the editor's contents, so build it outside Preact's DOM
		const gutter = document.createElement("pre");
		gutter.className = "line-numbers";
		gutter.setAttribute("aria-hidden", "true");

		const editor = document.createElement("div");
		editor.className = "editor";
		editor.spellcheck = false;
		el.append(gutter, editor);

		// redraw on every input, highlighting waits for key up so it lags
		let lines = 0;
		const number = () => {
			const count = (editor.textContent ?? "")
				.replace(/\n$/, "")
				.split("\n").length;
			if (count === lines) return;
			lines = count;
			gutter.textContent = Array.from({ length: count }, (_, i) => i + 1).join(
				"\n",
			);
		};
		editor.addEventListener("input", number);

		const jar = CodeJar(editor, highlight, { tab: "  " });
		// CodeJar sets pre-wrap, but wrapped lines would push the numbers out of line
		editor.style.whiteSpace = "pre";
		jar.updateCode(initial);
		jar.onUpdate((code) => {
			number();
			changed.current(code);
		});
		number();

		return () => {
			editor.removeEventListener("input", number);
			jar.destroy();
			el.replaceChildren();
		};
	}, [initial]);

	return (
		<div
			ref={container}
			class={dirty ? "editor-pane dirty" : "editor-pane"}
			title={dirty ? "Unapplied changes (Cmd/Ctrl+S)" : undefined}
		/>
	);
}

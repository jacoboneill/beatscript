import type { Token } from "./lexer";

export type Step = number[];

const TEXT = {
	REST: "~",
	GROUPSTART: "[",
	GROUPEND: "]",
	CHORD: ",",
	REPEAT: "!",
	FREQ: "note",
} as const;

function unexpected(token: Token): Error {
	return new Error(
		`unexpected "${TEXT[token.type]}" at position :${token.idx}`,
	);
}

export function parse(tokens: Token[]): Step[] {
	let pos = 0;
	const peek = (): Token | undefined => tokens[pos];
	const next = (): Token | undefined => tokens[pos++];

	// a group's items, or a single step for a note, rest, or chord
	function atom(): Step[] {
		const token = next() as Token;
		switch (token.type) {
			case "FREQ":
				return [[token.value]];
			case "REST":
				return [[]];
			case "GROUPSTART":
				return brackets(token);
			default:
				throw unexpected(token);
		}
	}

	function brackets(open: Token): Step[] {
		const first = next();
		if (first === undefined) {
			throw new Error(`unclosed "[" at position :${open.idx}`);
		}
		if (first.type === "GROUPEND") {
			throw new Error(`empty "[]" at position :${open.idx}`);
		}

		// chord
		if (peek()?.type === "CHORD") {
			if (first.type !== "FREQ") throw unexpected(first);
			const chord: Step = [first.value];
			while (peek()?.type === "CHORD") {
				pos++;
				const note = next();
				if (note === undefined) {
					throw new Error(`unclosed "[" at position :${open.idx}`);
				}
				if (note.type !== "FREQ") throw unexpected(note);
				chord.push(note.value);
			}
			const close = next();
			if (close === undefined) {
				throw new Error(`unclosed "[" at position :${open.idx}`);
			}
			if (close.type !== "GROUPEND") throw unexpected(close);
			return [chord];
		}

		// group
		const items: Step[] = [];
		for (let token: Token | undefined = first; ; token = next()) {
			if (token === undefined) {
				throw new Error(`unclosed "[" at position :${open.idx}`);
			}
			if (token.type === "GROUPEND") return items;
			if (token.type === "FREQ") items.push([token.value]);
			else if (token.type === "REST") items.push([]);
			else throw unexpected(token);
		}
	}

	const steps: Step[] = [];
	while (pos < tokens.length) {
		const items = atom();

		// !n fills n steps, looping through a group's items
		let n = items.length;
		const repeat = peek();
		if (repeat?.type === "REPEAT") {
			pos++;
			if (repeat.value === 0) {
				throw new Error(`repeat must be at least 1 at position :${repeat.idx}`);
			}
			n = repeat.value;
		}

		for (let k = 0; k < n; k++) {
			steps.push(items[k % items.length]);
		}
	}

	return steps;
}

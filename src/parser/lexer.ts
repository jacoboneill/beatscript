const SYMBOLS = {
	"~": "REST",
	"[": "GROUPSTART",
	"]": "GROUPEND",
	",": "CHORD",
} as const;
const SEMITONES = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 } as const;

type SymbolType = (typeof SYMBOLS)[keyof typeof SYMBOLS];

export type Token =
	| { type: SymbolType; idx: number }
	| { type: "FREQ"; idx: number; value: number }
	| { type: "REPEAT"; idx: number; value: number };

function isSymbol(c: string): c is keyof typeof SYMBOLS {
	return Object.hasOwn(SYMBOLS, c);
}

function isNote(c: string): c is keyof typeof SEMITONES {
	return Object.hasOwn(SEMITONES, c);
}

const mtof = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export function lex(src: string): Token[] {
	if (src.split("\n").length !== 1) {
		throw RangeError("parser only accepts single line input");
	}

	const tokens: Token[] = [];

	for (let i = 0; i < src.length; ) {
		const c = src[i];

		// ignore space
		if (/\s/.test(c)) {
			i++;
			continue;
		}

		// found symbol
		if (isSymbol(c)) {
			tokens.push({ type: SYMBOLS[c], idx: i });
			i++;
			continue;
		}

		// found repeat
		if (c === "!") {
			const token = { type: "REPEAT" as const, idx: i, value: 0 };
			i++;
			if (!/[0-9]/.test(src[i])) {
				throw new Error(`missing number of repeats at :${token.idx}`);
			}
			for (; /[0-9]/.test(src[i]) && i < src.length; i++) {
				token.value *= 10;
				token.value += parseInt(src[i], 10);
			}
			tokens.push(token);
			continue;
		}

		if (isNote(c)) {
			const token = {
				type: "FREQ" as const,
				idx: i,
				value: 0,
			};

			// get note
			let semitone = SEMITONES[c];
			i++;

			// detect if sharp or flat
			if (src[i] === "#") {
				semitone += 1;
				i++;
			} else if (src[i] === "b") {
				semitone -= 1;
				i++;
			}

			// get octave
			if (!/[0-9]/.test(src[i])) {
				throw new Error(
					`missing octave number after note at position :${token.idx}`,
				);
			}
			let octave = 0;
			for (; /[0-9]/.test(src[i]) && i < src.length; i++) {
				octave *= 10;
				octave += parseInt(src[i], 10);
			}

			// convert to frequency
			const midi = 12 * (octave + 1) + semitone;
			token.value = mtof(midi);

			tokens.push(token);
			continue;
		}

		throw new Error(`unexpected "${c}" at position :${i}`);
	}

	return tokens;
}

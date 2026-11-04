# beatscript

A small live-coding music tool for the browser, inspired by [Strudel](https://strudel.cc). Write a short program, press play, and hear it through the Web Audio API.

```js
const kick = Sequencer({ notes: "c1", step: 1 / 4 }).add(
  Synthesiser({
    sound: "sine",
    pitchEnvelope: { adsr: [0, 0.08, 0, 0], semitones: 36 },
    ampEnvelope: [0, 0.3, 0, 0.05],
  }),
);

play(120, kick);
```

## Getting started

Requires Node.js.

```sh
npm install
npm run dev
```

## Scripts

| Command         | What it does                                 |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start the Vite dev server                    |
| `npm run build` | Type-check and build to `dist/`              |
| `npm run check` | Check typing, formatting and lint with Biome |
| `npm run clean` | Clean repository of build artifacts          |

## Docs

- [Product requirements](docs/PRD.md): the language, syntax and tech choices
- [Interface design](docs/design/interface.png)

## Stack

TypeScript, Preact, Vite, CodeJar with Prism for the editor, and the Web Audio API.

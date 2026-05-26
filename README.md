# Math Sprint

A small mental-math trainer built with Expo. Drill addition, subtraction, multiplication, and division against the clock — the difficulty adapts as you get faster.

| Image 1    | Image 2 |
| -------- | ------- |
|  <img width="1170" height="2532" alt="simulator_screenshot_AE169735-F9B1-440E-BF59-3A5CF2C2D7C3" src="https://github.com/user-attachments/assets/60763fab-9b0a-455b-a600-ba9e4ac98406" /> |   <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 16e - 2026-05-26 at 16 52 09" src="https://github.com/user-attachments/assets/8ccb60ad-d82d-4ddc-a815-80c6e902852f" />|



## Game modes

| Mode | Goal | Score |
| --- | --- | --- |
| **60-second sprint** | Solve as many problems as you can in one minute. | Number correct |
| **20-problem race** | Get through 20 problems as fast as possible. | Total time (+5s per wrong answer) |
| **Survival** | Keep answering — the per-problem timer shrinks every 5 correct answers. 3 lives. | Longest streak |

All modes use the same adaptive generator: operand sizes start small (single digit, ≤6×6) and grow toward two-digit operands and ≤15×15 multiplication as you keep answering quickly. Wrong answers and slow answers pull the difficulty back down.

## What's inside

- **Expo SDK 56** + **expo-router v56** with a file-based route tree.
- **`expo-sqlite/kv-store`** for persistence (best score per mode + last 10 finished rounds).
- **React 19 + React Compiler** — the codebase plays nicely with the new purity rules.
- **react-native-reanimated** for the wrong-answer pill fade.
- Targets iOS, Android, and Web from a single source tree.

## Project layout

```
src/
├── app/
│   ├── _layout.tsx          # root Stack (headerless)
│   ├── play.tsx             # full-screen game loop + results
│   └── (tabs)/
│       ├── _layout.tsx      # NativeTabs (Play / History)
│       ├── index.tsx        # mode picker + best scores
│       └── history.tsx      # last 10 rounds with timestamps
├── components/
│   ├── number-pad.tsx       # on-screen 0–9 + ⌫ + ✓
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── game/
│   ├── problems.ts          # generator + nextDifficulty
│   ├── storage.ts           # kv-store wrapper
│   └── types.ts             # GameMode, Problem, RoundResult
├── constants/theme.ts
└── hooks/                   # useTheme, useColorScheme
```

The `play.tsx` screen is a single reducer — every digit press, submit, timeout, and finish flows through it, which keeps the game state easy to reason about.

## Getting started

```bash
npm install
npm run ios      # or: npm run android, npm run web
```

The first iOS/Android run will do a native build via `expo run:ios` / `expo run:android`. After that, `npm start` is enough for day-to-day work.

## How the wrong-answer feedback works

When you submit a wrong answer (or run out the per-problem timer in survival), a red pill briefly fades in showing the problem and its correct answer, e.g. `✗ 12 × 7 = 84`. The pill is positioned absolutely above the problem so it never blocks the number pad — the next problem is already up and you can keep typing.

## Persistence

Best scores per mode and the most recent 10 finished rounds are stored locally via `expo-sqlite/kv-store` under the keys `math-game:best:v1:<mode>` and `math-game:history:v1`. There's no remote sync; deleting the app clears your stats.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` / `npm run android` / `npm run web` | Open a platform target |
| `npm run lint` | Run `expo lint` |
| `npx tsc --noEmit` | Typecheck without emitting |

## Notes

- This project pins **Expo SDK 56**. Before changing any Expo-related dependency, check [the SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/).
- Web requires the `metro.config.js` tweak that registers `.wasm` as an asset — without it the `expo-sqlite` worker fails to resolve on web bundling.

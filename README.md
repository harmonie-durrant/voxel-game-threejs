# voxel-game-threejs

A voxel game made with three.js, inspired by Minecraft.

## Getting started

You need [Node.js](https://nodejs.org/) 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Then open the URL that Vite prints, usually http://localhost:5173.

## Controls

| Key   | Action                |
| ----- | --------------------- |
| WASD  | Move                  |
| Space | Jump                  |
| E     | Inventory             |
| V     | Crafting UI           |
| 0-9   | Select block or tool  |
| F1    | Save                  |
| F2    | Load from save        |
| C     | Toggle orbit free cam |

## Scripts

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the dev server               |
| `npm run build`        | Type-check and build into `dist/`  |
| `npm run preview`      | Serve the production build locally |
| `npm run format`       | Format all files with Prettier     |
| `npm run format:check` | Check formatting only              |

## Built with

[three.js](https://threejs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/) and [Tailwind CSS](https://tailwindcss.com/).

# macOS Portfolio

Interactive macOS-style portfolio built with React, TypeScript, Vite, Tailwind CSS v4, Zustand, GSAP, Lucide icons, and canvas-confetti.

## Requirements

- Node.js
- npm

On Windows PowerShell, use the `.cmd` npm shims if script execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Scripts

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

## Project Notes

- Runtime assets live in `public/`.
- macOS cursor files used by the app live under `public/cursors/`.
- The default wallpaper video lives at `public/backgrounds/Frosted_glass_background_video.mp4`.
- Notes content is saved locally in the browser under the `macos_portfolio_note` key.

## Verification

Run these before shipping changes:

```powershell
npm.cmd run lint
npx.cmd tsc -b --pretty false
npm.cmd run build
npm.cmd audit --json
```

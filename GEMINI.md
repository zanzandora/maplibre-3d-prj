# MapLibre GL JS 3D Project Context

This project is a high-performance 3D map visualization application that integrates **MapLibre GL JS** (v5+) with **Three.js** using **React Three Fiber (R3F)**. It is designed to render thousands of 3D models efficiently within a shared WebGL context.

## Project Overview

- **Core Technology:** React 19, Vite, TypeScript, MapLibre GL JS v5+, Three.js, React Three Fiber.
- **Key Objective:** Seamlessly overlay 3D content (GLB models) onto a MapTiler map with perfect camera synchronization and high performance (40+ FPS for 1000+ models).
- **Main Components:**
  - `MapView.tsx`: The primary map container.
  - `MapThreeLayer.tsx`: A hybrid sync bridge that renders an R3F Canvas as an overlay and synchronizes it with the map's camera state directly via a Custom Layer.
  - `InstanceRenderer.tsx`: Optimized rendering using `THREE.InstancedMesh` for multiple instances of the same model.
  - `SingleModelRenderer.tsx`: Standard renderer for individual 3D objects.
  - `ModelManager.tsx`: Orchestrates the placement and loading of 3D assets.
  - `coordinate.ts`: Utilities for converting WGS84 (Lng/Lat) to Mercator units relative to a center point to prevent floating-point jitter.
  - `CameraSync.tsx`: Legacy utility for camera synchronization (logic now moved into MapThreeLayer).

## Building and Running

The project uses `pnpm` as the package manager.

- **Install dependencies:** `pnpm install`
- **Development server:** `npm run dev` (starts Vite)
- **Production build:** `npm run build` (runs `tsc` and `vite build`)
- **Linting:** `npm run lint` (runs ESLint)
- **Preview build:** `npm run preview` (previews the production build)

## Development Conventions

- **State Management:** Uses React hooks (`useState`, `useMemo`, `useRef`) for local state and synchronization.
- **3D Assets:** Place GLB models in `public/Ivory3D/`. Use `@react-three/drei`'s `useGLTF` for loading and caching.
- **Performance:**
  - Prefer `InstanceRenderer` for many identical objects (trees, lamps, etc.) to minimize draw calls.
  - Use `useMemo` for heavy calculations like coordinate conversions.
- **Coordinate System:**
  - Always use a reference center (`centerCoord`) in `MapView` to establish a local (0,0,0) point.
  - Convert coordinates using `WGS84_TO_MERCATOR` and calculate offsets relative to the center to maintain precision.
- **Styling:** CSS is managed via `App.css` and `index.css`. The map container should usually be set to `100vw`/`100vh`.

## Architecture Details

- **Hybrid Sync:** The project uses an R3F Canvas positioned as an absolute overlay on top of the MapTiler map. A Custom Layer is used to share the WebGL context and synchronize camera state.
- **Camera Sync:** The synchronization logic is integrated directly into `MapThreeLayer.tsx`. It handles projection matrices, ensuring 3D objects stay "pinned" to the map during panning, zooming, and tilting.
- **Resource Management:** `ModelManager` is the central place to define which models are loaded and where they are placed.

## 3 Rules for Documenting Code

- **Rule 1:** Naming should explain _What_ your code does.
- **Rule 2:** The code itself should be readable and understandable so you and others can easily identify _How_ it's doing what it's doing.
- **Rule 3:** use comments to provide all that extra information so everyone knows _Why_ the code was written the way it was.

# GEMINI.md - Street View MiniMap Project

## Project Overview

**Street View MiniMap** is a high-performance web application that integrates 360-degree panoramic imagery (via Photo Sphere Viewer) with a dynamic radar/mini-map (via MapLibre GL). It allows users to navigate through "spots" (nodes) in a virtual tour while maintaining spatial awareness through a synchronized mini-map.

### Core Technologies

- **Frontend Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **3D/Panorama Engine:** Photo Sphere Viewer (PSV) & Three.js
- **Map Engine:** MapLibre GL / React Map GL
- **State Management:** React Hooks (useState, useMemo, useRef)

### Architecture

- **App Entry:** `src/App.tsx` renders `StreetViewApp.tsx`.
- **Main Coordinator:** `src/components/StreetViewApp.tsx` manages the global state: active spot ID, map center, and whether the Street View viewer is open.
- **Panorama Viewer:** `src/components/StreetViewComponent.tsx` initializes and manages the Photo Sphere Viewer instance.
- **Mini-Map System:** `src/components/StreetViewMiniMap/` (Documentation in `docs/STREET_VIEW_MINIMAP.md`)
  - `index.tsx`: Main mini-map container with expand/collapse logic and transition overlays.
  - `ConeMarker.tsx`: Displays the user's field of view (radar) using a custom "shortest path rotation" logic to prevent 360-degree "jumps".
  - `HotspotMarkers.tsx`: Renders clickable nodes on the map representing available panorama locations.
- **Data Layer:** `src/mock/data.ts` provides the structural data for the tour (GPS coordinates, panorama URLs, and connectivity links).

## Building and Running

The project uses `pnpm` as the package manager.

- **Development:** `pnpm dev`
- **Production Build:** `pnpm build` (runs Type-checking + Vite build)
- **Linting:** `pnpm lint`
- **Preview Build:** `pnpm preview`
- **JS Export:** `pnpm export-js` (Exports TS source to a `converted-js` directory for legacy or non-TS environments)

## Development Conventions

- **Performance Optimization:**
  - Use `useRef` for tracking continuous values (like rotation angles or user interaction state) to avoid unnecessary re-renders.
  - Separate high-frequency updates (like the radar rotation in `ConeMarker`) into dedicated sub-components.
- **Spatial Logic:**
  - Directional data (yaw/alpha) from the panorama viewer is synchronized with the MapLibre marker rotation.
  - Coordinate system is WGS84 (EPSG:4326) for data and Web Mercator (EPSG:3857) for the map display.
- **UI/UX:**
  - Use "Transition Overlays" during map resizing to hide WebGL context adjustments.
  - Implement "Auto-centering" logic that pauses when the user manually pans the map.

## Key Files & Directories

- `src/components/StreetViewApp.tsx`: The primary application controller.
- `src/components/StreetViewMiniMap/index.tsx`: The core logic for the radar/mini-map synchronization.
- `docs/STREET_VIEW_MINIMAP.md`: Detailed technical breakdown of the mini-map implementation.
- `src/mock/data.ts`: The source of truth for all location nodes.

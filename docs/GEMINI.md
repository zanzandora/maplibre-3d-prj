# GEMINI.md - BIM ARCHITECT Project

## Project Overview
**BIM ARCHITECT** is a high-performance BIM (Building Information Modeling) viewer application built with React and the @thatopen engine. It allows users to visualize, navigate, and analyze 3D BIM models (IFC/Fragments) in a web-based environment.

### Core Technologies
- **Frontend Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (v4)
- **3D Engine:** Three.js & [@thatopen/components](https://thatopen.github.io/engine_components/scripts/docs.html)
- **State Management:** Zustand
- **Map Integration:** MapLibre GL / React Map GL

### Architecture
- **State Management:** Centralized in `src/components/store/useBIMStore.ts` using Zustand. Manages UI state, tool selection, and model-specific data (like spatial tree and element count).
- **BIM Engine Lifecycle:** Managed via `BIMProvider` (`src/context/BIMProvider.tsx`). It initializes the `@thatopen` components, sets up the 3D world (scene, camera, renderer), and handles tool activations (Clipper, Highlighter).
- **UI Components:** Organized in `src/components/ui/` following a layout-based structure (Header, Panels, Toolbar, StatusBar).
- **Spatial Tree:** Generated dynamically from the BIM model using `src/utils/generateSpatialTreeJSON.ts`, enabling hierarchical navigation of model elements.

## Building and Running
The project uses `pnpm` as the package manager.

- **Development:** `pnpm dev`
- **Production Build:** `pnpm build`
- **Linting:** `pnpm lint`
- **Preview Build:** `pnpm preview`

## Development Conventions
- **Component Pattern:** Prefer functional components with TypeScript interfaces for props.
- **Styling:** Use Tailwind CSS utility classes. Avoid complex CSS files unless necessary.
- **State Access:** Use the `useBIMStore` hook for UI-related state and `useBIMContext` for accessing the raw BIM engine components.
- **Tool Development:** Implement new BIM tools (e.g., measuring, sectioning) within `src/components/engine/` and register them in the `BIMProvider`'s tool controller.
- **Tree Navigation:** The spatial tree is normalized for performance. Use `spatialTreeById` for O(1) lookups in the UI.

## Key Files & Directories
- `src/components/BIMViewer.tsx`: The main entry point for the BIM viewer component.
- `src/context/BIMProvider.tsx`: Core engine initialization and tool management.
- `src/components/store/useBIMStore.ts`: Global application state.
- `src/utils/generateSpatialTreeJSON.ts`: Logic for converting BIM models to a UI-friendly tree structure.
- `docs/`: Contains detailed documentation on specific systems like the Spatial Tree and BIM Property System.

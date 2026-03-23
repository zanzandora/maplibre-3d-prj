# ROLE

You are an Expert Frontend Engineer specialized in building CAD/BIM web applications. Your task is to build a UI layout for a 3D BIM Viewer using pure React (TypeScript) and Tailwind CSS. Do NOT use any component libraries like MUI, AntD, or shadcn/ui. Use `lucide-react` for icons.

# CORE CONSTRAINTS & 3D SCENE HANDLING

- IMPORTANT: Look at the provided reference image, but DO NOT attempt to recreate or mock the 3D building/scene in the center.
- The 3D rendering will be handled externally by a WebGL engine (That Open Company).
- Your layout MUST follow a "Floating UI over Fullscreen Canvas" architecture.
- Base Layer (Z-index 0): A full-viewport div `<div ref={containerRef} className="absolute inset-0 z-0 bg-[#202932]" />`.
- UI Layer (Z-index 10): An absolute container covering the screen with `pointer-events-none`. All actual UI panels inside it must have `pointer-events-auto` so users can click them, while allowing clicks on the empty space to pass through to the 3D canvas below.

# UI COMPONENTS & STRUCTURE

Please build the following layout components. Use a professional, compact, Dark Mode theme (slate-800/900 backgrounds, gray-300 text, small text sizes like text-sm or text-xs) typical for engineering software.

1. **Header (Top Bar)**:

   - Floating at the top. Full width or pill-shaped.
   - Left: App Logo / Name ("BIM Architect").
   - Center: Project name or global search bar.
   - Right: User profile, settings, or export buttons.
   - Style: Glassmorphism (`backdrop-blur-md bg-slate-900/80`) or solid dark border-b.

2. **Left Panel (Project Explorer / Tree View)**:

   - Floating on the left side, below the header.
   - Fixed width (e.g., w-72). Resizable if possible, but fixed is fine for now.
   - Contains a placeholder for an IFC hierarchy tree (Building -> Storeys -> Elements) with expand/collapse icons.

3. **Right Panel (Properties / BIM Info)**:

   - Floating on the right side.
   - Fixed width (e.g., w-80).
   - Contains a placeholder for BIM element properties (Key-Value pairs like Category, Volume, Material). Show a table-like layout.

4. **Floating Bottom Toolbar (Action Menu)**:
   - Centered at the bottom of the screen.
   - Contains a flex row of icon buttons for 3D tools: Select (Cursor), Orbit, Clip/Cut (Scissors), Measure (Ruler), Isolate, etc.
   - Active tool should have a distinct background (e.g., `bg-blue-600`).

# STATE MANAGEMENT (Zustand integration mock)

- Please create a mock Zustand store (`useBIMStore`) to manage:
  - `activeTool` (string: 'select', 'clip', 'measure').
  - `leftPanelOpen` (boolean).
  - `rightPanelOpen` (boolean).
- Connect the UI components to this store so clicking the Toolbar changes the `activeTool`, and the panels can be toggled open/closed.

# CODE OUTPUT

Provide the complete React code, broken down into logical files if necessary (e.g., `Layout.tsx`, `Header.tsx`, `LeftPanel.tsx`, `RightPanel.tsx`, `Toolbar.tsx`, `store.ts`). Ensure it is fully responsive and cleanly written with Tailwind utilities.

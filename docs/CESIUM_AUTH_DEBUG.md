# Diagnostic Report: Cesium Ion 3D Tiles 401 Unauthorized

## Issue Description
Persistent `401 Unauthorized` errors when fetching `tileset.json` from Cesium Ion, despite successful authentication with the Asset Endpoint API.

## Root Cause Analysis
The issue was identified as a **Lifecycle Race Condition** between React Three Fiber (R3F) and the `CesiumIonAuthPlugin`:

1.  **Async Lag:** The plugin fetches the endpoint and injects headers (`Authorization: Bearer ...`) asynchronously.
2.  **Premature Request:** The R3F `<TilesRenderer>` wrapper initiates the network request as soon as it mounts, often before the plugin has finished injecting the necessary authentication headers into the internal `fetchOptions`.
3.  **Result:** The initial request for `tileset.json` is sent without credentials, leading to an immediate 401 error.

---

## Final Architecture: Smart Component & Pre-fetch Auth (VGMMaps Standard)

To ensure maximum control and eliminate race conditions/collisions, we have adopted a dual-layer strategy:

### 1. Pre-fetch Auth (Security)
- **State-Driven Mounting:** The `<TilesRenderer>` component is **not mounted** until the authenticated URL is fully constructed in React state.
- **Explicit Credential Management:** Authentication is handled at the React component level. We discovered that the session token requires an explicit `Bearer ` prefix.
- **Header-based Auth:** We use `fetchOptions` to pass the `Authorization` header, ensuring standard REST security and avoiding token exposure in URLs.

### 2. Smart Component (Lifecycle Stability)
- **Render Collision Fix:** We identified a "Root Collision" where `Tiles3DLayer` and `MapThreeLayer` were fighting for control over the same R3F Root.
- **Environment Detection:** `Tiles3DLayer` now uses `useThree()` to detect if it's already inside an R3F context.
  - **Inside R3F:** It acts as a pure R3F component, skipping Custom Layer initialization.
  - **Standalone:** It initializes its own Custom Layer and R3F Root.
- **Result:** This eliminates the recursive unmounting/retrying loop, allowing the network requests to stabilize and tiles to render correctly.

---

## Alignment & Coordinate System
- **ENU Alignment:** Tiles are aligned to the Local East-North-Up (ENU) frame using `WGS84_ELLIPSOID`.
- **Vertical Sync:** To prevent buildings from "lying flat" or being tilted, the `worldMatrix` must correctly map ENU Z (Up) to Mercator Z (Altitude) without swapping axes, matching MapLibre's internal 3D expectation.

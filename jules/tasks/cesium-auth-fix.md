# Jules Task Context: Cesium 401 Resolution

This file provides structured context for the Jules CLI to resolve the
authentication failure on Cesium 3D Tiles.

```yaml
task_id: 'cesium-auth-fix'
objective: 'Resolve 401 Unauthorized error on tileset.json after successful endpoint fetch'
priority: 'CRITICAL'

environment:
  stack: ['React 19', 'Three.js', 'R3F', 'MapLibre GL JS']
  auth_flow: 'Manual fetch (Endpoint -> Session Token -> Tileset URL)'

files_involved:
  - 'src/components/map3d/Tiles3DLayer.tsx'
  - 'src/components/map/MapView.tsx'
  - 'tests/performance/terrain-loading.spec.ts'
  - 'docs/CESIUM_AUTH_DEBUG.md'

diagnostic_data:
  endpoint_status: 200
  tileset_status: 401
  symptom: 'Temporary accessToken returned by Cesium API is rejected by the tileset CDN.'
  attempted_fixes:
    - 'Switched from CesiumIonAuthPlugin to manual fetch.'
    - 'Sequenced loading to trigger only after Terrain is ready.'
    - 'Stabilized React lifecycle to prevent redundant fetch calls.'

proposed_actions:
  - 'Verify if specific Referer or Origin headers are required for the session token.'
  - 'Implement a fallback or retry mechanism for the session token.'
  - 'Check for regional asset restrictions (ap-northeast-1).'

jules_command: "/jules start 'Investigate and fix 401 error on Cesium tileset.json using manual fetch logic'"
```

## How to use

Run the following command to start the Jules session with this context:
`jules task docs/JULES_CESIUM_TASK.md`

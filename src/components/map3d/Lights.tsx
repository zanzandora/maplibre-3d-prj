import { useMemo } from 'react';

/**
 * Common lighting setup for the 3D map scene.
 */
export const Lights = () => {
  return useMemo(
    () => (
      <>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 20, 100]} intensity={1.5} />
        <directionalLight position={[-10, -20, 100]} intensity={0.5} />
      </>
    ),
    []
  );
};

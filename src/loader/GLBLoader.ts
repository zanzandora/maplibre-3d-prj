import { useGLTF } from '@react-three/drei';

/**
 * GLBLoader utility for centralized model management.
 * @react-three/drei's useGLTF already provides a built-in cache based on the URL.
 */
export const GLBLoader = {
  useLoad: (url: string) => {
    return useGLTF(url);
  },

  // Optional: Preload critical models
  preload: (url: string) => {
    useGLTF.preload(url);
  },

  clearCache: (url?: string) => {
    useGLTF.clear(url || '');
  },
};

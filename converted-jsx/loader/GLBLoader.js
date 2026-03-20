import { useGLTF } from "@react-three/drei";

/**
 * GLBLoader utility for centralized model management.
 * @react-three/drei's useGLTF already provides a built-in cache based on the URL.
 */
export const GLBLoader = {
  useLoad: (url) => {
    return useGLTF(url);
  },

  // Optional: Preload critical models
  preload: (url) => {
    useGLTF.preload(url);
  },

  clearCache: (url) => {
    useGLTF.clear(url || "");
  },
};

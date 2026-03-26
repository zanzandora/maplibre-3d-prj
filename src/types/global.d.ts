import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { R3FRoot } from '../utils/types';

declare global {
  interface HTMLCanvasElement {
    __r3fSetup?: {
      renderer: WebGLRenderer;
      scene: Scene;
      camera: PerspectiveCamera;
      root: R3FRoot;
    };
  }
}

export {};

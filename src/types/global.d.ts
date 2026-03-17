import * as THREE from 'three';
import { R3FRoot } from '../utils/types';

declare global {
  interface HTMLCanvasElement {
    __r3fSetup?: {
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      root: R3FRoot;
    };
  }
}

export {};

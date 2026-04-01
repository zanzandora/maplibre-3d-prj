import {
  useState,
  type ReactNode,
  useCallback,
  useRef,
  type FC,
  useEffect,
} from 'react';
import * as OBC from '@thatopen/components';
import { BIMContext } from './BIMContext';
import { PostproductionRenderer } from '@thatopen/components-front';
import { Color, Scene } from 'three';
import { useTheme } from '../theme/ThemeContext';
import { useToolController } from '../../hooks/engine/useToolController';

export type BIMWorld = OBC.World;

export interface BIMContextType {
  components: OBC.Components | null;
  world: BIMWorld | null;
  fragments: OBC.FragmentsManager | null;
  container: HTMLElement | null;
  mount: (container: HTMLElement) => Promise<void>;
  isReady: boolean;
}

export const BIMProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const componentsRef = useRef<OBC.Components | null>(null);
  const worldRef = useRef<BIMWorld | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const workerUrlRef = useRef<string | null>(null);

  const { theme } = useTheme();

  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      if (componentsRef.current) {
        componentsRef.current.dispose();
        componentsRef.current = null;
      }
      if (workerUrlRef.current) {
        URL.revokeObjectURL(workerUrlRef.current);
      }
    };
  }, []);

  // todo: Change color bg base on Dark mode
  useEffect(() => {
    const world = worldRef.current;
    if (!isReady || !world) return;

    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const targetColor = isDark ? '#202932' : '#ddf2f7';
    (world.scene.three as Scene).background = new Color(targetColor); // Sửa mã màu Light theo UI của bạn
  }, [isReady, theme]);

  // todo: Tool Controller
  useToolController({
    components: componentsRef.current,
    world: worldRef.current,
    fragments: fragmentsRef.current,
    container,
    isReady,
  });

  const mount = useCallback(async (container: HTMLElement) => {
    if (componentsRef.current) return;
    setContainer(container);

    // init OBC
    const components = new OBC.Components();
    componentsRef.current = components;

    const worlds = components.get(OBC.Worlds);
    const world = worlds.create<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      PostproductionRenderer
    >();
    worldRef.current = world;

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new PostproductionRenderer(components, container);
    world.camera = new OBC.OrthoPerspectiveCamera(components);

    components.init();
    world.scene.setup();
    world.scene.three.background = new Color('#202932');

    const fragments = components.get(OBC.FragmentsManager);
    fragmentsRef.current = fragments;

    const casters = components.get(OBC.Raycasters);
    casters.get(world);

    // todo: load fragment
    try {
      const workerUrl = '/worker.mjs';
      const fetchedUrl = await fetch(workerUrl);
      const workerBlob = await fetchedUrl.blob();

      if (!isMountedRef.current) return;

      const workerFile = new File([workerBlob], 'worker.mjs', {
        type: 'text/javascript',
      });
      const url = URL.createObjectURL(workerFile);
      workerUrlRef.current = url;

      fragments.init(url);

      // bug: No camera initialized!
      world.camera.controls.addEventListener('update', () =>
        fragments.core.update()
      );

      fragments.core.models.materials.list.onItemSet.add(
        ({ value: material }) => {
          if (!('isLodMaterial' in material && material.isLodMaterial)) {
            material.polygonOffset = true;
            material.polygonOffsetUnits = 1;
            material.polygonOffsetFactor = Math.random();
          }
        }
      );

      fragments.list.onItemSet.add(({ value: model }) => {
        model.useCamera(world.camera.three);
        world.scene.three.add(model.object);
        fragments.core.update(true);

        world.camera.controls.fitToSphere(model.object, true);
      });

      setIsReady(true);

    } catch (error) {
      console.error('BIM Provider initialization error:', error);
    }

    // todo: Grid Setup
    // bug: No scene initialized!
    const grids = components.get(OBC.Grids);
    const grid = grids.create(world);

    grid.three.position.y = -0.01; // Slightly below ground to avoid Z-fighting
  }, []);

  const value = {
    components: componentsRef.current,
    world: worldRef.current,
    fragments: fragmentsRef.current,
    container,
    mount,
    isReady,
  };

  return <BIMContext.Provider value={value}>{children}</BIMContext.Provider>;
};

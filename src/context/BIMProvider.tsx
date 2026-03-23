import {
  useState,
  type ReactNode,
  useCallback,
  useRef,
  type FC,
  useEffect,
} from 'react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import * as THREE from 'three';
import { BIMContext } from './BIMContext';
import { useBIMStore } from '../components/store/useBIMStore';

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

  const activeTool = useBIMStore((s) => s.activeTool);

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

  // todo: clipper event
  const setupClipper = useCallback(
    (components: OBC.Components, world: OBC.World, container: HTMLElement) => {
      const clipper = components.get(OBC.Clipper);
      clipper.enabled = true;
      clipper.visible = true;

      const handleDblClick = () => {
        container.ondblclick = () => {
          if (clipper.enabled) {
            clipper.create(world);
          }
        };
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Delete' || event.code === 'Backspace') {
          if (clipper.enabled) {
            console.log('delete clipper');
            clipper.delete(world);
          }
        }
      };

      container.addEventListener('dblclick', handleDblClick);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clipper.enabled = false;
        clipper.visible = false;
        container.removeEventListener('dblclick', handleDblClick);
        window.removeEventListener('keydown', handleKeyDown);
      };
    },
    []
  );

  // Tool Controller (Switch statement for better scalability)
  useEffect(() => {
    const components = componentsRef.current;
    const world = worldRef.current;
    if (!components || !world || !container) return;

    let cleanup: (() => void) | undefined;

    const clipper = components.get(OBC.Clipper);

    switch (activeTool) {
      case 'clip':
        cleanup = setupClipper(components, world, container);
        break;
      default:
        // By default, disable specialized tools
        clipper.enabled = false;
        clipper.visible = false;
        break;
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [activeTool, container, setupClipper]);

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
      OBF.PostproductionRenderer
    >();
    worldRef.current = world;

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBF.PostproductionRenderer(components, container);
    world.camera = new OBC.OrthoPerspectiveCamera(components);

    components.init();
    world.scene.setup();
    world.scene.three.background = new THREE.Color('#202932');

    const fragments = components.get(OBC.FragmentsManager);
    fragmentsRef.current = fragments;

    const casters = components.get(OBC.Raycasters);
    casters.get(world);

    // todo: load fragment
    try {
      const githubUrl =
        'https://thatopen.github.io/engine_fragment/resources/worker.mjs';
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();

      if (!isMountedRef.current) return;

      const workerFile = new File([workerBlob], 'worker.mjs', {
        type: 'text/javascript',
      });
      const url = URL.createObjectURL(workerFile);
      workerUrlRef.current = url;

      fragments.init(url);

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
    const grids = components.get(OBC.Grids);
    const grid = grids.create(world);

    grid.three.position.y = -0.01; // Slightly below ground to avoid Z-fighting

    // todo: Raycaster event
    // container.addEventListener('dblclick', async () => {
    //   const result = await caster.castRay();
    //   if (result) {
    //     console.log('Raycast result:', result);
    //     const { object, faceIndex, point } = result;
    //     console.log('Hit object:', object);
    //     console.log('Face index:', faceIndex);
    //     console.log('Hit point:', point);
    //   } else {
    //     console.log('No object hit.');
    //   }
    // });

    // todo: Highligh event
    // const highlighter = components.get(OBF.Highlighter);
    // highlighter.setup({
    //   world,
    //   selectMaterialDefinition: {
    //     color: new THREE.Color('#bcf124'),
    //     opacity: 1,
    //     transparent: false,
    //     renderedFaces: 0,
    //   },
    // });

    // highlighter.events.select.onHighlight.add(async (modelIdMap) => {
    //   console.log('Something was selected');

    //   const promises = [];
    //   for (const [modelId, localIds] of Object.entries(modelIdMap)) {
    //     const model = fragments.list.get(modelId);
    //     if (!model) continue;
    //     promises.push(model.getItemsData([...localIds]));
    //   }

    //   const data = (await Promise.all(promises)).flat();
    //   console.log(data);
    // });

    // highlighter.events.select.onClear.add(() => {
    //   console.log('Selection was cleared');
    // });
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

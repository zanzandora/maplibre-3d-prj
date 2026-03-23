/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const setSelectedElement = useBIMStore((s) => s.setSelectedElement);

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

  // todo: Highligh event
  const setupHighlighter = useCallback(
    (
      components: OBC.Components,
      world: OBC.World,
      fragments: OBC.FragmentsManager
    ) => {
      const highlighter = components.get(OBF.Highlighter);
      highlighter.setup({
        world,
        selectMaterialDefinition: {
          color: new THREE.Color('#bcf124'),
          opacity: 1,
          transparent: false,
          renderedFaces: 0,
        },
      });

      const onHighlight = async (modelIdMap: OBC.ModelIdMap) => {
        const promises = [];
        for (const [modelId, localIds] of Object.entries(modelIdMap)) {
          const model = fragments.list.get(modelId);
          if (!model) continue;

          // Request attributes and Property Set relations
          promises.push(
            model.getItemsData([...localIds], {
              attributesDefault: true,
              relations: {
                IsDefinedBy: {
                  attributes: true,
                  relations: true,
                },
                HasProperties: {
                  attributes: true,
                  relations: true,
                },
              },
            })
          );
        }

        const data = (await Promise.all(promises)).flat();

        if (data.length > 0) {
          const item = data[0];

          // 1. Process Property Sets (Psets)
          const psets: Record<string, any> = {};
          if (item.IsDefinedBy && Array.isArray(item.IsDefinedBy)) {
            for (const pset of item.IsDefinedBy) {
              const psetName: string = pset.Name?.value || 'Common Properties';
              const props: Record<string, any> = {};
              if (pset.HasProperties && Array.isArray(pset.HasProperties)) {
                for (const prop of pset.HasProperties) {
                  const name = prop.Name?.value;
                  const val = prop.NominalValue?.value;
                  if (name && val !== undefined) {
                    props[name] = val;
                  }
                }
              }
              psets[psetName] = props;
            }
          }
          console.log('pset: ', psets);

          // 2. Flatten and spread direct attributes
          const flatAttributes: Record<string, any> = {};
          for (const [key, val] of Object.entries(item)) {
            if (key === 'IsDefinedBy') continue; // Handled separately

            // Extract .value if it exists (common pattern in That Open fragments)
            if (val && typeof val === 'object' && 'value' in val) {
              flatAttributes[key] = val.value;
            } else {
              flatAttributes[key] = val;
            }
          }
          console.log('flatAttributes: ', flatAttributes);

          setSelectedElement({
            ...flatAttributes,
            psets,
          });
        }
      };

      const onClear = () => {
        setSelectedElement(null);
      };

      highlighter.events.select.onHighlight.add(onHighlight);
      highlighter.events.select.onClear.add(onClear);

      return () => {
        highlighter.clear('select');
        highlighter.events.select.onHighlight.remove(onHighlight);
        highlighter.events.select.onClear.remove(onClear);
      };
    },
    [setSelectedElement]
  );

  // todo: Clipper event
  const setupClipper = useCallback(
    (components: OBC.Components, world: OBC.World, container: HTMLElement) => {
      const clipper = components.get(OBC.Clipper);
      clipper.enabled = true;
      clipper.visible = true;

      const handleDblClick = () => {
        if (clipper.enabled) clipper.create(world);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          (event.code === 'Delete' || event.code === 'Backspace') &&
          clipper.enabled
        ) {
          clipper.delete(world);
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
    const fragments = fragmentsRef.current;

    const containerEl = container;
    if (!isReady || !components || !world || !containerEl || !fragments) return;

    const clipper = components.get(OBC.Clipper);

    let cleanup: (() => void) | undefined;

    switch (activeTool) {
      case 'select':
        cleanup = setupHighlighter(components, world, fragments);
        break;
      case 'clip':
        cleanup = setupClipper(components, world, containerEl);
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
  }, [activeTool, container, isReady, setupClipper, setupHighlighter]);

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

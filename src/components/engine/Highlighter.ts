/* eslint-disable @typescript-eslint/no-explicit-any */
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import * as THREE from 'three';
import type { ISelectedElement } from '../store/useBIMStore';

export const setupHighlighter = (
  highlighter: OBF.Highlighter,
  world: OBC.World,
  fragments: OBC.FragmentsManager,
  setSelectedElement: (element: ISelectedElement | null) => void,
  setIsHighlighting: (loading: boolean) => void
) => {
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
    setIsHighlighting(true);
    try {
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
            const psetName: string =
              (pset.Name as any)?.value || 'Common Properties';
            const props: Record<string, any> = {};
            if (pset.HasProperties && Array.isArray(pset.HasProperties)) {
              for (const prop of pset.HasProperties) {
                const name = (prop.Name as any)?.value;
                const val = (prop.NominalValue as any)?.value;
                if (name && val !== undefined) {
                  props[name] = val;
                }
              }
            }
            psets[psetName] = props;
          }
        }

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

        setSelectedElement({
          ...flatAttributes,
          psets,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsHighlighting(false);
    }
  };

  const onClear = () => {
    setSelectedElement(null);
  };

  highlighter.events.select.onHighlight.add(onHighlight);
  highlighter.events.select.onClear.add(onClear);

  return () => {
    highlighter.enabled = false;
    highlighter.events.select.onHighlight.remove(onHighlight);
    highlighter.events.select.onClear.remove(onClear);
    highlighter.dispose();
  };
};

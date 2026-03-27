import {
  LengthMeasurement,
  AreaMeasurement,
  VolumeMeasurement,
  GraphicVertexPickerMode,
} from '@thatopen/components-front';
import type { BIMWorld } from '../../context/bim/BIMProvider';
import { FragmentsManager, type Components } from '@thatopen/components';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from 'three';

/**
 * Main Setup for Measurement tool
 * Handles sub-tools like Length, Area, Volume
 * @param components OBC components
 * @param world BIM world
 * @param container HTML container
 * @param subTool current active sub-tool ('length', 'area', 'volume', etc.)
 * @param fragments OBC fragmentsManager
 * @returns cleanup function
 */
export const setupMeasure = (
  components: Components,
  world: BIMWorld,
  container: HTMLElement,
  subTool: string,
  fragments: FragmentsManager,
  unit: string,
  precision: number = 2
) => {
  let measurement: AreaMeasurement | LengthMeasurement | VolumeMeasurement;

  switch (subTool) {
    case 'area':
      measurement = components.get(AreaMeasurement);
      break;
    case 'volume':
      measurement = components.get(VolumeMeasurement);
      break;
    case 'length':
    default:
      measurement = components.get(LengthMeasurement);
      break;
  }

  if (!measurement) return () => {};

  measurement.world = world;
  measurement.enabled = true;
  measurement.pickerSize = 12;

  const pickingMeshes: Mesh[] = [];
  const uniqueGeometries = new Set<BufferGeometry>();
  const pickingMaterial = new MeshBasicMaterial({ visible: false });

  let isSynchronousSet = false;
  const pastDelay = measurement.delay;

  if ('units' in measurement) {
    measurement.units = unit as
      | LengthMeasurement['units']
      | AreaMeasurement['units']
      | VolumeMeasurement['units'];
  }

  if ('rounding' in measurement) {
    measurement.rounding = precision;
  }

  const setupSynchronousPicking = async () => {
    if (fragments.list.size === 0) return;

    const geometries = new Map<string, BufferGeometry>();

    for (const [, model] of fragments.list) {
      const idsWithGeometry = await model.getItemsIdsWithGeometry();
      const allMeshesData = await model.getItemsGeometry(idsWithGeometry);

      for (const itemId in allMeshesData) {
        const meshData = allMeshesData[itemId];
        for (const geomData of meshData) {
          if (
            !geomData.positions ||
            !geomData.indices ||
            !geomData.transform ||
            !geomData.representationId
          ) {
            continue;
          }

          const representationId = geomData.representationId.toString();
          if (!geometries.has(representationId)) {
            const geometry = new BufferGeometry();
            geometry.setAttribute(
              'position',
              new Float32BufferAttribute(geomData.positions, 3)
            );
            geometry.setIndex(Array.from(geomData.indices));
            geometries.set(representationId, geometry);
            uniqueGeometries.add(geometry);
          }

          const geometry = geometries.get(representationId)!;

          const mesh = new Mesh(geometry, pickingMaterial);
          mesh.applyMatrix4(geomData.transform);
          mesh.updateWorldMatrix(true, true);
          pickingMeshes.push(mesh);
        }
      }
    }

    // Enable synchronous picking
    measurement.pickerMode = GraphicVertexPickerMode.SYNCHRONOUS;
    measurement.delay = 0;
    for (const mesh of pickingMeshes) {
      world.meshes.add(mesh);
    }
    isSynchronousSet = true;
  };

  setupSynchronousPicking();

  const handleClick = () => {
    if (measurement.enabled) {
      measurement.create();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!measurement.enabled) return;

    switch (event.code) {
      case 'Enter':
      case 'NumpadEnter':
        measurement.endCreation();
        break;
      case 'Delete':
      case 'Backspace':
        measurement.delete();
        break;
      default:
        break;
    }
  };

  const handleClearAll = () => {
    measurement.list.clear();
  };

  container.addEventListener('dblclick', handleClick);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('bim-measure-delete-all', handleClearAll);

  return () => {
    measurement.enabled = false;
    container.removeEventListener('dblclick', handleClick);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('bim-measure-delete-all', handleClearAll);

    if (isSynchronousSet) {
      measurement.pickerMode = GraphicVertexPickerMode.DEFAULT;
      measurement.delay = pastDelay;
      for (const mesh of pickingMeshes) {
        world.meshes.delete(mesh);
      }
    }

    pickingMeshes.length = 0;

    for (const geom of uniqueGeometries) {
      geom.dispose();
    }
    uniqueGeometries.clear();

    pickingMaterial.dispose();
  };
};

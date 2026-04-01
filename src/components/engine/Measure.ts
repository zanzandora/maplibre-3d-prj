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
  Color,
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
  measurement.color = new Color('#3183ff');

  // Clear existing measurements when tool is activated
  measurement.list.clear();

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

    for (const [modelId, model] of fragments.list) {
      const idsWithGeometry = await model.getItemsIdsWithGeometry();

      const allMeshesData = await model.getItemsGeometry(idsWithGeometry);

      for (const itemId in allMeshesData) {
        const meshData = allMeshesData[itemId];

        for (const geomData of meshData) {
          if (!geomData.positions || !geomData.indices || !geomData.transform)
            continue;

          const geometry = new BufferGeometry();
          geometry.setAttribute(
            'position',
            new Float32BufferAttribute(geomData.positions, 3)
          );
          geometry.setIndex(Array.from(geomData.indices));

          // BẮT BUỘC: Tính toán Bounding Box để Raycaster hoạt động chính xác
          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();

          uniqueGeometries.add(geometry);

          const mesh = new Mesh(geometry, pickingMaterial);
          mesh.applyMatrix4(geomData.transform);
          mesh.updateWorldMatrix(true, true);

          mesh.userData = {
            modelId: modelId,
            expressID: Number(itemId),
            fragments: model,
          };

          pickingMeshes.push(mesh);
        }
      }
    }

    measurement.pickerMode = GraphicVertexPickerMode.SYNCHRONOUS;
    measurement.delay = 0;

    for (const mesh of pickingMeshes) {
      world.meshes.add(mesh); // Thêm mesh ẩn vào world để Raycaster có cái bắn tia vào
    }

    isSynchronousSet = true;
    console.log(
      '✅ Synchronous Picking đã sẵn sàng với',
      pickingMeshes.length,
      'meshes.'
    );
  };

  // setupSynchronousPicking();

  const handleClick = () => {
    if (measurement.enabled) {
      measurement.list.clear();
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
      case 'Escape':
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

    handleClearAll();

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

import {
  LengthMeasurement,
  AreaMeasurement,
  VolumeMeasurement,
  GraphicVertexPickerMode,
} from '@thatopen/components-front';
import type { BIMWorld } from '../../context/bim/BIMProvider';
import { type FragmentsManager, type Components } from '@thatopen/components';
import { Color } from 'three';

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
  _fragments: FragmentsManager,
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

  // Explicitly set the picker mode to DEFAULT instead of SYNCHRONOUS
  // This prevents the tool from generating heavy fake meshes for raycasting,
  // avoiding memory leaks and GC pauses when dealing with thousands of elements.
  if ('pickerMode' in measurement) {
    (measurement as any).pickerMode = GraphicVertexPickerMode.DEFAULT;
  }

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

  const handleClick = () => {
    if (measurement.enabled) {
      // Clear existing measurements before creating a new one (as requested)
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
    container.removeEventListener('dblclick', handleClick);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('bim-measure-delete-all', handleClearAll);
  };
};

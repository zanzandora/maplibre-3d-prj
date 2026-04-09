import {
  LengthMeasurement,
  AreaMeasurement,
  GraphicVertexPickerMode,
} from "@thatopen/components-front";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from "three";

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
  components,
  world,
  container,
  subTool,
  fragments,
  unit,
  precision = 2,
) => {
  let measurement;

  switch (subTool) {
    case "area":
      measurement = components.get(AreaMeasurement);
      break;
    case "length":
    default:
      measurement = components.get(LengthMeasurement);
      break;
  }

  if (!measurement) return () => {};

  measurement.world = world;
  measurement.enabled = true;
  measurement.pickerSize = 12;
  measurement.color = new Color("#3183ff");

  // Explicitly set the picker mode to DEFAULT instead of SYNCHRONOUS
  // This prevents the tool from generating heavy fake meshes for raycasting,
  // avoiding memory leaks and GC pauses when dealing with thousands of elements.
  if ("pickerMode" in measurement) {
    measurement.pickerMode = GraphicVertexPickerMode.DEFAULT;
  }

  // Clear existing measurements when tool is activated
  measurement.list.clear();

  if ("units" in measurement) {
    measurement.units = unit;
  }

  if ("rounding" in measurement) {
    measurement.rounding = precision;
  }

  const pickingMeshes = [];
  const uniqueGeometries = new Set();
  const pickingMaterial = new MeshBasicMaterial({ visible: false });

  let isSynchronousSet = false;
  const pastDelay = measurement.delay;

  const setupSynchronousPicking = async () => {
    if (fragments.list.size === 0) return;

    // Lặp qua tất cả các fragments (models) đã load
    for (const [modelId, model] of fragments.list) {
      const idsWithGeometry = await model.getItemsIdsWithGeometry();

      const allMeshesData = await model.getItemsGeometry(idsWithGeometry);

      for (const itemId in allMeshesData) {
        const meshData = allMeshesData[itemId];

        for (const geomData of meshData) {
          if (!geomData.positions || !geomData.indices || !geomData.transform)
            continue;

          // Tạo Geometry chuẩn Three.js
          const geometry = new BufferGeometry();
          geometry.setAttribute(
            "position",
            new Float32BufferAttribute(geomData.positions, 3),
          );
          geometry.setIndex(Array.from(geomData.indices));

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
      world.meshes.add(mesh);
    }

    isSynchronousSet = true;
    console.log(
      "✅ Synchronous Picking đã sẵn sàng với",
      pickingMeshes.length,
      "meshes.",
    );
  };

  setupSynchronousPicking();

  const handleClick = () => {
    if (measurement.enabled) {
      // Clear existing measurements before creating a new one (as requested)
      measurement.list.clear();
      measurement.create();
    }
  };

  const handleKeyDown = (event) => {
    if (!measurement.enabled) return;

    switch (event.code) {
      case "Enter":
      case "NumpadEnter":
        measurement.endCreation();
        break;
      case "Delete":
      case "Backspace":
      case "Escape":
        measurement.delete();
        break;
      default:
        break;
    }
  };

  const handleClearAll = () => {
    measurement.list.clear();
  };

  container.addEventListener("dblclick", handleClick);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("bim-measure-delete-all", handleClearAll);

  return () => {
    measurement.enabled = false;

    container.removeEventListener("dblclick", handleClick);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("bim-measure-delete-all", handleClearAll);

    if (isSynchronousSet) {
      measurement.pickerMode = GraphicVertexPickerMode.DEFAULT;
      measurement.delay = pastDelay;

      for (const mesh of pickingMeshes) {
        world.meshes.delete(mesh);
      }
    }

    pickingMeshes.length = 0;
    for (const geom of uniqueGeometries) {
      geom.dispose(); // Giải phóng GPU Memory
    }
    uniqueGeometries.clear();
    pickingMaterial.dispose();
  };
};

import { Euler, Vector3 } from 'three';

//  dữ liệu gốc của model
export interface ModelData {
  name: string;
  file: string;
  assetId: number;
  lng: number;
  lat: number;
  height: number;
  yaw: number;
  pitch: number;
  roll: number;
  scale: number;
}

// instance trong Three.js
export type InstanceData = {
  id: string;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
};

// dữ liệu Map cho việc render instancing
export type GroupedInstances = Record<string, InstanceData[]>;

// tọa độ trung tâm Mercato
export interface CenterCoordinate {
  x: number;
  y: number;
  z: number;
  meterScale: number;
}

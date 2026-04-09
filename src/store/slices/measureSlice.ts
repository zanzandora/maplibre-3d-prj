import type { StateCreator } from 'zustand';
import type { BIMState } from '../useBIMStore';

export const UNIT_OPTIONS: Record<string, string[]> = {
  length: ['mm', 'cm', 'm', 'km'],
  area: ['mm2', 'cm2', 'm2', 'km2'],
};

/*
  Quản lý các thiết lập đo lường trong ứng dụng.
  Lưu trữ đơn vị và độ chính xác để các công cụ đo (Length, Area, Volume) 
  có thể truy xuất và hiển thị kết quả đồng nhất.
*/
export interface MeasureSlice {
  measureBaseUnitIndex: number; // 0: mm, 1: cm, 2: m, 3: km
  measurePrecision: number;
  setMeasureBaseUnitIndex: (index: number) => void;
  setMeasurePrecision: (precision: number) => void;
}

export const createMeasureSlice: StateCreator<
  BIMState,
  [],
  [],
  MeasureSlice
> = (set) => ({
  measureBaseUnitIndex: 2, // Default: 'm' (Index 2 in UNIT_OPTIONS)
  measurePrecision: 2,

  setMeasureBaseUnitIndex: (index) => set({ measureBaseUnitIndex: index }),
  setMeasurePrecision: (precision) => set({ measurePrecision: precision }),
});

import type { StateCreator } from 'zustand';
import type { BIMState } from '../useBIMStore';

/*
  Quản lý các thiết lập đo lường trong ứng dụng.
  Lưu trữ đơn vị và độ chính xác để các công cụ đo (Length, Area, Volume) 
  có thể truy xuất và hiển thị kết quả đồng nhất.
*/
export interface MeasureSlice {
  measureUnit: string;
  measurePrecision: number;
  setMeasureUnit: (unit: string) => void;
  setMeasurePrecision: (precision: number) => void;
}

export const createMeasureSlice: StateCreator<
  BIMState,
  [],
  [],
  MeasureSlice
> = (set) => ({
  measureUnit: 'm',
  measurePrecision: 2,

  setMeasureUnit: (unit) => set({ measureUnit: unit }),
  setMeasurePrecision: (precision) => set({ measurePrecision: precision }),
});

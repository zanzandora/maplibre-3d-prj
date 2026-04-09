export const UNIT_OPTIONS = {
  length: ["mm", "cm", "m", "km"],
  area: ["mm2", "cm2", "m2", "km2"],
};

/*
  Quản lý các thiết lập đo lường trong ứng dụng.
  Lưu trữ đơn vị và độ chính xác để các công cụ đo (Length, Area, Volume) 
  có thể truy xuất và hiển thị kết quả đồng nhất.
*/

export const createMeasureSlice = (set) => ({
  measureBaseUnitIndex: 2, // Default: 'm' (Index 2 in UNIT_OPTIONS)
  measurePrecision: 2,

  setMeasureBaseUnitIndex: (index) => set({ measureBaseUnitIndex: index }),
  setMeasurePrecision: (precision) => set({ measurePrecision: precision }),
});

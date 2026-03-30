import type { StateCreator } from 'zustand';
import type { BIMState } from '../useBIMStore';

/*
  Quản lý trạng thái hiển thị (Hider) của các phần tử trong không gian 3D.
  Lưu trữ danh sách IDs đang bị ẩn để đồng bộ hóa giao diện cây (Icon Mắt).
*/
export interface VisibilitySlice {
  hiddenIds: Set<string | number>;
  toggleVisibility: (id: string | number, visible?: boolean) => void;
  resetVisibility: () => void;
}

export const createVisibilitySlice: StateCreator<
  BIMState,
  [],
  [],
  VisibilitySlice
> = (set) => ({
  hiddenIds: new Set(),

  toggleVisibility: (id, visible) =>
    set((state) => {
      const nextHidden = new Set(state.hiddenIds);
      const isCurrentlyHidden = nextHidden.has(id);
      
      // Nếu visible được truyền vào, ta thiết lập dựa trên giá trị đó, ngược lại đảo trạng thái hiện tại.
      const shouldBeHidden =
        visible !== undefined ? !visible : !isCurrentlyHidden;

      if (shouldBeHidden) {
        nextHidden.add(id);
      } else {
        nextHidden.delete(id);
      }
      return { hiddenIds: nextHidden };
    }),

  resetVisibility: () => set({ hiddenIds: new Set() }),
});

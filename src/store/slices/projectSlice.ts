import type { StateCreator } from 'zustand';
import type { BIMState } from '../useBIMStore';

/*
  Định nghĩa cấu trúc dữ liệu cho một Dự án (Project/Model).
  Mỗi dự án bao gồm ID duy nhất, tên hiển thị và đường dẫn đến file model (.frag).
*/
export interface Project {
  id: string;
  name: string;
  url: string;
}

/*
  Quản lý danh sách dự án và dự án hiện tại đang được tải.
  Giúp kiểm soát việc chuyển đổi giữa các mô hình khác nhau trong Viewer.
*/
export interface ProjectSlice {
  projects: Project[];
  currentProjectId: string | null;
  isModelLoading: boolean;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (projectId: string) => void;
  setIsModelLoading: (loading: boolean) => void;
}

export const createProjectSlice: StateCreator<
  BIMState,
  [],
  [],
  ProjectSlice
> = (set) => ({
  // Danh sách dự án mặc định (Mock Data)
  projects: [
    { id: 'school_str', name: 'Nhà A', url: '/school_str.frag' },
    { id: 'small_test', name: 'Nhà B', url: '/small_test.frag' },    
  ],
  currentProjectId: 'small_test',
  isModelLoading: false,

  setProjects: (projects) => set({ projects }),

  /*
    Cập nhật ID dự án hiện tại. 
    Việc thay đổi ID này sẽ kích hoạt logic tải model trong BIMViewer.
  */
  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

  setIsModelLoading: (loading) => set({ isModelLoading: loading }),
});

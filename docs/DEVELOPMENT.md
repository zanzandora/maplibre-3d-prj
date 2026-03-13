# 3D WebGIS Project: MapLibre + R3F Integration

Tài liệu tóm tắt cấu trúc, luồng xử lý và hướng dẫn phát triển hệ thống hiển thị 1,000+ model 3D hiệu năng cao.

## 1. Kiến trúc thư mục (Folder Structure)

Dự án được tổ chức theo mô hình Modular để tách biệt logic bản đồ, logic render 3D và quản lý tài nguyên:

- `src/components/map/`: Chứa `MapView.tsx` - Khởi tạo MapLibre GL JS & MapTiler SDK.
- `src/components/map3d/`:
  - `MapThreeLayer.tsx`: Lớp phủ R3F Overlay.
  - `Lights.tsx`: Cấu hình ánh sáng tập trung cho Scene 3D.
- `src/engine/`:
  - `CameraSync.tsx`: Logic đồng bộ ma trận Camera giữa MapLibre và Three.js.
  - `InstanceRenderer.tsx`: Logic tối ưu GPU Instancing & LOD.
  - `MapClickInterceptor.tsx`: Xử lý tương tác click model 3D.
- `src/loader/`:
  - `GLBLoader.ts`: Centralized cache và batch preloading.
  - `ModelManager.tsx`: Quản lý phân bổ model và dữ liệu.
- `src/utils/`: Chứa các hàm tiện ích về tọa độ và hằng số.

## 2. Luồng xử lý chính (Core Flow)

1.  **Khởi tạo Map:** `MapView` thiết lập MapTiler SDK, API Key và Terrain.
2.  **Đồng bộ Camera:**
    - `MapThreeLayer` sử dụng `CameraSync` để tạo một Custom Layer trong MapLibre.
    - Ma trận được trích xuất và inject trực tiếp vào R3F Camera trong mỗi frame render.
3.  **Quản lý Địa hình:** `ModelManager` sử dụng hook `useElevationScanner` để đảm bảo model luôn bám sát mặt đất ngay cả khi terrain đang tải.
4.  **Tối ưu Render:** Sử dụng `InstancedMesh` kết hợp với hệ thống LOD (Level of Detail) tự động chuyển đổi dựa trên mức Zoom.

## 3. Các cập nhật quan trọng (Key Updates)

- **Decoupled Architecture:** Tách rời logic đồng bộ camera và ánh sáng khỏi layer chính, giúp code gọn gàng và dễ bảo trì hơn.
- **Hook-based Elevation:** Chuyển logic quét địa hình phức tạp sang `useElevationScanner`, hỗ trợ quét liên tục (Continuous Scanning).
- **Batch Preloading:** Giảm thiểu hiện tượng "pop-in" khi model xuất hiện bằng cách tải trước tài nguyên qua `GLBLoader`.

## 4. Hướng dẫn cho Developer

### Thêm Model mới:

1. Thêm file `.glb` vào `public/map3d/`.
2. Cập nhật `buildings.json` với thông tin tọa độ và tên file.
3. Hệ thống sẽ tự động preload và hiển thị.

### Kiểm tra hiệu năng:

- Sử dụng `r3f-perf` (nếu đã bật) hoặc Chrome DevTools.
- Đảm bảo số lượng Draw Calls được giữ ở mức thấp thông qua Instancing.

## 5. Lệnh chạy dự án

```bash
pnpm install
pnpm dev
```

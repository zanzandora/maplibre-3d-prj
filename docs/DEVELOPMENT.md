# 3D WebGIS Project: MapLibre + R3F Integration

Tài liệu tóm tắt cấu trúc, luồng xử lý và hướng dẫn phát triển hệ thống hiển thị 1,000+ model 3D hiệu năng cao.

## 1. Kiến trúc thư mục (Folder Structure)

Dự án được tổ chức theo mô hình Modular để tách biệt logic bản đồ, logic render 3D và quản lý tài nguyên:

- `src/components/map/`: Chứa `MapView.tsx` - Khởi tạo MapLibre GL JS.
- `src/components/map3d/`: Chứa `MapThreeLayer.tsx` (Hybrid Sync Bridge).
- `src/engine/`: Chứa `InstanceRenderer.tsx` - Logic tối ưu GPU Instancing & LOD.
- `src/loader/`: Chứa `GLBLoader.ts` (Batch Preloading) và `ModelManager.tsx` (Quản lý phân bổ model & Elevation Scanning).
- `src/utils/`: Chứa `coordinate.ts` - Các hàm toán học chuyển đổi hệ tọa độ WGS84 sang Web Mercator.

## 2. Luồng xử lý chính (Core Flow - Hybrid Sync)

1.  **Khởi tạo Map:** `MapView` tạo instance MapLibre và xác định một điểm gốc (`centerCoord`).
2.  **Đồng bộ Camera (Hybrid):**
    - `MapThreeLayer` thêm một Custom Layer vào MapLibre.
    - Trong mỗi frame `render` của layer này, ma trận camera được trích xuất và "inject" trực tiếp vào `projectionMatrix` của R3F Camera.
    - Canvas R3F được đặt làm lớp phủ (Overlay) tuyệt đối trên bản đồ.
3.  **Tối ưu Render:**
    - Sử dụng `THREE.InstancedMesh` qua `InstanceRenderer`.
    - **LOD:** Tự động chuyển đổi giữa Model chi tiết và Bounding Box dựa trên mức Zoom.
4.  **Tọa độ & Địa hình:**
    - Chuyển đổi LngLat sang đơn vị Mercator tương đối.
    - **Elevation Scanning:** Tự động truy vấn cao độ địa hình từ MapLibre và áp dụng vào model 3D.

## 3. Các cập nhật quan trọng (Key Updates)

- **LOD System:** Đã triển khai render Bounding Box ở mức zoom thấp, giúp cải thiện hiệu năng đáng kể khi nhìn toàn cảnh.
- **Continuous Elevation Scanning:** Khắc phục lỗi model bị lơ lửng khi load trang lần đầu. Hệ thống tự động quét cho đến khi khớp địa hình.
- **Model Highlighting:** Hỗ trợ đổi màu model ngay khi click mà không bị trễ frame.
- **Batch Preloading:** Sử dụng `Suspense` kết hợp với tải trước tài nguyên để tránh hiện tượng giật lag khi model xuất hiện.

## 4. Hướng dẫn cho Developer

### Thêm Model mới:

1. Đảm bảo file `.glb` nằm trong thư mục `public/`.
2. Cập nhật dữ liệu trong `buildings.json` với đường dẫn file tương ứng.
3. `ModelManager` sẽ tự động nhận diện, preload và render thông qua `InstanceRenderer`.

### Quản lý Trạng thái Chọn (Selection):

Sử dụng `selectedId` trong `ModelManager`. Khi muốn đổi màu highlight, hãy điều chỉnh `HIGHLIGHT_COLOR` trong `InstanceRenderer.tsx`.

### Kiểm tra hiệu năng:

- Sử dụng Chrome DevTools (FPS Meter).
- Kiểm tra số lượng `instancedMesh` được tạo ra trong Three.js tab (nên tối thiểu hóa số lượng này).

## 5. Lệnh chạy dự án

```bash
pnpm install
pnpm dev
```

# 3D WebGIS Project: MapLibre + R3F Integration

Tài liệu tóm tắt cấu trúc, luồng xử lý và hướng dẫn phát triển hệ thống hiển thị 1,000+ model 3D hiệu năng cao.

## 1. Kiến trúc thư mục (Folder Structure)

Dự án được tổ chức theo mô hình Modular để tách biệt logic bản đồ, logic render 3D và quản lý tài nguyên:

- `src/components/map/`: Chứa `MapView.tsx` - Khởi tạo MapLibre GL JS.
- `src/components/map3d/`: Chứa `MapThreeLayer.tsx` (Hybrid Sync Bridge).
- `src/engine/`: Chứa `InstanceRenderer.tsx` - Logic tối ưu GPU Instancing.
- `src/loader/`: Chứa `GLBLoader.ts` (Cache) và `ModelManager.tsx` (Quản lý phân bổ model).
- `src/utils/`: Chứa `coordinate.ts` - Các hàm toán học chuyển đổi hệ tọa độ WGS84 sang Web Mercator.

## 2. Luồng xử lý chính (Core Flow - Hybrid Sync)

1.  **Khởi tạo Map:** `MapView` tạo instance MapLibre và xác định một điểm gốc (`centerCoord`).
2.  **Đồng bộ Camera (Hybrid):** 
    - `MapThreeLayer` thêm một Custom Layer "giả" vào MapLibre.
    - Trong mỗi frame `render` của layer này, ma trận camera được trích xuất và "inject" trực tiếp vào `projectionMatrix` của R3F Camera.
    - Canvas R3F được đặt làm lớp phủ (Overlay) tuyệt đối trên bản đồ.
3.  **Tối ưu Render:** 
    - Sử dụng `THREE.InstancedMesh` qua `InstanceRenderer`.
    - Tận dụng hệ sinh thái R3F (`@react-three/drei`) một cách tự nhiên mà không lo xung đột Context.
4.  **Tọa độ:** `coordinate.ts` chuyển đổi LngLat sang đơn vị Mercator [0, 1]. Sau đó trừ đi `centerCoord` để có tọa độ tương đối trong không gian Three.js.

## 3. Các cập nhật quan trọng (Key Updates)

- **Hybrid Sync:** Đã chuyển sang mô hình Overlay Canvas. Điều này giải quyết triệt để lỗi "Context lost" và xung đột khi MapLibre và Three.js cùng tranh giành tài nguyên WebGL.
- **GPU Instancing:** Đã triển khai `InstancedMesh`, hỗ trợ render hàng ngàn vật thể mà vẫn duy trì FPS > 40.
- **Raycasting:** Tích hợp sẵn trong `InstanceRenderer` qua `onPointerDown`. Lưu ý: Do Canvas dùng `pointerEvents: none`, cần cấu hình thêm nếu muốn click xuyên thấu/tương tác phức tạp hơn.
- **Asset Cache:** Sử dụng `@react-three/drei` để tự động cache model GLB.


## 4. Hướng dẫn cho Developer

### Thêm Model mới:
1. Mở `src/loader/ModelManager.tsx`.
2. Thêm một block `InstanceRenderer` mới với URL của file `.glb`.
3. Truyền mảng dữ liệu vị trí/xoay/tỉ lệ vào prop `instances`.

### Thay đổi tọa độ trung tâm:
Cập nhật tham số trong `useMemo` tại `MapView.tsx`:
```typescript
const centerCoord = useMemo(() => WGS84_TO_MERCATOR(lng, lat, 0), []);
```

### Kiểm tra hiệu năng:
- Mở Chrome DevTools -> Rendering -> FPS Meter.
- Đảm bảo số lượng Draw Calls (trong Three.js Inspector) không tăng tỷ lệ thuận với số lượng model.

## 5. Lệnh chạy dự án
```bash
pnpm install
pnpm dev
```

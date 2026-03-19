# Hướng dẫn Phát triển 3D WebGIS (MapLibre GL JS + R3F)

Tài liệu hướng dẫn quy trình phát triển, cấu trúc và các quy tắc sống còn khi làm việc với kiến trúc Shared Context tích hợp MapLibre GL JS.

## 0. Kiến trúc MapLibre GL JS

Dự án sử dụng MapLibre GL JS (v5+) làm nhân bản đồ lõi. Đây là thư viện mã nguồn mở mạnh mẽ, hỗ trợ render 3D, địa hình (Terrain) và Custom Layers với hiệu năng cao.

### 1. Đồng bộ hóa React vs MapLibre

Do sử dụng `createRoot` của R3F để ký sinh vào WebGL Context của MapLibre thông qua Custom Layer, chúng ta có hai "vũ trụ" React khác nhau trong cùng một ứng dụng:

- **Main React App:** Quản lý UI, Map Container (`MapView`), và các Logic chung.
- **R3F Parasitic Root:** Quản lý Model 3D, Lights, và các Object3D. Được render bên trong hàm `onAdd` của Custom Layer.

**Quy tắc:** Để truyền dữ liệu giữa hai vũ trụ này, hãy sử dụng **Props** thông qua component `MapThreeLayer`.

### 2. Hệ tọa độ và Ma trận (Coordinate Systems)

- **MapLibre GL JS:** Sử dụng hệ tọa độ Z-up (Z là độ cao). Đơn vị là Mercator (0,0 đến 1,1).
- **Three.js:** Sử dụng hệ tọa độ Y-up (Y là độ cao). Đơn vị là Meters (thế giới thực).

**Giải pháp:** Chúng ta sử dụng một `WORLD_MATRIX` trong `MapThreeLayer.tsx` để thực hiện tráo đổi trục Y/Z ngay tại Camera, giúp lập trình viên 3D có thể code model theo chuẩn Y-up tự nhiên của Three.js.

### 3. Quy trình Thêm Model mới

1.  **Dữ liệu:** Thêm thông tin vào `public/map3d/ivory/buildings.json` (lng, lat, height, yaw, file...).
2.  **File 3D:** Đặt file GLB vào `public/map3d/ivory/`.
3.  **Terrain Sync:** `ModelManager` sẽ tự động truy vấn MapLibre (`queryTerrainElevation`) để lấy cao độ địa hình và cộng dồn vào trục `Y` của model.

---

## 4. Tối ưu hóa Hiệu năng (MapLibre GL JS)

- **Worker Management:** MapLibre cho phép giới hạn số lượng Workers. Hãy sử dụng `maplibregl.setWorkerCount()` để tránh nghẽn Main Thread.
- **Request Throttling:** Sử dụng `transformRequest` để ưu tiên các tile địa hình (Terrain/DEM) cao hơn tile bản đồ bình thường.
- **Instanced Rendering:** Luôn sử dụng `InstanceRenderer` cho các model lặp lại (cây cối, đèn đường, biệt thự mẫu) để giảm Draw Calls.

---
*Tài liệu được cập nhật dựa trên kiến trúc Shared Context v3 - Di chuyển hoàn toàn sang MapLibre GL JS.*

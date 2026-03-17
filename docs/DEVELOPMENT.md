# Hướng dẫn Phát triển 3D WebGIS (MapLibre + R3F)

Tài liệu hướng dẫn quy trình phát triển, cấu trúc và các quy tắc sống còn khi làm việc với kiến trúc Shared Context.

## 1. Cấu trúc và Quy tắc "Ngăn sông cách chợ"
Do sử dụng `createRoot` của R3F để ký sinh vào MapLibre, chúng ta có hai "vũ trụ" React khác nhau trong cùng một ứng dụng:

### Vũ trụ 1: Map Context (Gốc)
- Chứa các component của `react-map-gl` như `<Map>`, `<Source>`, `<Layer>`, `<TerrainControl>`.
- **Nhiệm vụ:** Quản lý bản đồ, dữ liệu nền và giao diện 2D.

### Vũ trụ 2: R3F Context (Ký sinh)
- Nằm bên trong `<MapThreeLayer>`.
- Chứa các component của Three.js như `<ambientLight>`, `<mesh>`, `<ModelManager>`.
- **Nhiệm vụ:** Quản lý nội dung 3D.

**QUY TẮC SỐNG CÒN:** Không bao giờ render thẻ `<Source>` hay `<Layer>` bên trong `<MapThreeLayer>`. Điều này sẽ gây lỗi **Context Loss** và làm crash ứng dụng ngay lập tức.

## 2. Luồng xử lý Tọa độ (Standard Workflow)
Khi thêm một model mới, hãy tuân thủ hệ trục **Y-up**:

1.  **Input:** Tọa độ WGS84 (`lng`, `lat`) và cao độ thực tế (`alt`).
2.  **Conversion:** Sử dụng `getRelativePosition` trong `coordinate.ts`.
    - Trục `Y` kết quả chính là độ cao (Altitude).
    - Trục `Z` là hướng Nam (Latitude).
3.  **Terrain Sync:** `ModelManager` sẽ tự động hỏi MapLibre về cao độ địa hình và cộng dồn vào trục `Y` của model.

## 3. Quy trình thêm Asset mới
1.  **File:** Bỏ file `.glb` vào `public/map3d/`.
2.  **Metadata:** Cập nhật file JSON dữ liệu (ví dụ: `buildings.json`) với các thông số:
    - `yaw/pitch/roll`: Xoay model (đơn vị Độ).
    - `scale`: Tỉ lệ phóng to/thu nhỏ.
3.  **Verify:** Kiểm tra tại mức Zoom 16 để thấy model GLB và Zoom < 16 để thấy khối Box (LOD).

## 4. Tối ưu hóa Hiệu năng
- **Pre-allocation:** Tuyệt đối không dùng từ khóa `new THREE.Matrix4()` hay `new THREE.Vector3()` bên trong các hàm `render` hoặc `useFrame`. Hãy khai báo chúng ở ngoài component hoặc dùng `useMemo`.
- **Repaint Control:** Chỉ gọi `map.triggerRepaint()` khi thực sự có thay đổi về trạng thái render 3D để tiết kiệm pin/CPU cho thiết bị người dùng.

---
*Tài liệu được cập nhật dựa trên kiến trúc Shared Context v2 - Đồng bộ Y-up và Chống Drape Occlusion.*

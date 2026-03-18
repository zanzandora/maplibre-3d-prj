# Hướng dẫn Phát triển 3D WebGIS (MapTiler SDK + R3F)

Tài liệu hướng dẫn quy trình phát triển, cấu trúc và các quy tắc sống còn khi làm việc với kiến trúc Shared Context tích hợp MapTiler SDK.

## 0. Tại sao chọn MapTiler SDK thay vì MapLibre?

Mặc dù MapTiler SDK được xây dựng trên lõi của MapLibre GL JS, dự án này chuyển sang sử dụng SDK vì các lý do chiến lược sau:

1.  **Tối ưu hóa Terrain-RGB v2:** MapTiler SDK cung cấp khả năng xử lý địa hình 3D (DEM) mượt mà hơn, giảm thiểu hiện tượng "jitter" khi render model 3D trên địa hình nhấp nhô.
2.  **Quản lý tài nguyên thông minh:** Tích hợp sẵn cơ chế giới hạn Workers và điều phối Parallel Requests, giúp giải phóng Main Thread cho các tác vụ tính toán 3D nặng của Three.js.
3.  **Tích hợp sâu với MapTiler Cloud:** Tự động hóa việc nạp Style, Sprite và Terrain-RGB mà không cần cấu hình thủ công phức tạp như MapLibre truyền thống.

### Bảng so sánh MapTiler SDK vs MapLibre GL JS

| Tính năng | MapLibre GL JS | MapTiler SDK |
| :--- | :--- | :--- |
| **Engine lõi** | Open-source (Fork của Mapbox) | Kế thừa từ MapLibre |
| **Địa hình (Terrain)** | Hỗ trợ Raster-DEM tiêu chuẩn | Tối ưu hóa Terrain-RGB v2 (Hiệu suất cao hơn) |
| **Hiệu năng 3D** | Tốt, nhưng cần cấu hình thủ công | Tích hợp sẵn cơ chế Throttling & Worker Management |
| **Styles & Assets** | Nạp qua URL thủ công | Hỗ trợ nạp Style thông minh qua API Key |
| **Hệ sinh thái** | Cộng đồng lớn, thuần kỹ thuật | Hỗ trợ thương mại, độ ổn định cao cho dự án lớn |
| **Shared Context** | Phải tự xử lý WebGL State | Hỗ trợ tốt hơn cho việc can thiệp WebGL Context |

## 1. Cấu trúc và Quy tắc "Ngăn sông cách chợ"
Do sử dụng `createRoot` của R3F để ký sinh vào WebGL Context của MapTiler SDK thông qua Custom Layer, chúng ta có hai "vũ trụ" React khác nhau trong cùng một ứng dụng:

### Vũ trụ 1: Map Context (Gốc)
- Chứa các component của `react-map-gl` như `<Map>`, `<Source>`, `<Layer>`, `<TerrainControl>`.
- **Nhiệm vụ:** Quản lý bản đồ, dữ liệu nền và giao diện 2D. Sử dụng `mapLib={maptilersdk}` để tối ưu hóa hiệu suất.

### Vũ trụ 2: R3F Context (Ký sinh)
- Nằm bên trong `<MapThreeLayer>`.
- Chứa các component của Three.js như `<ambientLight>`, `<mesh>`, `<ModelManager>`.
- **Nhiệm vụ:** Quản lý nội dung 3D (GLB Models, Instances).

**QUY TẮC SỐNG CÒN:** Không bao giờ render thẻ `<Source>` hay `<Layer>` bên trong `<MapThreeLayer>`. Điều này sẽ gây lỗi **Context Loss** và làm crash ứng dụng ngay lập tức do R3F không hiểu các component này của MapLibre/MapTiler.

## 2. Luồng xử lý Tọa độ (Standard Workflow)
Khi thêm một model mới, hãy tuân thủ hệ trục **Y-up** của Three.js:

1.  **Input:** Tọa độ WGS84 (`lng`, `lat`) và cao độ thực tế (`alt`).
2.  **Conversion:** Sử dụng `getRelativePosition` trong `coordinate.ts` để chuyển sang tọa độ Mercator địa phương.
    - Trục `Y` kết quả chính là độ cao (Altitude).
    - Trục `Z` là hướng Nam (Latitude).
3.  **Terrain Sync:** `ModelManager` sẽ tự động truy vấn MapTiler SDK (`queryTerrainElevation`) để lấy cao độ địa hình và cộng dồn vào trục `Y` của model.

## 3. Quy trình thêm Asset mới
1.  **File:** Bỏ file `.glb` đã được tối ưu (Draco compression) vào `public/map3d/`.
2.  **Metadata:** Cập nhật file JSON dữ liệu (ví dụ: `buildings.json`) với các thông số:
    - `yaw/pitch/roll`: Xoay model (đơn vị Độ).
    - `scale`: Tỉ lệ phóng to/thu nhỏ.
3.  **Verify:** Kiểm tra sự đồng bộ khi xoay/nghiêng bản đồ. Model phải bám chặt mặt đất nhờ logic đồng bộ ma trận trong `MapThreeLayer`.

## 4. Tối ưu hóa Hiệu năng (MapTiler SDK)
- **Worker Management:** MapTiler SDK cho phép giới hạn số lượng Workers. Hãy sử dụng `maptilersdk.setWorkerCount()` để tránh nghẽn Main Thread.
- **Request Throttling:** Sử dụng `transformRequest` để ưu tiên các tile Terrain/DEM, giúp việc snap model 3D diễn ra nhanh hơn.
- **Pre-allocation:** Tuyệt đối không khởi tạo Object mới (`new THREE.Matrix4()`) bên trong hàm `render` của Custom Layer. Hãy sử dụng các biến global hằng số để tái sử dụng bộ nhớ.

---
*Tài liệu được cập nhật dựa trên kiến trúc Shared Context v2 - Chuyển đổi sang MapTiler SDK và Đồng bộ Y-up.*

# Giải thích Cơ chế Render 3D và Tối ưu hóa hiệu năng (MapLibre GL JS)

Tài liệu này giải thích các kỹ thuật "đột phá" giúp render 1,000+ model GLB mượt mà trên nền địa hình 3D nhấp nhô của MapLibre GL JS.

## 1. Cơ chế tính toán cao độ địa hình (Terrain Snap)

Do model 3D được đặt tại vị trí kinh độ/vĩ độ (Longitude/Latitude) cụ thể, chúng cần phải "bám" sát vào địa hình thay vì lơ lửng trên không trung.

1.  **Throttled Polling:** Thay vì tính toán cao độ ở mỗi frame (gây quá tải CPU), chúng ta chỉ tính toán khi bản đồ ở trạng thái `idle` hoặc sau khi người dùng kết thúc thao tác di chuyển (`moveend`).
2.  **Data-Targeted Listening:** Lắng nghe chính xác sự kiện `data` từ MapLibre, chỉ kích hoạt tính toán khi `sourceId` chứa từ khóa `terrain`.
3.  **Elevation Cache:** Kết quả cao độ được lưu trữ trong một React State (`elevations`) và chỉ cập nhật khi cần thiết, giúp tránh các lần gọi `queryTerrainElevation` dư thừa.

## 2. Bảo vệ Model khỏi lớp "Drape" của MapLibre GL JS

Trong MapLibre GL JS (v5+), lớp **Drape** (dán đường giao thông, vùng xanh lên địa hình) thường chiếm quyền kiểm soát Depth Buffer, dẫn đến việc model bị biến mất sau khi bản đồ vẽ xong địa hình.

**Giải pháp:** Trong hàm `render` của Custom Layer, chúng ta thực hiện:

- `gl.enable(gl.DEPTH_TEST)`: Ép trình duyệt luôn kiểm tra độ sâu.
- `renderer.resetState()`: Reset trạng thái WebGL của Three.js để khớp với trạng thái của MapLibre.

## 3. Instanced Rendering (Kỹ thuật mấu chốt)

Thay vì tạo 1,000 model GLB riêng lẻ (1,000 Draw Calls), chúng ta sử dụng `THREE.InstancedMesh`.

- **Cấu trúc:** Một `InstancedMesh` duy nhất cho mỗi loại model (ví dụ: Biệt thự loại A).
- **Hiệu năng:** Giảm thiểu tối đa việc truyền dữ liệu từ CPU lên GPU. 1,000 căn biệt thự giờ chỉ tốn **1 Draw Call**.
- **Frustum Culling:** `ModelManager` tự động lọc bỏ các model nằm ngoài tầm nhìn trước khi đưa vào renderer, giúp tiết kiệm tài nguyên GPU.

## 5. Hệ tọa độ & Độ chính xác (VGMMaps Standard)

Để tích hợp 3D Tiles độ phân giải cao vào không gian Mercator của MapLibre mà không bị rung (jitter), chúng ta sử dụng quy trình chuyển đổi 3 bước:

### A. Root Bounding Sphere (Bối cảnh toàn cục)

Tileset cha (root) có một tâm điểm được xác định bởi **Trọng tâm hình cầu (Bounding Sphere)** bao quanh toàn bộ dữ liệu dự án.

- **Mục đích:** Điểm này giúp Engine thực hiện **Frustum Culling** cực nhanh. Nếu hình cầu này nằm ngoài tầm mắt của camera, toàn bộ tileset sẽ bị bỏ qua để tiết kiệm tài nguyên.
- **Triển khai:** Chúng ta chuyển đổi toàn bộ tileset từ tọa độ Trái đất (ECEF) sang hệ ENU (East-North-Up) cục bộ dựa trên logic trọng tâm này.

### B. RTC_CENTER (Độ chính xác cấp độ Tile)

Mỗi file tile riêng lẻ (ví dụ `.i3dm` cho instanced buildings) sử dụng một **RTC_CENTER** riêng.

- **Cấu trúc:** `RTC_CENTER` cho một file `.i3dm` thường là vị trí của **căn nhà đầu tiên** được tìm thấy trong nhóm dữ liệu đó.
- **Ưu điểm:** Bằng cách lưu tọa độ tương đối với tâm cục bộ này (thay vì tâm Trái đất), chúng ta giữ được độ chính xác đến từng milimet và loại bỏ hiện tượng "shaking" (sai số số thực dấu phẩy động) khi quan sát ở khoảng cách gần.

### C. Quy trình Chuyển đổi (Transformation Pipeline)

1.  **Tileset ECEF:** Tọa độ toàn cầu so với tâm Trái đất (WGS84).
2.  **ENU Translation:** `TilesetAlignment` áp dụng ma trận nghịch đảo của ENU frame tại `MAP_CENTER`. Việc này đưa tileset về gốc `(0,0,0)` trong Scene Three.js của chúng ta.
3.  **Mercator Sync:** `worldMatrix` trong `Tiles3DLayer` sau đó sẽ ánh xạ gốc `(0,0,0)` này vào đúng tọa độ Mercator tương ứng trên MapLibre.

## 6. Tham chiếu Độ cao: Ellipsoid vs. Geoid

- **Cesium Tiles:** Thường tham chiếu theo **WGS84 Ellipsoid**.
- **MapLibre Terrain:** Thường tham chiếu theo **Mean Sea Level (MSL)** hoặc mô hình Geoid.
- **Lưu ý:** Có thể cần một sai số cao độ nhỏ (khoảng 30-100m tùy vị trí) để đặt các công trình khớp hoàn hảo lên bề mặt địa hình MapLibre.

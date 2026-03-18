# Quản lý Rủi ro và Phân tích Thất bại (Failure Analysis) v2 (MapTiler SDK)

Tài liệu này phân tích các kịch bản "thất bại" của hệ thống Map 3D dựa trên kiến trúc Shared Context mới và các giải pháp đột phá đã triển khai.

---

## 1. Rủi ro về Hiệu năng & Hiển thị (GPU & Rendering)

### Hiện tượng:
- Model bị chìm dưới mặt đất hoặc biến mất hoàn toàn khi bật Terrain.
- Model bị nhấp nháy (flickering) hoặc bị các lớp 2D (Drape) của bản đồ đè lên.

### Nguyên nhân & Giải pháp:
- **Lớp Drape của MapTiler SDK:** Pass render địa hình của MapTiler SDK (dựa trên MapLibre v5+) thường chiếm quyền Z-buffer.
  - *Giải pháp:* Ép trạng thái `gl.enable(gl.DEPTH_TEST)` và `gl.depthMask(true)` thủ công trước mỗi frame render của Three.js.
- **Lỗi hệ tọa độ (Matrix Mismatch):** Sai lệch giữa Z-up (MapTiler SDK) và Y-up (Three.js).
  - *Giải pháp:* Sử dụng ma trận đột phá **Y-Z Swap** trong `WORLD_MATRIX` để đồng bộ hệ trục với chi phí bằng 0.
- **LOD Hysteresis:** Chuyển đổi qua lại quá nhanh giữa High-poly và Box khi zoom quanh ngưỡng.
  - *Giải pháp:* Áp dụng khoảng đệm zoom (0.4 units) để ổn định trạng thái hiển thị.

---

## 2. Rủi ro về Bộ nhớ (Context & VRAM)

### Hiện tượng:
- Lỗi "WebGL Context Lost" hoặc ứng dụng bị treo khi thay đổi trang/style quá nhiều lần.

### Nguyên nhân & Giải pháp:
- **Context Overload:** Logic cũ tạo quá nhiều context độc lập.
  - *Giải pháp:* Kiến trúc **Parasitic Root** - chỉ sử dụng 1 Context duy nhất của MapTiler SDK và cache R3F root trên thẻ Canvas thông qua thuộc tính `__r3fSetup`.
- **Rò rỉ tài nguyên (Memory Leak):** Không dọn dẹp các sự kiện async hoặc model cũ.
  - *Giải pháp:* Triển khai `onRemove` nghiêm ngặt, gỡ bỏ lắng nghe sự kiện `styledata` và `resize`. Tuy nhiên, giữ lại renderer cache trên Canvas để tái sử dụng nhanh.

---

## 3. Rủi ro về Logic & Đồng bộ (The "Map is Null" Crisis)

### Hiện tượng:
- Console xuất hiện hàng loạt lỗi `Uncaught (in promise) Error: Map is null` hoặc `Map is already destroyed`.

### Nguyên nhân & Giải pháp:
- **Async Race Condition:** Các sự kiện `data` hoặc `idle` của MapTiler SDK trả về callback sau khi component React đã unmount.
  - *Giải pháp:* Sử dụng biến cờ **`isMounted`** và `cancelAnimationFrame` trong mọi callback async của `ModelManager`.
- **Context Loss (Mixed Trees):** Vô tình bỏ các component của `react-map-gl` vào trong R3F Root.
  - *Giải pháp:* Tuân thủ quy tắc **"Ngăn sông cách chợ"** - Tuyệt đối phân tách cây React của Map và Three.js.

---

## 4. Rủi ro về Dữ liệu Địa hình (Terrain Alignment)

### Hiện tượng:
- Model bị "bay" lơ lửng trên không trung trong vài giây rồi mới nhảy xuống mặt đất.
- Cache cao độ bị sai khi người dùng di chuyển sang vùng địa hình khác.

### Nguyên nhân & Giải pháp:
- **Terrain Data Lag:** `queryTerrainElevation` trả về 0 khi tile DEM chưa kịp nạp.
  - *Giải pháp:* Cơ chế **Event-Driven Snapping**. Chỉ cập nhật cao độ khi nhận đúng sự kiện `data` từ nguồn terrain và chốt chặn bằng sự kiện `idle`.
- **Stale Elevation Cache:** Bộ đệm cao độ cũ không được xóa khi toggle 3D.
  - *Giải pháp:* Force reset `elevations = {}` ngay khi thuộc tính `isVisible` thay đổi.

---

## 5. Chiến lược Giảm thiểu Tổng thể (Global Strategies)

1.  **Kiến trúc Standardized Y-up:** Loại bỏ hoàn toàn sự nhầm lẫn về trục tọa độ cho Developer bằng cách chuẩn hóa code Three.js theo hệ Y-up, việc tráo trục do ma trận cấp thấp xử lý.
2.  **Explicit State Management:** Không tin tưởng vào trạng thái WebGL mặc định của MapTiler SDK; luôn reset và cấu hình lại trước khi vẽ nội dung 3D.
3.  **Defensive Programming:** Mọi truy cập vào instance `map` đều phải qua kiểm tra `if (map && map.getStyle())`.
4.  **Monitoring:** Theo dõi chỉ số Frame Time và Draw Calls (mục tiêu < 10 Draw Calls cho 1,000+ biệt thự thông qua Instancing).

---
*Tài liệu này được cập nhật để đối phó với các thách thức kỹ thuật khi tích hợp MapTiler SDK và Three.js.*

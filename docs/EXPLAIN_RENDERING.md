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

## 4. Error Mitigation (Chống crash)

Do MapLibre GL JS chạy các sự kiện async, `ModelManager` luôn sử dụng biến cờ `isMounted` để kiểm tra trước khi gọi `map.queryTerrainElevation`. Điều này triệt tiêu hoàn toàn lỗi `Map is null` hoặc `Promise Rejection` khi người dùng chuyển trang hoặc tắt bản đồ đột ngột.

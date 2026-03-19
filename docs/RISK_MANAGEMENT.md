# Quản lý Rủi ro và Phân tích Thất bại (Failure Analysis) (MapLibre GL JS)

Kiến trúc tích hợp Three.js vào MapLibre GL JS tiềm ẩn các rủi ro kỹ thuật về đồ họa và đồng bộ. Dưới đây là phân tích và giải pháp.

## 1. Rủi ro về Đồ họa (Rendering Risks)

- **Lớp Drape của MapLibre GL JS:** Pass render địa hình của MapLibre (dựa trên v5+) thường chiếm quyền Z-buffer.
  - *Hệ quả:* Model 3D bị "nháy" (flicker) hoặc bị địa hình đè mất.
  - *Giải pháp:* Luôn ép bật `gl.DEPTH_TEST` và gọi `renderer.resetState()` trước mỗi lần vẽ content 3D.
- **Lỗi hệ tọa độ (Matrix Mismatch):** Sai lệch giữa Z-up (MapLibre) và Y-up (Three.js).
  - *Hệ quả:* Model bị quay ngang hoặc lơ lửng sai vị trí.
  - *Giải pháp:* Sử dụng `WORLD_MATRIX` tích hợp sẵn trong Camera Matrix của Three.js để thực hiện phép tráo đổi trục Y/Z ngay trên GPU.

## 2. Rủi ro về Tài nguyên (Resource Risks)

- **Memory Leak (WebGL Context):** Khởi tạo đi khởi tạo lại WebGL Context hoặc R3F Root.
  - *Hệ quả:* Trình duyệt bị treo sau khi người dùng tương tác nhiều lần.
  - *Giải pháp:* Kiến trúc **Parasitic Root** - chỉ sử dụng 1 Context duy nhất của MapLibre và cache R3F root trên thẻ Canvas thông qua thuộc tính `__r3fSetup`.
- **Main Thread Congestion:** Quá nhiều Workers từ bản đồ làm đứng máy.
  - *Hệ quả:* UI bị giật lag khi đang nạp Tiles.
  - *Giải pháp:* Sử dụng `maplibregl.setWorkerCount()` để giới hạn số lượng Workers (tối ưu từ 2-4).

## 3. Rủi ro về Đồng bộ (Synchronization Risks)

- **Async Race Condition:** Các sự kiện `data` hoặc `idle` của MapLibre trả về callback sau khi component React đã unmount.
  - *Hệ quả:* Lỗi `Map is null` hoặc crash ứng dụng.
  - *Giải pháp:* Sử dụng biến cờ `isMounted` làm cổng kiểm tra (Guard) trước mọi tác vụ xử lý bất đồng bộ.
- **Camera Jitter:** Tọa độ kinh độ/vĩ độ (Longitude/Latitude) quá lớn gây sai số dấu phẩy động (Floating point error).
  - *Hệ quả:* Model bị rung khi zoom sâu.
  - *Giải pháp:* Chuyển đổi tọa độ sang hệ **Local Mercator** (Meters) tương đối so với một điểm trung tâm (`centerCoord`).

---
*Tài liệu quản lý rủi ro dự án 3D WebGIS v3.*

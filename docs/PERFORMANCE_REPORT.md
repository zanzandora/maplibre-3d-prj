# Báo cáo Tối ưu hóa Hiệu năng 3D WebGIS (MapTiler SDK + Three.js)

Tài liệu này phân tích chi tiết các kỹ thuật "Surgical Optimization" v2 đã được triển khai để xử lý hàng ngàn model 3D trên nền địa hình thực tế mà vẫn duy trì mức **60 FPS** ổn định.

---

## 1. Kiến trúc "Parasitic Root" (Shared Context v2)

Chúng ta sử dụng kỹ thuật "ký sinh" cao cấp để lồng ghép R3F vào MapTiler SDK Custom Layer.

- **Zero-Latency Sync:** Đặt `frameloop: 'never'` và chủ động gọi `r3fRoot.advance()` đồng bộ tuyệt đối với vòng lặp render của MapTiler SDK.
- **Root Caching (`__r3fSetup`):** Cache toàn bộ R3F Root và WebGLRenderer trên thẻ Canvas. Điều này triệt tiêu chi phí khởi tạo lại (Init Overhead) khi bật/tắt layer hoặc thay đổi style.
- **WebGL Context Persistence:** Đảm bảo chỉ dùng 1 Context duy nhất cho cả 2 thư viện, tránh lỗi crash do giới hạn Context của trình duyệt.

## 2. Đột phá Matrix: Y-Z Swap Breakthrough

Thay vì thực hiện các phép tính Vector phức tạp trong vòng lặp, chúng ta sử dụng một ma trận thế giới (`WORLD_MATRIX`) thủ công.

- **Zero-Cost Projection:** Ma trận này thực hiện tráo đổi trục Y (Three.js Up) và Z (MapTiler SDK Up) ngay trong quá trình chiếu (GPU-side).
- **Y-up Standardization:** Lập trình viên có thể code model theo chuẩn Y-up tự nhiên của Three.js, trong khi MapTiler SDK vẫn nhận diện đúng cao độ (Altitude).
- **Precision:** Giảm thiểu sai số số thực dấu phẩy động bằng cách tính toán offset tương đối (`dx, dy, dz`) trước khi nhân ma trận.

## 3. Chế ngự lớp "Drape" của MapTiler SDK

Lớp **Drape** (phủ texture địa hình) của MapTiler SDK thường ghi đè hoặc tắt Depth Buffer.

- **Explicit State Overriding:** Trước mỗi frame render 3D, chúng ta cưỡng ép trạng thái WebGL:
  ```typescript
  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(true);
  renderer.resetState();
  ```
- **Kết quả:** Model luôn hiển thị đúng lớp (Layering) và không bị "chìm" hay biến mất sau khi bản đồ vẽ xong địa hình.

## 4. Terrain Snapping v2: Event-Driven Optimization

Tối ưu hóa việc hỏi cao độ từ MapTiler SDK (tác vụ gây đứng hình CPU).

- **Cache Force Reset:** Xóa sạch bộ đệm cao độ ngay khi người dùng toggle 3D để ép quét lại dữ liệu mới nhất.
- **Data-Targeted Listening:** Chỉ tính toán lại cao độ khi nhận sự kiện `data` từ nguồn `maptiler-terrain`.
- **Idle Final Sync:** Sử dụng sự kiện `idle` để chốt chặn lần cuối, đảm bảo model "snap" chính xác 100% sau khi địa hình đã ổn định hoàn toàn.

## 5. GPU Instancing & LOD Hysteresis

- **InstancedMesh:** Gom 1.000 model thành 1 Draw Call duy nhất.
- **LOD Hysteresis:** Khoảng đệm zoom (0.4) ngăn chặn hiện tượng "nháy" model (Flickering) khi người dùng zoom chậm tại ngưỡng chuyển đổi giữa model GLB và khối Box.

## 6. Memory & Async Safety

- **Pre-allocation:** Tái sử dụng `Matrix4`, `Vector3` cố định, tránh Garbage Collection (GC) spikes.
- **Mounted Guard:** Sử dụng biến cờ `isMounted` trong các callback async của MapTiler SDK để triệt tiêu lỗi `Map is null` khi unmount đột ngột.

---

### Chỉ số mục tiêu (Performance KPIs)

- **Frame Time:** ~16ms (Ổn định 60 FPS).
- **Draw Calls:** < 10 (cho 1.000+ biệt thự/cây xanh).
- **Terrain Alignment:** Độ trễ snap = 0ms ngay khi dữ liệu địa hình khả dụng.
- **Stability:** Không còn hiện tượng model bị chìm hoặc mất sau khi bật Terrain.

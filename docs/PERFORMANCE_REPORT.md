# Báo cáo Tối ưu hóa Hiệu năng 3D WebGIS (MapLibre GL JS + Three.js)

Báo cáo chi tiết các kỹ thuật tối ưu hóa giúp render hàng ngàn model 3D mượt mà trên trình duyệt.

## 1. Zero-Overhead Context Sharing

Chúng ta sử dụng kỹ thuật "ký sinh" cao cấp để lồng ghép R3F vào MapLibre GL JS Custom Layer.

- **Một Canvas Duy Nhất:** Không có sự chồng chéo giữa các thẻ `<canvas>`. R3F render trực tiếp vào WebGL Context của MapLibre.
- **Zero-Latency Sync:** Đặt `frameloop: 'never'` và chủ động gọi `r3fRoot.advance()` đồng bộ tuyệt đối với vòng lặp render của MapLibre.
- **Memory Efficiency:** Cache R3F root trên chính thuộc tính của Canvas để tránh khởi tạo lại khi người dùng bật/tắt layer.

## 2. World Matrix Projection (Chuyển đổi GPU)

Để tránh xoay model bằng CPU cho hàng ngàn đối tượng, chúng ta thực hiện phép xoay ngay tại Ma trận Projection của Camera.

- **Zero-Cost Projection:** Ma trận này thực hiện tráo đổi trục Y (Three.js Up) và Z (MapLibre Up) ngay trong quá trình chiếu (GPU-side).
- **Y-up Standardization:** Lập trình viên có thể code model theo chuẩn Y-up tự nhiên của Three.js, trong khi MapLibre vẫn nhận diện đúng cao độ (Altitude).

## 3. Chế ngự lớp "Drape" của MapLibre GL JS

Lớp **Drape** (phủ texture địa hình) của MapLibre GL JS thường ghi đè hoặc tắt Depth Buffer.

- **Depth State Enforcement:** Luôn ép bật `DEPTH_TEST` và `depthMask` trước mỗi lần vẽ content 3D.
- **Renderer Reset:** Sử dụng `renderer.resetState()` để đồng bộ trạng thái WebGL giữa MapLibre và Three.js, triệt tiêu hiện tượng nháy hình (flickering).

## 4. Tối ưu hóa Terrain Polling

Tối ưu hóa việc hỏi cao độ từ MapLibre (tác vụ gây đứng hình CPU).

- **Throttled Updates:** Chỉ cập nhật cao độ khi bản đồ đứng yên (`idle` hoặc `moveend`).
- **Source Filtering:** Chỉ tính toán lại khi có dữ liệu địa hình mới được nạp (`sourceId` chứa `terrain`).
- **Mounted Guard:** Sử dụng biến cờ `isMounted` trong các callback async của MapLibre để triệt tiêu lỗi `Map is null` khi unmount đột ngột.

---
*Báo cáo hiệu năng dự án 3D WebGIS v3.*

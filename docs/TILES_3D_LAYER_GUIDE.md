# Hướng dẫn kỹ thuật: Tiles3DLayer (3D Tiles Integration)

Tài liệu này cung cấp cái nhìn từ tổng quan đến chuyên sâu component `Tiles3DLayer`, trái tim của hệ thống hiển thị dữ liệu 3D độ phân giải cao trong dự án.

## Giới thiệu chung (Dành cho người đọc cơ bản)

`Tiles3DLayer` là thành phần chịu trách nhiệm đưa các mô hình kiến trúc, đô thị 3D từ hệ thống Cesium Ion lên bản đồ MapLibre.

Thay vì tải toàn bộ dữ liệu cùng lúc gây lag máy, component này sử dụng công nghệ **3D Tiles (OGC)**. Công nghệ này cho phép bản đồ "thông minh" hơn: chỉ tải những tòa nhà ở gần bạn với độ chi tiết cao, và hiển thị các tòa nhà ở xa dưới dạng khối đơn giản. Điều này đảm bảo ứng dụng luôn mượt mà ngay cả khi hiển thị hàng ngàn công trình.

---

## Kiến trúc Chuyên sâu (Dành cho Nhà phát triển)

Component `Tiles3DLayer` được thiết kế theo mô hình **Smart Component**, có khả năng tự thích nghi với môi trường render (R3F Context) để tối ưu hóa tài nguyên.

### 1. Cơ chế "Smart Context"

Component sử dụng kỹ thuật phát hiện môi trường để tránh xung đột Render Root (một lỗi phổ biến khi lồng ghép nhiều thư viện 3D):

- **Chế độ Ký sinh (Inside R3F):** Nếu được đặt bên trong `MapThreeLayer`, nó sẽ tự động tắt logic quản lý WebGL riêng và chỉ render nội dung 3D. Điều này giúp chia sẻ chung 1 WebGL Context, tiết kiệm VRAM và đồng bộ camera tuyệt đối.
- **Chế độ Độc lập (Standalone):** Nếu dùng riêng lẻ, nó sẽ tự khởi tạo một Custom Layer của MapLibre, quản lý vòng đời và camera sync độc lập.

### 2. Mô hình Pre-fetch Auth (Bảo mật & Ổn định)

Để giải quyết triệt để lỗi `401 Unauthorized` và hiện tượng Race-condition (xung đột tiến trình), chúng tôi áp dụng quy trình xác thực 3 bước:

1.  **Auth Layer:** Component thực hiện gọi API endpoint của Cesium Ion thủ công.
2.  **Token Processing:** Trích xuất session token và gán tiền tố `Bearer ` chuẩn REST.
3.  **Strict Mounting:** Chỉ khi có đầy đủ URL và Token, component `<TilesRenderer>` mới được Mount. Việc này đảm bảo 100% request phát đi đều có thông tin xác thực.

### 3. Đồng bộ hóa Dynamic Anchor (Độ chính xác milimet)

Đây là kỹ thuật quan trọng nhất để xóa bỏ độ lệch giữa bản đồ phẳng (Mercator) và trái đất cong (ECEF):

- **Trích xuất Geometric Center:** Engine tự động đọc `boundingVolume` từ Metadata của Tileset để tìm tâm hình học thực tế của dự án.
- **Dynamic ENU Frame:** Tạo ma trận East-North-Up (ENU) tại chính tâm hình học đó thay vì dùng tọa độ cứng.
- **Relative Translation:** Nếu chạy trong môi trường chia sẻ, Engine tính toán độ lệch mét giữa tâm dự án và tâm bản đồ, sau đó thực hiện dịch chuyển (Translate) để "ghim" công trình vào đúng vị trí địa lý trên MapLibre.

### 4. Tối ưu hóa Hiệu năng (Performance Plugins)

Chúng tôi tích hợp các Plugin cao cấp để đạt 60 FPS:

- **TilesCompressionPlugin:** Giảm tải GPU bằng cách giải nén dữ liệu ngay trên card đồ họa.
- **TilesFadePlugin:** Tạo hiệu ứng chuyển cảnh mượt mà giữa các cấp độ chi tiết (LOD), xóa bỏ hiện tượng "nhảy" mô hình (popping).
- **UpdateOnChangePlugin:** Chỉ tính toán lại khi camera di chuyển, tiết kiệm 30% tài nguyên CPU khi đứng yên.

## Hướng dẫn sử dụng

```tsx
<Tiles3DLayer
  assetId='4662688'
  ionToken={YOUR_CESIUM_TOKEN}
  enabled={isTerrainReady} // Đợi địa hình sẵn sàng mới nạp
  onLoad={() => console.log('3D Tiles Loaded!')}
/>
```

> **Lưu ý:** Luôn sử dụng prop `enabled` liên kết với trạng thái địa hình để đảm bảo các công trình không bị "bay" hoặc "lún" trong quá trình khởi tạo bản đồ.

# Tối ưu hóa Hiệu năng Tương tác (Interaction Optimization) (MapLibre GL JS)

Kiến trúc lồng ghép 3D vào bản đồ (Custom Layer) đòi hỏi sự tách biệt rõ ràng giữa tương tác của người dùng trên bản đồ 2D và tương tác với các vật thể 3D.

## 1. Map Click Interceptor (Nguyên lý chặn tia)

Để người dùng có thể click chọn model 3D, chúng ta sử dụng kỹ thuật **Raycasting** đồng bộ với hệ tọa độ bản đồ.

1.  **Chặn sự kiện từ bản đồ:** Component `MapClickInterceptor` lắng nghe sự kiện `click` của MapLibre GL JS.
2.  **Chuyển đổi sang NDC:** Tọa độ chuột (x, y) trên canvas bản đồ được chuyển đổi sang Normalized Device Coordinates (NDC) từ -1 đến 1.
3.  **Bắn tia (Raycasting):**
    - Sử dụng `projectionMatrixInverse` của camera trong Three.js để tính toán tia sáng từ tâm camera xuyên qua điểm NDC.
    - Tìm kiếm sự va chạm với các `InstancedMesh` trong scene.
4.  **Phản hồi chính xác:** Nếu click trúng model, chúng ta gọi `e.originalEvent.stopPropagation()` để ngăn MapLibre xử lý sự kiện click trên bản đồ nền, đảm bảo trải nghiệm tương tác mượt mà.

## 2. Interaction Throttling

Để tránh lãng phí tài nguyên CPU khi người dùng di chuyển bản đồ liên tục:

- **Mục tiêu:** Đảm bảo trình duyệt không gửi các sự kiện di chuyển chuột liên tục (`mousemove`, `mouseover`) vào không gian 3D của Three.js khi người dùng đang thao tác trên bản đồ nền. Điều này giúp MapLibre GL JS xử lý các tác vụ như `queryRenderedFeatures` mượt mà hơn.
- **Giải pháp:** Chỉ thực hiện các phép toán va chạm (Raycasting) khi người dùng thực hiện hành động `click` thực sự.

## 3. Quy tắc ưu tiên tương tác

1. **2D Native Layers:** Luôn được MapLibre xử lý trước (ví dụ: click vào POI, Road).
2. **3D Models:** Được xử lý thông qua `MapClickInterceptor`.
3. **Thứ tự sự kiện:** MapLibre luôn được ưu tiên xử lý sự kiện trước. Nếu bạn muốn bắt sự kiện trong Three.js, hãy đảm bảo MapLibre không bị chặn bởi Canvas overlay.

---
*Tài liệu hướng dẫn tối ưu tương tác người dùng cho dự án 3D WebGIS.*

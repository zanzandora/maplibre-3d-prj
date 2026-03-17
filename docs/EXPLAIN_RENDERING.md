# Giải thích Cơ chế Render 3D và Tối ưu hóa hiệu năng

Tài liệu này giải thích các kỹ thuật "đột phá" giúp render 1,000+ model GLB mượt mà trên nền địa hình 3D nhấp nhô của MapLibre v5+.

## 1. Cơ chế "Terrain Snapping" Đột phá
Khác với logic cũ quét liên tục (gây lag), hệ thống hiện tại sử dụng cơ chế **Event-Driven Cache Reset**:

### Hạn chế của Logic cũ:
- Cache cao độ bị "kẹt" ở giá trị 0 khi terrain chưa load xong.
- Model bị lơ lửng hoặc lún sâu khi người dùng bật/tắt 3D.

### Cách đột phá:
1. **Force Reset:** Mỗi khi người dùng toggle nút 3D, toàn bộ cache `elevations` trong `ModelManager` bị xóa sạch (`setElevations({})`).
2. **Data-Targeted Listening:** Lắng nghe chính xác sự kiện `data` từ MapLibre, chỉ kích hoạt tính toán khi `sourceId` chứa từ khóa `terrain`.
3. **Idle Final Sync:** Sử dụng sự kiện `idle` để thực hiện một pass quét cuối cùng, đảm bảo độ chính xác tuyệt đối sau khi toàn bộ gạch địa hình (terrain tiles) đã ổn định.

## 2. Bảo vệ Model khỏi lớp "Drape" của MapLibre
Trong MapLibre v5+, lớp **Drape** (dán đường giao thông, vùng xanh lên địa hình) thường chiếm quyền kiểm soát Depth Buffer, dẫn đến việc model bị biến mất sau khi bản đồ vẽ xong địa hình.

### Giải pháp kỹ thuật:
Trước khi gọi R3F render frame, chúng ta "ép" trạng thái WebGL trong hàm `render` của Custom Layer:
```typescript
gl.enable(gl.DEPTH_TEST); // Bật lại kiểm tra độ sâu
gl.depthMask(true);       // Cho phép ghi vào Z-buffer
renderer.resetState();    // Reset trạng thái Three.js để không xung đột
```

## 3. Hệ trục tọa độ Y-up Đồng bộ
Để lập trình viên Three.js không bị nhầm lẫn, chúng ta đã chuyển đổi toàn bộ logic về hệ **Y-up chuẩn**:
- **X:** Đông (East)
- **Y:** Độ cao (Altitude/Up)
- **Z:** Nam (Latitude/South)

Phép chuyển đổi này được thực hiện "ngầm" thông qua ma trận `WORLD_MATRIX` trong `MapThreeLayer`, giúp code trong component 3D cực kỳ trong sáng và dễ hiểu.

## 4. GPU Instancing & LOD (Level of Detail)
- **Instancing:** 1,000 model giống nhau chỉ tốn **1 Draw Call**.
- **LOD Switching:** Tự động chuyển model GLB chi tiết sang khối Box đơn giản khi Zoom < 16, giúp GPU xử lý hàng vạn công trình ở tầm nhìn rộng mà không tụt FPS.

## 5. Lưu ý về Async Safety
Do MapLibre chạy các sự kiện async, `ModelManager` luôn sử dụng biến cờ `isMounted` để kiểm tra trước khi gọi `map.queryTerrainElevation`. Điều này triệt tiêu hoàn toàn lỗi `Map is null` hoặc `Promise Rejection` khi người dùng chuyển trang hoặc tắt bản đồ đột ngột.

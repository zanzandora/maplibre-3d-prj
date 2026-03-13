# Shared WebGL Context: MapLibre + R3F Integration

Tài liệu này giải thích kiến trúc **Shared Context**, kỹ thuật cao cấp nhất để tích hợp Three.js vào MapLibre GL JS, giúp cả hai hệ thống hoạt động trên cùng một Canvas duy nhất.

## 1. Tại sao cần Shared Context?

Trong các cách tiếp cận thông thường (Overlay), chúng ta dùng 2 Canvas đè lên nhau. Điều này dẫn đến 2 vấn đề lớn:

- **Z-Fighting & Layering:** Model 3D luôn đè lên toàn bộ bản đồ, kể cả các nhãn (labels) tên đường.
- **Performance:** Trình duyệt phải quản lý 2 ngữ cảnh WebGL riêng biệt, gây tốn tài nguyên và dễ bị lag (jittering) khi xoay bản đồ nhanh.

**Shared Context** giải quyết bằng cách:

- Three.js "mượn" WebGL Context của MapLibre.
- Render model 3D như một lớp (Layer) nằm giữa các lớp của bản đồ.

## 2. Luồng xử lý kỹ thuật (Technical Flow)

### onAdd: Khởi tạo "Ký sinh"

Khi `MapThreeLayer` được thêm vào bản đồ, phương thức `onAdd` được gọi:

- Khởi tạo `THREE.WebGLRenderer` sử dụng canvas và context của MapLibre: `canvas: map.getCanvas(), context: gl`.
- Sử dụng `createRoot` từ `@react-three/fiber` để tạo một R3F Root "nội bộ" quản lý Scene.
- Đặt `frameloop: 'never'` vì chúng ta sẽ tự điều khiển việc vẽ.

### render: Đồng bộ hóa tuyệt đối

Mỗi khi MapLibre vẽ một frame, nó gọi hàm `render` của Custom Layer:

- **Ma trận:** MapLibre cung cấp `modelViewProjectionMatrix`. Chúng ta nhân thêm `offsetMatrix` (centerCoord) để khớp tọa độ Three.js.
- **Camera:** Ép Camera của Three.js sử dụng ma trận này.
- **Reset State:** Gọi `renderer.resetState()` cực kỳ quan trọng để Three.js không làm hỏng các thiết lập WebGL mà MapLibre cần để vẽ các lớp tiếp theo.

## 3. Quản lý Layering (Thứ tự hiển thị)

Trong `MapThreeLayer.tsx`, logic sau giúp chèn Model xuống dưới các nhãn:

```typescript
const layers = map.getStyle().layers;
const labelLayerId = layers?.find((l) => l.type === 'symbol')?.id;
map.addLayer(customLayer, labelLayerId); // Chèn layer 3D TRƯỚC lớp nhãn
```

Kết quả: Tên đường, địa danh sẽ hiển thị **đè lên trên** các model 3D, tạo cảm giác mô hình thực sự nằm trong không gian của bản đồ.

## 4. Ưu điểm vượt trội

1. **Zero Latency:** Không có độ trễ giữa model và bản đồ khi di chuyển.
2. **Depth Sharing:** Nếu sử dụng đúng cách, model có thể bị che khuất bởi các tòa nhà 3D (Building) của chính MapLibre.
3. **Raycasting mượt mà:** Sự kiện chuột được MapLibre phân phối chính xác, giúp việc click vào model nhạy hơn.

## 5. Lưu ý cho Developer

- **Không dùng `<Canvas />` của R3F:** Mọi nội dung 3D phải được bỏ vào bên trong `<MapThreeLayer>...</MapThreeLayer>` trong file `MapView.tsx`.
- **Tài nguyên:** Do dùng chung Context, hãy luôn đảm bảo dọn dẹp (dispose) tài nguyên trong `onRemove` để tránh tràn bộ nhớ WebGL.

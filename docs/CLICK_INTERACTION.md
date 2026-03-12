# Cơ chế Tương tác Click 3D (Manual Raycasting)

Tài liệu này giải thích cách hệ thống bắt sự kiện click trên các model 3D (InstancedMesh) trong môi trường đồng bộ MapLibre và Three.js.

---

## 1. Thách thức kỹ thuật
Khi nhúng Three.js vào MapLibre qua Custom Layer, hệ thống sự kiện mặc định của R3F (`onPointerDown`, `onClick`) đôi khi bị xung đột hoặc không chính xác do:
- **Tọa độ không khớp**: MapLibre quản lý Canvas riêng, việc chuyển đổi từ pixel màn hình sang tọa độ 3D (NDC) cần sự chính xác tuyệt đối từ Camera đã đồng bộ.
- **Pointer Events**: `pointer-events: none` trên Canvas overlay thường được dùng để cho phép tương tác với bản đồ nền, nhưng lại làm mất sự kiện của Three.js.

## 2. Giải pháp: MapClickInterceptor
Chúng ta sử dụng một component "Interceptor" để nghe sự kiện click trực tiếp từ MapLibre, sau đó tự bắn tia (Manual Raycasting) xuyên qua không gian 3D.

### Quy trình xử lý (Pipeline):
1. **Bắt sự kiện MapLibre**: Đăng ký `map.on('click', ...)`.
2. **Chuẩn hóa tọa độ (NDC)**: Chuyển đổi `e.point` (pixel) sang dải `[-1, 1]` dựa trên kích thước thực tế của Canvas.
3. **Manual Raycasting**:
   - Sử dụng `camera.projectionMatrixInverse` để giải mã ngược tọa độ chuột thành tia sáng trong không gian 3D.
   - Bắn tia kiểm tra va chạm với `scene.children`.
4. **Truy xuất dữ liệu (Data Retrieval)**:
   - Nếu trúng `InstancedMesh`, lấy `instanceId`.
   - Truy cập `userData.instances` (đã được gắn sẵn trong `InstanceRenderer`) để lấy thông tin cụ thể của model đó.
   - Phân tích ID (ví dụ: `Name-Index`) để đối chiếu với dữ liệu gốc (`rawData`).

## 3. Cấu trúc dữ liệu hỗ trợ
Để click hoạt động chính xác và nhanh chóng, dữ liệu được tổ chức như sau:

```typescript
// Trong InstanceRenderer.tsx
<instancedMesh
  ref={(el) => {
    if (el) el.userData.instances = instances; // Gắn metadata vào mesh
  }}
  ...
/>
```

## 4. Ưu điểm của phương pháp này
- **Chính xác tuyệt đối**: Tia raycast đi đúng theo góc nhìn của Camera đã được đồng bộ với MapLibre.
- **Hiệu năng cao**: Không cần bật sự kiện cho từng Mesh riêng lẻ, chỉ xử lý khi người dùng thực sự click.
- **Không chặn bản đồ**: Cho phép MapLibre xử lý các tương tác mặc định (pan, zoom) đồng thời với việc bắt click model 3D.

---
**File tham chiếu:** 
- `src/engine/MapClickInterceptor.tsx`
- `src/loader/ModelManager.tsx`
- `src/engine/InstanceRenderer.tsx`

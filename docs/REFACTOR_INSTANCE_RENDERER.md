# Tối ưu hóa hiệu năng Render: GPU Instancing & Memory Management

Tài liệu này chi tiết các cải tiến kỹ thuật để giải quyết vấn đề giật lag (render time 60-155ms) khi hiển thị hàng ngàn model 3D.

## 1. Vấn đề: Quá nhiều Draw Calls & GC Pressure

Trước khi tối ưu, hệ thống gặp phải hai "nút thắt" cổ chai chính:

1.  **CPU Overhead:** Việc khởi tạo `new Matrix4()` và `new Vector3()` trong mỗi frame (vòng lặp `render`) gây áp lực cực lớn lên bộ thu gom rác (Garbage Collector), dẫn đến hiện tượng đứng hình (stuttering).
2.  **Draw Call Bottleneck:** Việc render 1.000 đối tượng bằng 1.000 Mesh riêng lẻ khiến CPU phải gửi 1.000 lệnh vẽ tới GPU, làm nghẽn luồng xử lý.

## 2. Giải pháp: GPU Instancing (InstanceRenderer)

Chúng ta sử dụng kỹ thuật **GPU Instancing** thông qua `THREE.InstancedMesh`. Thay vì vẽ nhiều Mesh, chúng ta chỉ gửi **1 lệnh vẽ duy nhất** kèm theo một mảng các ma trận biến đổi (Position, Rotation, Scale) cho toàn bộ 1.000 instance.

### Kết quả:

- **Draw Calls:** Giảm từ 1.000 xuống còn ~1-5 (tùy số lượng loại model).
- **Render Time:** Giảm từ ~100ms xuống còn **< 16ms** (đạt mức 60 FPS ổn định).

## 3. Quản lý bộ nhớ trong vòng lặp Render (MapThreeLayer)

Trong file `MapThreeLayer.tsx`, toàn bộ các object trung gian dùng để tính toán ma trận camera đã được đưa ra ngoài vòng lặp:

```tsx
// Pre-allocate objects một lần duy nhất
const PROJECTION_MATRIX = new Matrix4();
const WORLD_MATRIX = new Matrix4();
const SCALE_VECTOR = new Vector3();

// Trong vòng lặp render, chỉ sử dụng lại các instance này (.set, .copy)
// KHÔNG sử dụng từ khóa 'new'
```

Việc này giúp loại bỏ hoàn toàn việc cấp phát bộ nhớ động mỗi frame, giúp ứng dụng chạy mượt mà trong thời gian dài mà không bị lag do GC.

## 4. Tối ưu hóa Frustum Culling

Mặc định, `InstancedMesh` thực hiện culling dựa trên Bounding Box của toàn bộ nhóm. Để tối ưu hơn:

- **frustumCulled={true}:** Đã được kích hoạt cho tất cả InstancedMesh.
- **DPR Limiting:** Giới hạn `devicePixelRatio` tối đa là 2 để tránh render quá nhiều pixel trên các màn hình Retina cao cấp mà không mang lại sự khác biệt đáng kể về thị giác.

## 5. Lưu ý cho Nhà phát triển

1.  **Tránh `new` trong Render:** Tuyệt đối không khởi tạo Object, Array, hoặc Matrix bên trong bất kỳ hàm nào chạy theo frame (render, onBeforeRender, useFrame).
2.  **Sử dụng InstanceRenderer:** Khi thêm dữ liệu mới, hãy gom nhóm chúng theo loại file GLB và sử dụng `InstanceRenderer` thay vì `SingleModelRenderer`.
3.  **Tắt Shadows khi cần:** Shadows tiêu tốn rất nhiều tài nguyên. Trong chế độ hiển thị hàng ngàn đối tượng, shadows đã được tắt mặc định (`shadows={false}`).

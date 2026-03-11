# Hệ thống LOD (Level of Detail) & Tối ưu hóa hiệu năng

Tài liệu này giải thích cơ chế LOD được triển khai trong `InstanceRenderer` để quản lý việc hiển thị hàng ngàn model 3D trên bản đồ mà vẫn duy trì tốc độ khung hình (FPS) cao.

## 1. Tổng quan chiến lược LOD

Hệ thống sử dụng mức thu phóng (**Zoom**) của bản đồ làm điều kiện tiên quyết để quyết định độ chi tiết của model. Việc này giúp giảm tải cho GPU khi camera ở xa (không cần vẽ các chi tiết nhỏ không nhìn thấy được).

| Cấp độ | Tên gọi | Đặc điểm Model | Ngưỡng áp dụng (Zoom) |
| :--- | :--- | :--- | :--- |
| **LOD 0** | **High-poly** | Đầy đủ chi tiết từ file GLB gốc. | Zoom > 18 |
| **LOD 1** | **Mid-poly** | Model rút gọn chi tiết (hiện tại dùng chung LOD 0). | Zoom 16 - 18 |
| **LOD 2** | **Bounding Box** | Các khối hộp đơn giản (`BoxGeometry`). | Zoom < 16 |

## 2. Cơ chế thực hiện

### A. Đồng bộ Zoom (Bridge giữa MapLibre & Three.js)
`InstanceRenderer` lắng nghe sự kiện `zoom` từ instance của MapLibre. Khi mức zoom thay đổi, React state `zoom` được cập nhật, kích hoạt việc hoán đổi component render.

```tsx
// Trong InstanceRenderer.tsx
useEffect(() => {
  if (!map) return;
  const updateZoom = () => setZoom(map.getZoom());
  map.on('zoom', updateZoom);
  return () => map.off('zoom', updateZoom);
}, [map]);
```

### B. Instanced LOD Switching
Thay vì sử dụng class `THREE.LOD` thông thường (vốn làm giảm hiệu năng khi có quá nhiều object đơn lẻ), dự án sử dụng **Instanced LOD Switching**:
- Hệ thống duy trì hai bộ `InstancedMesh`: một cho **GLB** (chi tiết) và một cho **Box** (đơn giản).
- Dựa trên điều kiện `zoom >= 16`, hệ thống chỉ vẽ một trong hai bộ lên màn hình.
- Các tính toán ma trận biến đổi (`instanceMatrix`) chỉ được thực hiện cho bộ đang hiển thị.

### C. Xử lý độ cao địa hình (Terrain Sync)
Độ cao của model được tính toán một lần duy nhất khi bản đồ ở trạng thái `idle` và được lưu vào `elevations` state trong `ModelManager`. Khi LOD thay đổi, giá trị độ cao này được tái sử dụng từ cache, giúp việc chuyển đổi cực kỳ mượt mà.

## 3. Hướng dẫn dành cho Nhà phát triển

### Thay đổi ngưỡng chuyển đổi LOD
Nếu bạn thấy model chuyển sang dạng hộp quá sớm hoặc quá muộn, hãy điều chỉnh giá trị `16` trong `InstanceRenderer.tsx`:

```tsx
// Thay đổi số 16 thành ngưỡng mong muốn
{zoom >= 16 && meshParts.map(...)}
{zoom < 16 && <instancedMesh ... />}
```

### Thêm Model Mid-poly (LOD 1)
Để hỗ trợ LOD 1 thực thụ, bạn có thể truyền thêm một URL model đã được tối ưu (decimated) vào props của `InstanceRenderer` và thêm một điều kiện render ở giữa:

```tsx
{zoom > 18 ? <HighPoly /> : zoom >= 16 ? <MidPoly /> : <Box />}
```

### Tối ưu hóa màu sắc LOD 2
Hiện tại LOD 2 sử dụng màu xám mặc định `#888888`. Bạn có thể thay đổi màu này trong phần `<meshStandardMaterial />` của khối box để khớp với tông màu chủ đạo của bản đồ.

---
**Lưu ý:** Luôn kiểm tra FPS bằng công cụ Chrome DevTools khi thay đổi các ngưỡng LOD để đảm bảo sự cân bằng giữa chất lượng hình ảnh và hiệu năng.

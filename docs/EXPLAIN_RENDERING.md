# Giải thích Cơ chế Render 3D và Tối ưu hóa hiệu năng

Tài liệu này giải thích các kỹ thuật được sử dụng trong component `InstanceRenderer.tsx` và `ModelManager.tsx` để render hàng ngàn model 3D với hiệu năng cao (> 60 FPS).

## 1. Instanced Rendering (Render hàng loạt)

Thay vì render từng model riêng lẻ (điều này sẽ tạo ra hàng ngàn "Draw Calls" làm nghẽn CPU/GPU), chúng ta sử dụng kỹ thuật **Instanced Rendering** thông qua `THREE.InstancedMesh`.

- **Cơ chế:** GPU chỉ nhận dữ liệu Geometry (hình dạng) và Material (vật liệu) một lần duy nhất. Sau đó, nó sử dụng một mảng các ma trận biến đổi (Transformation Matrices) để vẽ lại hình dạng đó ở nhiều vị trí khác nhau trong một lần vẽ duy nhất.
- **Hiệu quả:** Giảm số lượng Draw Calls từ 1000 xuống còn 1 (hoặc bằng số lượng sub-mesh của model).

## 2. LOD (Level of Detail) & Phân cấp hiển thị

Để duy trì hiệu năng khi camera ở xa, chúng ta sử dụng cơ chế LOD dựa trên mức Zoom của bản đồ:

- **High Detail (Zoom >= 16):** Render model GLB đầy đủ chi tiết (High poly). Duyệt qua toàn bộ cấu trúc GLB, trích xuất tất cả các cặp Geometry/Material và tạo `instancedMesh` cho từng phần.
- **Massing Mode (Zoom < 16):** Render dưới dạng các khối hộp đơn giản (Bounding Box) sử dụng `BoxGeometry`. Điều này giúp GPU xử lý cực nhanh khi bản đồ hiển thị hàng chục ngàn công trình ở tầm nhìn rộng.
- **Culling:** Sử dụng `frustumCulled={false}` kết hợp với việc tính toán thủ công `computeBoundingBox/Sphere` để đảm bảo model không bị mất khi tâm (origin) nằm ngoài màn hình nhưng phần thân vẫn còn hiển thị.

## 3. Cơ chế Highlight (Chọn Model)

Khi người dùng click vào một model, hệ thống sẽ kích hoạt trạng thái Highlight:

- **State Management:** `selectedId` được quản lý tại `ModelManager` và truyền xuống `InstanceRenderer`.
- **Fast Color Update:** Sử dụng `setColorAt(index, color)` trên `InstancedMesh`. Việc cập nhật màu sắc được tách biệt khỏi việc cập nhật ma trận vị trí để đảm bảo phản hồi tức thì (Immediate Feedback).
- **Repaint Sync:** Gọi `map.triggerRepaint()` thông qua `useEffect` sau khi React cập nhật state để ép MapLibre vẽ lại frame mới với màu sắc đã thay đổi.

## 4. Tối ưu hóa Địa hình (Elevation Scanning)

Để model bám sát mặt đất nhấp nhô của MapLibre Terrain:

- **Continuous Scanning:** Hệ thống thực hiện quét cao độ liên tục (`requestAnimationFrame`) cho đến khi toàn bộ model trong vùng nhìn có đủ dữ liệu elevation.
- **Batch Processing:** Giới hạn quét tối đa 200 model mỗi frame (`MAX_SCAN_PER_FRAME`) để tránh làm treo main thread (UI Thread).
- **Event-Driven:** Lắng nghe sự kiện `data` và `sourcedata` của MapLibre để kích hoạt quét ngay khi các ô gạch địa hình (terrain tiles) vừa được tải về.
- **Immediate Feedback:** Model mặc định xuất hiện ở độ cao 0 và tự động "nhảy" (snap) lên đúng vị trí ngay khi quét xong dữ liệu địa hình.

## 5. Tối ưu hóa Tải tài nguyên (Loading & Preloading)

- **Parallel Preloading:** Sử dụng `GLBLoader.preloadBatch()` để tải song song tất cả các file GLB độc nhất ngay khi dữ liệu JSON được fetch, thay vì đợi đến lúc render mới tải.
- **React Suspense:** Bọc mỗi `InstanceRenderer` trong `<Suspense fallback={null}>` để quản lý luồng render bất đồng bộ, giúp bản đồ mượt mà ngay cả khi đang tải hàng loạt model.

---
*Tài liệu này được cập nhật để phản hồi các thay đổi về LOD, Highlight và Terrain Optimization.*

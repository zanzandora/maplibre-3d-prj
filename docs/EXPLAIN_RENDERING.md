# Giải thích Cơ chế Render 3D và Tối ưu hóa hiệu năng

Tài liệu này giải thích các kỹ thuật được sử dụng trong component `InstanceRenderer.tsx` và `ModelManager.tsx` để render hàng ngàn model 3D với hiệu năng cao (> 40 FPS).

## 1. Instanced Rendering (Render hàng loạt)

Thay vì render từng model riêng lẻ (điều này sẽ tạo ra hàng ngàn "Draw Calls" làm nghẽn CPU/GPU), chúng ta sử dụng kỹ thuật **Instanced Rendering** thông qua `THREE.InstancedMesh`.

- **Cơ chế:** GPU chỉ nhận dữ liệu Geometry (hình dạng) và Material (vật liệu) một lần duy nhất. Sau đó, nó sử dụng một mảng các ma trận biến đổi (Transformation Matrices) để vẽ lại hình dạng đó ở nhiều vị trí khác nhau trong một lần vẽ duy nhất.
- **Hiệu quả:** Giảm số lượng Draw Calls từ 1000 xuống còn 1 (hoặc bằng số lượng sub-mesh của model).

## 2. Xử lý Model GLB phức tạp (Multi-mesh)

Một model GLB thường không chỉ là một khối duy nhất mà gồm nhiều phần (sub-meshes) với các vật liệu khác nhau (ví dụ: một căn villa có phần tường, phần kính, phần mái).

- **Vấn đề:** `THREE.InstancedMesh` tiêu chuẩn chỉ hỗ trợ **một** Geometry và **một** Material.
- **Giải pháp:** Trong `InstanceRenderer.tsx`, chúng ta duyệt qua toàn bộ cấu trúc của model GLB:
    1. Trích xuất tất cả các cặp Geometry/Material riêng biệt.
    2. Tạo một `instancedMesh` riêng cho mỗi cặp đó.
    3. Đồng bộ hóa ma trận vị trí (`matrixAt`) cho tất cả các `instancedMesh` này để đảm bảo các bộ phận của model luôn dính liền với nhau.

## 3. Đồng bộ Tọa độ Địa lý (MapLibre & Three.js)

Để model 3D nằm chính xác trên bản đồ MapLibre, chúng ta thực hiện các bước sau:

- **Relative Positioning:** Chuyển đổi tọa độ Lng/Lat sang đơn vị Mercator, sau đó tính toán khoảng cách theo **mét** tương đối so với một điểm gốc (`centerCoord`). Việc này giúp tránh lỗi rung lắc (jittering) do giới hạn độ chính xác của số thực dấu phẩy động (floating point precision).
- **Coordinate Correction:** 
    - Đảo ngược trục Y (`-y`) vì hệ tọa độ của MapLibre và Three.js ngược nhau.
    - Sử dụng `meterScale` để chuyển đổi đơn vị Mercator sang đơn vị mét thực tế.
- **Rotation (Heading):** 
    - Áp dụng Euler rotation với thứ tự `XZY`.
    - Thêm `Math.PI / 2` (90 độ) vào trục X để dựng đứng các model GLB (vốn thường nằm ngang khi export).

## 4. Tăng cường Dữ liệu (Data Augmentation)

Để đáp ứng yêu cầu render 1000 đối tượng khi chỉ có dữ liệu thực tế cho 90 đối tượng:

- Hàm `augmentData` trong `coordinate.ts` thực hiện nhân bản các đối tượng hiện có.
- Thêm các sai số ngẫu nhiên nhỏ vào vị trí (`lng`, `lat`) và góc quay (`yaw/heading`).
- **Lưu ý:** Chỉ thay đổi vị trí mặt bằng và hướng, giữ nguyên cao độ và góc nghiêng để đảm bảo model luôn bám chặt vào mặt đất, không bị chìm hay bay lơ lửng.

## 5. Tương tác (Picking/Click)

Interaction với `InstancedMesh` khác với model thông thường:
- Khi người dùng click, sự kiện của Three.js trả về một `instanceId` (số thứ tự của instance trong mảng).
- Chúng ta sử dụng `instanceId` này để truy ngược lại dữ liệu gốc (ví dụ: lấy ID của căn villa cụ thể đó) và thực hiện các logic xử lý tiếp theo.

---
*Tài liệu này được soạn để hỗ trợ việc bảo trì và mở rộng hệ thống render 3D của dự án.*

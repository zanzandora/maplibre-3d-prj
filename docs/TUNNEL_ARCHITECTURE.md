# Tunnel Architecture: Kiến trúc luồng dữ liệu 3D (MapLibre GL JS)

Tài liệu này trình bày giải pháp kiến trúc để "ship" các vật thể 3D vào bản đồ MapLibre GL JS một cách sạch sẽ, tách biệt logic quản lý dữ liệu khỏi logic render cốt lõi của bản đồ.

## 1. MapView: "Sân chơi" duy nhất

`MapView.tsx` là component trung tâm, đóng vai trò là Map Container. Tuy nhiên, nó không trực tiếp quản lý từng model 3D.

- **Nhiệm vụ:** Khởi tạo bản đồ, quản lý View State (Zoom, Pitch, Bearing), và nạp các Layer nền (Terrain, Vector Tiles).
- **Truyền dẫn:** Map instance được chia sẻ cho các component con thông qua Props.

## 2. MapThreeLayer: Cổng kết nối (The Sync Gateway)

`MapThreeLayer.tsx` đóng vai trò là một "Tunnel" (đường hầm) kết nối giữa MapLibre và Three.js.

- **Nhiệm vụ:**
  - Thiết lập WebGL Context dùng chung.
  - Đồng bộ Camera ma trận 1:1 giữa hai engine.
  - Render nội dung 3D từ con (`children`).

## 3. ModelManager: Quản lý "Hạm đội" 3D

Nằm bên trong `MapThreeLayer`, component này chịu trách nhiệm về dữ liệu.

- **Nhiệm vụ:**
  - Nạp dữ liệu JSON (danh sách model).
  - Tải địa hình (Terrain Polling) để xác định cao độ cho từng model.
  - Lọc model theo tầm nhìn (Culling).
  - Nhóm các model cùng loại để đưa vào `InstanceRenderer`.

## 4. Ưu điểm của kiến trúc Tunnel

1.  **Dễ mở rộng:** Bạn có thể thêm hàng ngàn model mới chỉ bằng cách cập nhật file JSON mà không cần sửa code React.
2.  **Sạch sẽ:** Logic render 3D (Three.js) và logic bản đồ (MapLibre) hoàn toàn tách biệt, nhưng vẫn chia sẻ chung tài nguyên GPU.
3.  **Tối ưu:** Cho phép thực hiện các kỹ thuật Instanced Rendering và Frustum Culling ở tầng cuối cùng của Tunnel.

---
*Kiến trúc quản lý luồng dữ liệu cho dự án WebGIS 3D.*

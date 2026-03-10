# Refactor: Truy xuất trực tiếp Nodes & Materials trong InstanceRenderer

Tài liệu này giải thích sự thay đổi từ việc duyệt `scene` (traversal) sang truy xuất trực tiếp `nodes` và `materials` từ dữ liệu GLTF để tối ưu hóa việc khởi tạo `InstancedMesh`.

## 1. Trước khi Refactor: Duyệt Scene (Scene Traversal)

Trước đây, chúng ta sử dụng `scene.traverse()` để tìm các mesh bên trong model GLB.

- **Cách làm:** Duyệt qua toàn bộ cây phân cấp của đối tượng `scene` (Group, Object3D, Mesh, v.v.).
- **Nhược điểm:**
    - Phụ thuộc vào việc tạo ra một đối tượng `scene` hoàn chỉnh của Three.js.
    - Tốn tài nguyên tính toán để duyệt qua các node không cần thiết (như các Group rỗng).
    - Logic phức tạp hơn khi phải xử lý sự kiện đệ quy.

## 2. Sau khi Refactor: Truy xuất trực tiếp qua Nodes

Trong React Three Fiber, hook `useGLTF` trả về một đối tượng chứa `nodes` và `materials`. Đây là các bản đồ (map) phẳng chứa tất cả các phần tử của model.

- **Cách làm:** 
    ```tsx
    const { nodes } = useGLTF(url);
    // Duyệt qua Object.values(nodes) để lọc các đối tượng là THREE.Mesh
    ```
- **Ưu điểm:**
    - **Hiệu năng:** Truy cập trực tiếp vào các mesh mà không cần duyệt cây phân cấp.
    - **Sạch sẽ (Clean Code):** Không cần "mượn" hay clone đối tượng `scene`. Chúng ta chỉ thực sự lấy những gì cần thiết: `geometry` và `material`.
    - **Đúng chuẩn R3F:** Đây là pattern được khuyến khích khi làm việc với tài nguyên GLTF trong hệ sinh thái React Three Fiber.

## 3. Tác động đến InstancedMesh

Mặc dù cách lấy dữ liệu thay đổi, nhưng bản chất của việc render không thay đổi:
- Chúng ta vẫn trích xuất tất cả các cặp `geometry` và `material`.
- Tạo ra các `instancedMesh` tương ứng để gộp Draw Calls.
- Đảm bảo tính toàn vẹn của model khi có nhiều sub-meshes.

## 4. Tổng kết

Việc thay đổi này giúp component `InstanceRenderer` trở nên nhẹ hơn, giảm bớt sự phụ thuộc vào các đối tượng 3D cồng kềnh và tập trung vào việc quản lý dữ liệu render nguyên bản.

---
*Cập nhật ngày: 10/03/2026*

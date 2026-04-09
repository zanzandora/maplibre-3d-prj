# Báo cáo Kỹ thuật: Triển khai Virtual Scroll cho BIM Model Browser

## 1. Tổng quan (Context)
Trong các ứng dụng BIM, **Model Browser (Cây không gian)** là thành phần quan trọng nhất để quản lý hàng nghìn đối tượng IFC. 

### Vấn đề của phương pháp cũ (Recursive Tree):
- **DOM Explosion:** Mỗi đối tượng (Element) tương ứng với một node DOM. Với 10.000 đối tượng, trình duyệt phải render 10.000+ node.
- **Hiệu năng cực thấp:** Khi "Expand All", trình duyệt bị treo (lag) do phải tính toán lại Layout cho cấu trúc cây lồng nhau rất sâu.
- **Tiêu tốn tài nguyên:** RAM và CPU tăng vọt khi người dùng cuộn hoặc tương tác với cây.

## 2. Giải pháp: Virtualization + Flattening
Chúng ta sử dụng thư viện **`react-virtuoso`** kết hợp với kỹ thuật **Làm phẳng cây (Tree Flattening)**.

### 2.1. Kiến trúc Danh sách phẳng (Flat List Architecture)
Thay vì để các Node lồng nhau (`Parent > Child > Grandchild`), chúng ta chuyển đổi cây thành một mảng phẳng duy nhất chứa các node đang "hiển thị" (về mặt logic).

**Cơ chế hoạt động của `useFlattenTree` hook:**
- Duyệt cây theo chiều sâu (DFS).
- Chỉ đưa vào mảng những node có cha đang ở trạng thái `expanded`.
- Gán thuộc tính `level` (độ sâu) cho mỗi node để xử lý giao diện thụt lề (indentation).

### 2.2. Cơ chế Ảo hóa (Virtualization)
`react-virtuoso` chỉ render các node nằm trong vùng nhìn thấy (Viewport). 
- **Ví dụ:** Nếu danh sách có 10.000 node nhưng màn hình chỉ hiển thị được 20 node, thì DOM chỉ chứa khoảng 25-30 node (bao gồm các node đệm).
- Khi người dùng cuộn, các node cũ bị xóa và các node mới được chèn vào cực nhanh.

## 3. Các thay đổi quan trọng trong Code

### 3.1. Loại bỏ `Collapsible` lồng nhau
Trong `TreeNode.tsx`, chúng ta đã loại bỏ component `Collapsible` và việc render đệ quy `{node.children.map(...)}`.
- **Lý do:** `Collapsible` ẩn hiện bằng CSS (`display: none`), nghĩa là node vẫn tồn tại trong DOM. Virtualization yêu cầu node phải thực sự biến mất khỏi mảng dữ liệu để giải phóng bộ nhớ DOM.
- **Thay thế:** Logic đóng/mở giờ đây điều khiển mảng dữ liệu đầu vào. Khi `toggleNode(id)` được gọi, mảng phẳng được tính toán lại, Virtuoso nhận thấy sự thay đổi và cập nhật lại danh sách hàng.

### 3.2. Mô phỏng cấu trúc phân cấp (Visual Hierarchy)
Dù danh sách là phẳng, chúng ta vẫn giữ được cảm giác cây bằng cách:
- **Indentation:** `style={{ marginLeft: level * 8 }}`.
- **Chevron Icons:** Hiển thị trạng thái đóng/mở dựa trên `expandedIds` từ Store.

## 4. So sánh hiệu năng

| Tiêu chí | Cấu trúc cũ (Recursive) | Cấu trúc mới (Virtual Flat) |
| :--- | :--- | :--- |
| **Số lượng DOM nodes** | $O(N)$ (Tỉ lệ thuận với tổng số node) | $O(1)$ (Cố định theo kích thước màn hình) |
| **Tốc độ render ban đầu** | Chậm dần khi model lớn | Cực nhanh (Gần như tức thì) |
| **Độ sâu DOM** | Rất sâu (Lồng nhau nhiều cấp) | Phẳng (Chỉ 1 cấp duy nhất) |
| **Trải nghiệm cuộn** | Giật lag nếu > 1000 nodes | Mượt mà (60 FPS) ở mọi quy mô |

## 5. Hướng dẫn bảo trì cho Developer

### Cách thêm tính năng mới:
1. **Tìm kiếm (Search):** Cập nhật logic lọc trong `useFlattenTree`. Khi tìm kiếm, hãy tự động "Expand" các node cha của kết quả tìm thấy để chúng hiện lên trong mảng phẳng.
2. **Cuộn đến node được chọn (Scroll to Index):**
   Sử dụng `virtuosoRef`:
   ```tsx
   const virtuosoRef = useRef<VirtuosoHandle>(null);
   // ...
   virtuosoRef.current.scrollToIndex({ index: targetIndex, align: 'center' });
   ```
3. **Thay đổi Style:** Chỉnh sửa trực tiếp trong `TreeNode.tsx`. Vì là danh sách phẳng, việc thay đổi CSS cực kỳ an toàn và không gây lỗi Layout đệ quy.

## 6. Kết luận
Việc chuyển đổi sang Virtual Scroll giúp ứng dụng BIM sẵn sàng xử lý các dự án quy mô lớn (Mega Projects). Đây là chuẩn mực tối ưu cho các giao diện quản lý dữ liệu lớn hiện nay.

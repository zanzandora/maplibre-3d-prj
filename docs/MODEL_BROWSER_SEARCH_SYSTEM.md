# Hệ thống Tìm kiếm Model Browser (Spatial Tree Search)

Tài liệu này giải thích chi tiết cách thức hoạt động của chức năng tìm kiếm trong Model Browser, từ việc quản lý trạng thái, xử lý debounce đến thuật toán lọc và hiển thị cây phân cấp.

## 1. Tổng quan Kiến trúc

Hệ thống tìm kiếm được xây dựng dựa trên sự phối hợp của 4 thành phần chính:

1.  **`treeSlice.ts` (Store):** Lưu trữ từ khóa tìm kiếm (`searchQuery`) toàn cục.
2.  **`SearchInput.tsx` (UI Input):** Tiếp nhận dữ liệu người dùng, thực hiện **Debounce** và hiển thị số lượng kết quả.
3.  **`useFlattenTree.ts` (Core Logic):** Hook quan trọng nhất, chịu trách nhiệm tính toán danh sách các node hiển thị dựa trên từ khóa.
4.  **`LeftPanel.tsx` (Container):** Quản lý layout và hiển thị trạng thái "Không tìm thấy kết quả".

---

## 2. Luồng dữ liệu (Data Flow)

1.  **Input:** Người dùng nhập liệu vào `SearchInput`.
2.  **Debounce:** `SearchInput` sử dụng `localSearch` để phản hồi tức thì về mặt UI, nhưng chỉ cập nhật `searchQuery` lên Store sau **500ms** không nhập liệu để tránh re-render cây quá nhiều lần.
3.  **Trigger:** Khi `searchQuery` trong store thay đổi, hook `useFlattenTree` sẽ tự động tính toán lại.
4.  **Output:** Danh sách các node đã lọc được truyền vào component `Virtuoso` để render hiệu năng cao.

---

## 3. Thuật toán Lọc (Filtering Algorithm)

Thuật toán trong `useFlattenTree` hoạt động theo nguyên tắc **"Bảo toàn tổ tiên" (Ancestor Preservation)**.

### Bước 1: Xác định tập hợp node hiển thị (`visibleIdsInSearch`)
Khi có từ khóa tìm kiếm, hệ thống duyệt qua toàn bộ các node trong `spatialTreeById`. Nếu một node khớp với từ khóa:
- Thêm `id` của node đó vào tập hợp `visibleIdsInSearch`.
- **Quan trọng:** Duyệt ngược lên trên (`parentId`) và thêm tất cả các node tổ tiên (Tầng, Nhóm Category) vào tập hợp này.
- *Mục tiêu:* Đảm bảo kết quả tìm kiếm luôn nằm trong đúng ngữ cảnh phân cấp của nó.

### Bước 2: Làm phẳng cây (Flattening)
Hệ thống duyệt đệ quy từ các node gốc (`roots`):
- Một node chỉ được đẩy vào mảng phẳng nếu `id` của nó nằm trong `visibleIdsInSearch`.
- **Chế độ tự động mở rộng:** 
    - Ở chế độ thường: Node con chỉ hiện nếu cha nó nằm trong `expandedIds`.
    - **Ở chế độ tìm kiếm:** Node con sẽ tự động hiện nếu cha nó nằm trong `visibleIdsInSearch`. Điều này giúp người dùng thấy ngay kết quả mà không cần click mở từng folder.

---

## 4. Hiển thị Số lượng Kết quả

Số lượng kết quả được tính toán trong `SearchInput.tsx` thông qua `useMemo`:
- Chỉ đếm các **Element thực sự** (Node không phải `isGroup` và không phải `IFCBUILDINGSTOREY`).
- Việc đếm này độc lập với logic hiển thị để đảm bảo con số phản ánh đúng tổng số cấu kiện tìm thấy trong toàn bộ model, không chỉ những gì đang hiện trên màn hình.

---

## 5. Các trạng thái UI đặc biệt

### Chế độ Đang tìm kiếm (Searching State)
Khi `localSearch` khác với `searchQuery` (đang trong thời gian debounce), một icon `Loader2` sẽ xoay ở ô Input để báo hiệu cho người dùng rằng hệ thống đang chuẩn bị xử lý.

### Chế độ Không có kết quả (No Results)
Trong `LeftPanel.tsx`, nếu `searchQuery` có giá trị nhưng danh sách `flattenedNodes` rỗng:
- Hiển thị component `SearchX`.
- Cung cấp nút "Clear Search" để nhanh chóng quay lại trạng thái ban đầu.

---

## 6. Lưu ý cho Developer

- **Performance:** Hook `useFlattenTree` được tối ưu với `useMemo`. Tuy nhiên, với các model cực lớn (>100.000 nodes), việc duyệt `Object.values(nodesById)` có thể gây giật nhẹ. Trong tương lai có thể tối ưu bằng Web Worker.
- **Casing:** Mọi phép so sánh chuỗi đều được `toLowerCase()` để đảm bảo tìm kiếm không phân biệt hoa thường.
- **Normalized Data:** Hệ thống hoạt động hiệu quả nhờ dữ liệu cây đã được chuẩn hóa (normalized) trong Store, giúp truy cập node theo ID đạt độ phức tạp O(1).

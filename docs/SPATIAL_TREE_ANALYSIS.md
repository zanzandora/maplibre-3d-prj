# Tài liệu Phân tích Logic: Hệ thống Cây Không gian (Spatial Tree)

## 1. Tổng quan
Tiện ích `generateSpatialTree` chịu trách nhiệm xây dựng cấu trúc phân cấp cho mô hình BIM sau khi được nạp vào ứng dụng. Mục tiêu là tạo ra một cấu trúc dữ liệu dễ điều hướng, giúp người dùng quản lý hàng chục ngàn cấu kiện theo tầng và loại.

## 2. Luồng xử lý chi tiết

### Bước 1: Khởi tạo và Tính toán Quan hệ
```typescript
await model.getSpatialStructure();
```
Hàm này yêu cầu Engine của `@thatopen/fragments` phân tích các quan hệ `IfcRelAggregates` và `IfcRelContainedInSpatialStructure` từ file IFC để xác định cấu kiện nào thuộc tầng nào.

### Bước 2: Tạo Bộ lọc Hình học (Validation)
Để tránh việc cây thư mục bị rác bởi các đối tượng không có hình dạng hiển thị:
- Lấy danh sách tất cả ID có hình học qua `model.getItemsWithGeometry()`.
- Lưu vào một `Set<number>` để tối ưu hóa việc tìm kiếm sau này.

### Bước 3: Truy xuất Dữ liệu Tầng (Storeys)
- Tìm các ID thuộc category `IFCBUILDINGSTOREY`.
- Lấy thông tin thuộc tính `Name` của các tầng để hiển thị trên UI.

### Bước 4: Xây dựng Cấu trúc Phân cấp (The Loop)
Với mỗi tầng, quy trình sau được thực hiện:
1. **Lấy con**: Tìm tất cả ID con của tầng đó.
2. **Lọc**: Chỉ giữ lại các con có ID nằm trong `validIds` (đã lọc ở Bước 2).
3. **Batch Data Fetch (Quan trọng)**: 
   ```typescript
   const childrenData = await model.getItemsData(validChildrenIds, { ... });
   ```
   Thay vì `await` trong vòng lặp, chúng ta lấy dữ liệu của toàn bộ 1000+ cấu kiện trong 1 lần gọi duy nhất. Điều này giảm thời gian xử lý từ hàng giây xuống hàng miligiây.
4. **Phân nhóm Category**:
   - Duyệt qua dữ liệu con, bóc tách tên loại (ví dụ: `IFCWALLSTANDARDCASE` -> `WallStandardCase`).
   - Sử dụng một Hash Map (`typeGroups`) để nhóm các ID cấu kiện theo loại.
5. **Khởi tạo Node**:
   - Tạo node cho từng cấu kiện.
   - Tạo node trung gian `CategoryGroup` để gom nhóm (giúp UI gọn gàng hơn, ví dụ: "Tầng 1 > Wall > [Wall_1, Wall_2...]").

## 3. Cấu trúc dữ liệu đầu ra (Normalization)
Hàm trả về một object theo mô hình chuẩn hóa:
- **nodes**: Một đối tượng chứa tất cả các node (Storey, Group, Element), truy cập bằng ID.
- **roots**: Mảng chứa các ID của tầng (Gốc của cây).

```json
{
  "nodes": {
    "123": { "id": "123", "label": "Tầng 1", "type": "IfcBuildingStorey", "children": ["GROUP_123_Wall"] },
    "GROUP_123_Wall": { "isGroup": true, "label": "Wall", "children": [456, 457] },
    "456": { "id": 456, "label": "Bức tường A", "type": "Wall" }
  },
  "roots": ["123"]
}
```

## 4. Các điểm tối ưu kỹ thuật (Performance Highlights)

| Kỹ thuật | Giải thích | Hiệu quả |
| :--- | :--- | :--- |
| **Set Lookup** | Sử dụng `Set.has(id)` thay vì `Array.includes(id)`. | Chuyển từ $O(n)$ sang $O(1)$. Cực nhanh khi xử lý >40k cấu kiện. |
| **Batch API** | Sử dụng `getItemsData` cho toàn bộ mảng ID. | Giảm thiểu số lượng Round-trip đến bộ nhớ/worker. |
| **String Manipulation** | Sử dụng regex/replace đơn giản để làm sạch tên Category. | Giúp UI hiển thị thân thiện (loại bỏ tiền tố `IFC`). |
| **No-Await Loop** | Vòng lặp cuối cùng chỉ thao tác trên biến cục bộ, không có tác vụ bất đồng bộ. | Đảm bảo loop chạy ở tốc độ tối đa của CPU. |

## 5. Lưu ý cho Developer
- Khi thêm một Category mới vào bộ lọc, hãy kiểm tra lại Regex trong `model.getItemsOfCategories`.
- Cấu trúc `parentId` được lưu sẵn trong mỗi node để hỗ trợ các chức năng tìm ngược (breadcrumbs) hoặc highlight trên cây khi chọn vật thể 3D.

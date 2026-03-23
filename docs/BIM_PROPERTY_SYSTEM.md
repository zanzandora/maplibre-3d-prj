# 🏗️ Kiến trúc Hệ thống Thuộc tính BIM (Dynamic Properties & Psets)

Tài liệu này giải thích logic xử lý dữ liệu từ IFC Fragments vào giao diện người dùng, tập trung vào tính động và khả năng mở rộng.

---

## 1. Luồng dữ liệu (Data Flow)

`Mô hình IFC` ➔ `That Open Fragments` ➔ `BIMProvider (Processing)` ➔ `Zustand Store` ➔ `RightPanel (UI Rendering)`

---

## 2. Chi tiết logic tại BIMProvider

### A. Truy vấn Quan hệ (Relations Query)
Trong IFC, các thông số chi tiết (Volume, Fire Rating, Material...) không nằm ở root của cấu kiện mà nằm trong các **Property Sets (Psets)**. Chúng ta sử dụng `model.getItemsData` với tham số `relations` để "leo" qua các mối quan hệ này:

```typescript
model.getItemsData([...ids], {
  attributesDefault: true,
  relations: {
    IsDefinedBy: {           // Quan hệ nối Element với Pset
      attributes: true,
      relations: {
        HasProperties: {     // Quan hệ nối Pset với các Property lẻ
          attributes: true
        }
      }
    }
  }
})
```

### B. Xử lý và Làm sạch Dữ liệu (Flattening)
Dữ liệu thô từ Fragments thường bọc giá trị trong một object `{ value: ... }`. Chúng ta thực hiện "phẳng hóa" (flatten) để Store nhận được giá trị trực tiếp:

1.  **Flatten Attributes:** Duyệt qua các key của item, nếu có `.value` thì lấy giá trị bên trong.
2.  **Group Psets:** Duyệt qua mảng `IsDefinedBy`, nhóm các thuộc tính vào một object map theo tên Pset (ví dụ: `Pset_WallCommon`).

---

## 3. Cấu trúc Store (`SelectedElement`)

Thay vì định nghĩa cứng (hardcode) các field như `material`, `volume`, chúng ta sử dụng **Index Signature**:

```typescript
export interface SelectedElement {
  ExpressId: number;
  [key: string]: any; // Cho phép chứa bất kỳ thuộc tính nào từ IFC
  psets: Record<string, Record<string, any>>; // Chứa các nhóm Pset
}
```

---

## 4. Logic Hiển thị tại RightPanel

### A. Bộ lọc Thông minh (Filtering)
Để tránh làm rối người dùng với dữ liệu kỹ thuật, hàm `getDisplayAttributes` thực hiện:
-   **Skip list:** Bỏ qua `ExpressId` (vì đã hiện ở header), `psets` (vì hiện ở section riêng).
-   **Internal skip:** Bỏ qua các key bắt đầu bằng `_` (dữ liệu nội bộ của Engine).
-   **Value filter:** Chỉ hiện các giá trị nguyên tử (string, number...), không hiện các object phức tạp chưa xử lý.

### B. Tự động Ẩn dữ liệu Rỗng (Null-safe Rendering)
-   Nếu một thuộc tính có giá trị `null`, `undefined` hoặc `""`, nó sẽ bị loại bỏ.
-   Nếu một **Property Set** không còn thuộc tính nào hợp lệ sau khi lọc, toàn bộ section đó sẽ **không được render** trên UI.

---

## 5. Hướng phát triển cho Dev
Khi cần thêm dữ liệu mới từ IFC (ví dụ: Quantities/Qto):
1.  Cập nhật `relations` trong `BIMProvider.tsx` để bao gồm `IsDefinedBy` hoặc quan hệ tương ứng.
2.  UI sẽ **tự động** nhận diện và hiển thị các section mới mà không cần sửa code tại `RightPanel.tsx`.

---
*Ghi chú: Luôn kiểm tra Console để xem cấu trúc `Retrieved Item Properties` khi tích hợp các loại cấu kiện IFC mới.*

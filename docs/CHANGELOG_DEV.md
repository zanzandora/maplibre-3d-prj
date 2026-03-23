# Developer Changelog - BIM Tooling Refactor

## 📅 Date: 2026-03-23
## 🛠 Changes: Refactor Tool Management System

### 1. Kiến trúc Store (Zustand)
Đã chuyển đổi việc quản lý trạng thái hiển thị của BIM Viewer và các công cụ từ Props sang Store để tránh **Prop Drilling**.
- **File:** `src/components/store/useBIMStore.ts`
- **State mới:** 
    - `isBIMVisible`: Boolean quản lý việc đóng/mở viewer.
    - `activeTool`: String quản lý công cụ đang hoạt động (`'clip'`, `'select'`, v.v.).
- **Actions:** `setBIMVisible`, `setActiveTool`.

### 2. BIMProvider & Tool Controller
Refactor lại cách `BIMProvider` xử lý logic của các công cụ để đảm bảo tính mở rộng (Scalability) và quản lý vòng đời (Lifecycle).

#### 🔄 Quy trình mới cho Dev:
Thay vì viết logic trực tiếp vào hàm `mount`, các công cụ hiện tại được quản lý qua `useEffect` và `switch-case`.

- **Hàm Setup riêng biệt:** Mỗi công cụ nên có một hàm setup riêng (ví dụ: `setupClipper`) trả về một hàm `cleanup`.
- **Switch Controller:** Thêm `case` mới vào `useEffect` chính để kích hoạt công cụ.

#### 📝 Ví dụ khi thêm công cụ mới (e.g., Measure):
1. Tạo hàm `setupMeasure`:
```typescript
const setupMeasure = useCallback((components, world, container) => {
  const measure = components.get(OBC.Measurement);
  measure.enabled = true;
  // ... logic add event listeners
  return () => {
    measure.enabled = false;
    // ... logic remove event listeners
  };
}, []);
```
2. Thêm vào Switch statement:
```typescript
switch (activeTool) {
  case 'clip':
    cleanup = setupClipper(components, world, container);
    break;
  case 'measure':
    cleanup = setupMeasure(components, world, container);
    break;
}
```

### 3. Quản lý Event Listeners
**Lưu ý quan trọng:** Luôn phải thực hiện `removeEventListener` trong hàm cleanup trả về từ các hàm setup công cụ.
- Hiện tại `Clipper` đã được refactor để tự động gỡ bỏ `dblclick` và `keydown` khi người dùng chuyển sang công cụ khác hoặc đóng Viewer.

### 4. UI Components
- `App.tsx`: Chỉ còn nhiệm vụ render dựa trên `isBIMVisible`.
- `Header.tsx`: Sử dụng `useBIMStore` để trigger hành động đóng viewer.
- `Toolbar.tsx`: Cập nhật `activeTool` trực tiếp vào store.

---
*Người thực hiện: Gemini CLI*

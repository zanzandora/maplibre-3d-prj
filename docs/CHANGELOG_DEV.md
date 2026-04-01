# Developer Changelog - BIM Tooling Refactor

## 📅 Date: 2026-04-01
## 🛠 Changes: UI Theme Integration & Measure Tool Synchronization

### 1. Đồng bộ hóa Hệ thống Đơn vị (Unit Synchronization)
Đã tái cấu trúc cách quản lý đơn vị đo lường để đảm bảo tính nhất quán giữa Length, Area và Volume.
- **Store mới:** Chuyển `measureUnit` sang `measureBaseUnitIndex` (0: mm, 1: cm, 2: m, 3: km).
- **Logic:** Khi người dùng chọn 'm' tại Length, Area sẽ tự động chuyển sang 'm2' và Volume là 'm3'.
- **File:** `src/store/slices/measureSlice.ts`, `src/hooks/engine/useToolController.ts`.

### 2. Sửa lỗi Measure Tool & Raycasting
Giải quyết các vấn đề nghiêm trọng liên quan đến việc đo đạc và chọn đối tượng (Picking).
- **Lỗi Area/Volume:** Sửa lỗi double-click kết thúc quá trình tạo đường đo quá sớm. Hiện tại đã sử dụng sự kiện `onBeforeCreate` của thư viện để quản lý vòng đời đo đạc.
- **Lỗi Volume TypeError:** Fix lỗi `Cannot read properties of undefined (reading 'modelId')` bằng cách đảm bảo các Fragment Mesh thực tế được đăng ký vào `world.meshes` ngay khi tải model.
- **Tối ưu hóa Picking:** Loại bỏ logic "Fake Mesh" (tạo lưới giả) trong `Measure.ts`, thay vào đó sử dụng lưới Fragment gốc để đảm bảo độ chính xác và metadata (modelId, expressID) luôn sẵn có.

### 3. Theme Integration (Custom CSS Variables)
Tích hợp các UI Elements với hệ thống Theme (Light/Dark) sử dụng CSS Variables.
- **NativeSelect:** Refactor để sử dụng `--bim-bg-item`, `--bim-text-main`, v.v. Đảm bảo giao diện đồng nhất mà không cần viết quá nhiều class Tailwind `dark:`.
- **BIM Viewer Background:** Tự động cập nhật màu nền của Scene Three.js dựa trên `theme` hiện tại (`#202932` cho Dark, `#ddf2f7` cho Light).

### 4. Quản lý Vòng đời & Cleanup (Lifecycle Fixes)
- **Lỗi Logout/Unmount:** Giải quyết lỗi `A renderer is needed for the raycaster to work!` bằng cách thực hiện cleanup theo thứ tự: Dispose `Raycasters` trước khi dispose toàn bộ `Components`.
- **Model Cleanup:** Đã thêm logic xóa các mesh con khỏi `world.meshes` khi chuyển đổi dự án hoặc đóng viewer để tránh rò rỉ bộ nhớ (Memory Leak).

---

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

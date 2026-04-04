# StreetView MiniMap Component Documentation

## 1. Tổng quan
`StreetViewMiniMap` là một component radar/mini-map tùy chỉnh được xây dựng trên nền tảng **MapLibre GL** (thông qua `react-map-gl`). Nó được thiết kế để hoạt động đồng bộ với một trình xem ảnh toàn cảnh 360 độ (Photo Sphere Viewer), giúp người dùng định vị hướng nhìn và di chuyển giữa các điểm chụp (nodes) một cách trực quan.

## 2. Cấu trúc Thư mục
Component được chia nhỏ để dễ bảo trì và mở rộng:
- `index.tsx`: Entry point, quản lý trạng thái bản đồ (ViewState, Expand/Collapse) và lớp phủ chuyển cảnh.
- `ConeMarker.tsx`: Hiển thị nón thị giác (Radar) và xử lý logic xoay hướng nhìn.
- `HotspotMarkers.tsx`: Hiển thị các điểm di chuyển (nodes) khả dụng trên bản đồ.
- `MapControls.tsx`: Các nút điều khiển giao diện (Phóng to, Reset).
- `types.ts`: Định nghĩa Interface và kiểu dữ liệu.

## 3. Các Logic Quan Trọng

### 3.1. Shortest Path Rotation (Xoay theo đường ngắn nhất)
**Vị trí:** `ConeMarker.tsx`

**Vấn đề:** Trong CSS/DOM, khi xoay từ 359° sang 1°, nếu không xử lý, phần tử sẽ quay ngược một vòng lớn (358°) để về đích.
**Giải pháp:** 
Sử dụng logic tính toán góc xoay lũy kế (`cumulativeYaw`):
```typescript
let delta = newYawDeg - prevYawRef.current;
if (delta > 180) delta -= 360;   // Đi ngược lại nếu khoảng cách > 180
if (delta < -180) delta += 360;  // Đi xuôi lại nếu khoảng cách < -180

cumulativeYawRef.current += delta;
```
**Tác dụng:** Đảm bảo nón thị giác luôn xoay theo hướng ngắn nhất, mượt mà và không bao giờ bị giật vòng tròn khi đi qua điểm Bắc (0°).

### 3.2. Transition Overlay (Lớp phủ chuyển cảnh)
**Vị trí:** `index.tsx`

**Vấn đề:** Khi container thay đổi kích thước (`width/height`), engine WebGL của bản đồ không tự động khớp kích thước ngay lập tức, gây ra hiện tượng bản đồ bị trôi, méo hoặc hiển thị khoảng trắng.
**Giải pháp:** 
- Sử dụng một `div` màu trắng làm lớp phủ (Overlay) có `opacity` thay đổi.
- Kích hoạt Overlay ngay khi bắt đầu Expand/Collapse.
- Sử dụng sự kiện `onTransitionEnd` để xác định thời điểm kết thúc hiệu ứng CSS.
- Gọi `map.resize()` và `map.jumpTo(currentLngLat)` trước khi ẩn Overlay.

**Tác dụng:** Che đi các "nhiễu" đồ họa trong quá trình thay đổi kích thước, tạo cảm giác ứng dụng phản hồi chuyên nghiệp và sạch sẽ.

### 3.3. Interaction Management (Quản lý tương tác)
**Vị trí:** `index.tsx`

**Cơ chế:**
Sử dụng `isUserInteractingRef` để theo dõi khi người dùng chủ động thao tác trên bản đồ (pan/zoom).
- Nếu người dùng đang tương tác: Bản đồ dừng việc tự động căn giữa (`Auto-centering`).
- Nếu người dùng không tương tác: Bản đồ sử dụng `easeTo` để mượt mà đưa vị trí hiện tại của người dùng vào tâm khung hình mỗi khi họ di chuyển trong Street View.

## 4. Props Interface
| Prop | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `viewer` | `Viewer` | Instance của Photo Sphere Viewer để lắng nghe sự kiện xoay. |
| `currentLngLat` | `[number, number]` | Tọa độ GPS hiện tại của người dùng [Kinh độ, Vĩ độ]. |
| `nodes` | `PSVNode[]` | Danh sách tất cả các điểm 360 có trong hệ thống. |
| `onHotspotClick` | `(id) => void` | Callback khi người dùng chọn một điểm khác trên mini-map. |
| `zoom` | `number` | Mức zoom mặc định (mặc định: 18). |
| `coneColor` | `string` | Màu sắc của nón thị giác (mặc định: xanh radar). |

## 5. Lưu ý cho Developer
1. **Performance:** Nón thị giác (`ConeMarker`) được tách riêng để khi xoay hướng nhìn, chỉ có marker này re-render, không gây ảnh hưởng đến hiệu năng của bản đồ chính.
2. **WebGL Context:** MapLibre sẽ tự động hủy context khi component unmount nhờ logic dọn dẹp trong `useEffect` của `index.tsx`.
3. **Interactive:** Bản đồ cho phép tương tác ở cả hai chế độ. Tuy nhiên, trong chế độ mini, người dùng nên reset view nếu bản đồ bị trôi quá xa.

---
*Tài liệu này được biên soạn để hướng dẫn phát triển và bảo trì component StreetViewMiniMap.*

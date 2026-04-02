# Street View Integration Documentation

Tài liệu này giải thích chi tiết về tính năng Street View được tích hợp bằng MapLibre GL JS và Photo Sphere Viewer (PSV).

## 1. Kiến trúc tổng quan (Architecture)

Hệ thống được thiết kế theo mô hình **Bản đồ 2D (MapLibre)** làm lớp nền điều khiển và **Trình xem 3D (PSV)** làm lớp phủ (overlay) chi tiết.

- **Frontend Framework:** React 19 / Vite.
- **2D Engine:** `maplibre-gl` thông qua `react-map-gl`.
- **3D Engine:** `@photo-sphere-viewer/core`.
- **Navigation:** `@photo-sphere-viewer/virtual-tour-plugin` (GPS Mode).

## 2. Luồng dữ liệu (Data Flow)

### A. Fetching & Transformation (`useStreetViewData`)
Dữ liệu được lấy từ API của `maps.vgm.ai`. Sau khi tải về, dữ liệu trải qua quá trình "Adaptation":
- **Mapping Coordinates:** Chuyển đổi `lon`, `lat` thành mảng `gps: [number, number]`.
- **Automatic Linking:** Tạo thuộc tính `links` cho mỗi node. Mỗi node sẽ tự động liên kết với tất cả các node khác trong danh sách để Plugin Virtual Tour có thể tính toán hướng mũi tên 3D dựa trên vị trí GPS.

### B. Synchronizing 2D & 3D
1. **2D -> 3D:** Khi click vào Marker trên bản đồ, ID của điểm đó được truyền vào `StreetViewComponent` làm `startNodeId`.
2. **3D -> 2D:** Khi người dùng di chuyển trong không gian 3D (click vào mũi tên), Plugin Virtual Tour phát đi sự kiện `node-changed`. Component sẽ bắt sự kiện này và gọi callback `onNodeChange` để cập nhật tọa độ GPS ngược lại cho bản đồ 2D (`map.flyTo`).

## 3. Các thành phần chính (Components)

### `MapComponent.tsx`
- Trách nhiệm: Hiển thị bản đồ, vẽ marker, và xử lý hiệu ứng di chuyển camera (`flyTo`).
- Sử dụng `MapRef` để truy cập trực tiếp vào instance của MapLibre nhằm thực hiện các hành động imperative.

### `StreetViewComponent.tsx`
- Trách nhiệm: Khởi tạo WebGL Viewer cho ảnh 360 độ.
- **Quan trọng:** Sử dụng chế độ `positionMode: 'gps'` và `renderMode: '3d'` để hiển thị mũi tên điều hướng trong không gian thực.
- **Memory Management:** Thực hiện `viewer.destroy()` trong hàm cleanup của `useEffect` để giải phóng context WebGL, tránh rò rỉ bộ nhớ.

### `useStreetViewData.ts`
- Trách nhiệm: Quản lý trạng thái fetching (loading, error) và logic chuyển đổi định dạng dữ liệu cho PSV.

## 4. Cơ chế Virtual Tour (GPS Mode)

Trong chế độ GPS, chúng ta không cần định nghĩa góc quay (yaw/pitch) thủ công cho các mũi tên. 
- Plugin sẽ lấy tọa độ GPS của Node hiện tại và Node đích.
- Nó tính toán góc mang (bearing) giữa 2 điểm địa lý.
- Tự động vẽ mũi tên chỉ đúng hướng của điểm tiếp theo trong không gian 3D.

**Lưu ý về `links`:** Thuộc tính `links` là bắt buộc trong Client Mode của Virtual Tour Plugin để nó biết node nào có thể đi đến node nào.

## 5. Xử lý lỗi & Tối ưu hóa (Troubleshooting)

- **Lỗi `loadNode` / `_loaded`**: Thường do Viewer bị khởi tạo lại quá nhiều lần (re-render). Đã được khắc phục bằng cách tách biệt logic khởi tạo Viewer khỏi sự thay đổi của `startNodeId`.
- **Z-Index:** Street View Overlay sử dụng `zIndex: 1000` để đảm bảo luôn nằm trên bản đồ và các UI khác.
- **Cleanup:** Luôn đảm bảo Viewer được destroy sạch sẽ khi component unmount để tránh treo trình duyệt do quá tải context WebGL.

## 6. Hướng phát triển (Next Steps)
- Thêm thuộc tính `altitude` (cao độ) vào mảng GPS nếu dữ liệu API hỗ trợ để mũi tên hiển thị chính xác ở các tầng khác nhau.
- Tích hợp thêm Plugin `Markers` của PSV để hiển thị các điểm thông tin (POI) ngay trong ảnh 360.

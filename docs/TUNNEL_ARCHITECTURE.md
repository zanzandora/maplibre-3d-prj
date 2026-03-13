# Kiến trúc Bridge & Tunnel (với tunnel-rat)

Tài liệu này trình bày giải pháp kiến trúc để "ship" các vật thể 3D vào bản đồ MapLibre một cách sạch sẽ, tách biệt logic quản lý dữ liệu khỏi logic render cốt lõi của bản đồ.

## 1. Vấn đề hiện tại (The Coupling Problem)

Trong kiến trúc truyền thống, các vật thể 3D (như `ModelManager`) thường phải đặt lồng sâu bên trong component `Canvas` của bản đồ để có thể truy cập vào Three.js Context.

**Hệ quả:**

- **Prop Drilling:** Việc truyền dữ liệu từ UI (Sidebar, Search) xuống `ModelManager` qua nhiều tầng trung gian.
- **Phá vỡ tính đóng gói:** Component bản đồ (`MapThreeLayer`) phải biết quá nhiều về logic nghiệp vụ (building data, filtering).
- **Khó mở rộng:** Muốn thêm một loại vật thể 3D mới (ví dụ: hiệu ứng thời tiết, vạch kẻ đường) bắt buộc phải sửa trực tiếp vào core của layer bản đồ.

## 2. Giải pháp: Tunnel Architecture

Giải pháp sử dụng thư viện `tunnel-rat` để tạo ra một "cổng dịch chuyển" (Portal) cho các React Component.

### Khái niệm In/Out:

- **Tunnel In (`<map3d.In>`):** Cổng vào. Có thể đặt ở **bất kỳ đâu** trong ứng dụng React (ngay cả bên ngoài Canvas).
- **Tunnel Out (`<map3d.Out>`):** Cổng ra. Đặt cố định bên trong **Scene 3D** của bản đồ.

Mọi component được bọc trong cổng `In` sẽ được "ship" và render chính xác tại vị trí cổng `Out`.

---

## 3. Triển khai kỹ thuật

### Bước 1: Khởi tạo Tunnel

Tạo một file trung tâm để quản lý các tunnel.

```typescript
// src/engine/MapTunnel.ts
import tunnel from 'tunnel-rat';
export const map3d = tunnel();
```

### Bước 2: Đặt cổng thoát (The Sink)

Trong core render của bản đồ, ta chỉ đặt cổng thoát.

```tsx
// src/components/map3d/MapThreeLayer.tsx
import { map3d } from '../../engine/MapTunnel';

export const MapThreeLayer = () => {
  return (
    <Canvas>
      <CameraSync />
      <Lights />

      {/* Cổng thoát: Điểm tập kết của mọi vật thể 3D được ship tới */}
      <map3d.Out />
    </Canvas>
  );
};
```

### Bước 3: Ship vật thể (The Source)

`ModelManager` giờ đây có thể nằm cạnh UI hoặc ở tầng cao nhất, giúp truy cập State dễ dàng.

```tsx
// src/loader/ModelManager.tsx
import { map3d } from '../engine/MapTunnel';

export const ModelManager = ({ buildings }) => {
  return (
    <map3d.In>
       {/* Nội dung 3D thực tế */}
       <Bvh firstHitOnly>
          {buildings.map(b => <InstanceRenderer ... />)}
       </Bvh>
    </map3d.In>
  );
}
```

---

## 4. Lợi ích kiến trúc

### 1. Tách biệt mối quan tâm (Separation of Concerns)

- **Map Core:** Chỉ lo việc khởi tạo, đồng bộ Camera và xử lý Layer.
- **Feature Modules:** Tự quản lý dữ liệu và "đăng ký" hiển thị thông qua Tunnel.

### 2. UI-First Workflow

Developer làm việc với UI có thể thêm các chỉ dẫn 3D (Markers, Highlight) ngay bên cạnh code logic của họ mà không cần biết `MapThreeLayer` hoạt động ra sao.

### 3. Hiệu năng (Performance)

Khi dữ liệu trong `ModelManager` thay đổi, React chỉ re-render nội dung bên trong Tunnel. Cấu trúc Bridge của bản đồ không bị ảnh hưởng, giúp giảm thiểu rủi ro giật lag frame hình.

### 4. Khả năng bảo trì

Việc debug trở nên dễ dàng hơn vì bạn có thể tìm thấy code render 3D nằm ngay gần code xử lý dữ liệu của tính năng đó.

## 5. Lưu ý khi sử dụng

- **Context:** `tunnel-rat` bảo toàn Context của nơi định nghĩa cổng `In`. Tuy nhiên, vì cổng `Out` nằm trong `Canvas`, các component đi qua tunnel vẫn sẽ nhận được đầy đủ hook của R3F như `useThree`, `useFrame`.
- **Thứ tự Render:** Các component bọc trong cổng `In` sẽ xuất hiện trong Scene theo thứ tự mà chúng được mount vào tunnel.

---

_Tài liệu này hướng dẫn dev sử dụng tunnel để xây dựng hệ thống Plug-and-Play cho Map 3D._

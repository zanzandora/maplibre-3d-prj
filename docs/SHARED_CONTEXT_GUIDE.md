# Shared WebGL Context: Kiến trúc "Ký sinh" Cao cấp

Tài liệu này trình bày giải pháp tích hợp Three.js vào MapLibre GL JS v5+ thông qua một Custom Layer duy nhất, sử dụng chung WebGL Context và Z-buffer.

## 1. Hạn chế của Logic cũ (Legacy Overlay)
- **Context Loss:** Sử dụng nhiều thẻ `<Canvas>` dẫn đến việc vượt quá giới hạn WebGL Context của trình duyệt (thường là 8-16).
- **Z-Fighting:** Model 3D không thể bị che khuất bởi địa hình MapLibre vì dùng 2 Z-buffer độc lập.
- **Floating-point Jitter:** Tính toán tọa độ tuyệt đối ở mức Zoom cao gây ra hiện tượng rung lắc (jittering) do sai số số thực dấu phẩy động.

## 2. Giải pháp Đột phá: Parasitic R3F Root
Thay vì tạo một ứng dụng React mới, chúng ta "ký sinh" một React Three Fiber Root trực tiếp vào Canvas của MapLibre.

### Cơ chế Cache Root (`__r3fSetup`)
Để tránh việc khởi tạo lại nặng nề mỗi khi layer bị re-mount, R3F Root và WebGLRenderer được cache trực tiếp trên đối tượng `HTMLCanvasElement`:
```typescript
// Định nghĩa trong global.d.ts
canvas.__r3fSetup = { renderer, scene, camera, root };
```

### Đồng bộ Ma trận (The Y-Z Swap Breakthrough)
MapLibre sử dụng hệ tọa độ **Z-up** (Z là độ cao), trong khi Three.js sử dụng **Y-up**. Để model không bị "lún" hay xoay sai hướng, chúng ta sử dụng một ma trận thế giới (World Matrix) thủ công để tráo đổi trục:

```typescript
// Ma trận Row-major để map: X->X, Y->Z, Z->Y
WORLD_MATRIX.set(
  s, 0, 0, cx, // X Three.js -> East Mercator
  0, 0, s, cy, // Z Three.js -> South Mercator
  0, s, 0, cz, // Y Three.js -> Altitude Mercator
  0, 0, 0, 1
);
```

## 3. Quản lý WebGL State (Chống lớp Drape)
Một vấn đề nghiêm trọng là lớp **Drape** (phủ texture địa hình) của MapLibre thường ghi đè Z-buffer. Chúng ta buộc phải ép trạng thái WebGL trước mỗi frame render của Three.js:
```typescript
gl.enable(gl.DEPTH_TEST);
gl.depthMask(true);
renderer.resetState();
```

## 4. Lưu ý sống còn cho Developer
- **TUYỆT ĐỐI KHÔNG** bỏ các component của `react-map-gl` (như `<Source>`, `<Layer>`) vào bên trong `<MapThreeLayer>`. Điều này gây lỗi **Context Loss** do R3F tạo ra một cây React độc lập.
- **Asset Path:** Luôn đặt model GLB trong `public/map3d/` và truy cập qua đường dẫn tuyệt đối từ root.

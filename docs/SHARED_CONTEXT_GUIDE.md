# Shared WebGL Context: Kiến trúc "Ký sinh" Cao cấp (MapLibre GL JS)

Tài liệu này trình bày giải pháp tích hợp Three.js vào MapLibre GL JS thông qua một Custom Layer duy nhất, sử dụng chung WebGL Context và Z-buffer.

## 1. Tại sao dùng Shared Context?

Trong ứng dụng WebGIS 3D thông thường, developer thường đặt một `<Canvas />` của Three.js đè lên trên bản đồ. Cách này gây ra hai nhược điểm chết người:
- **Z-buffer Separation:** Model 3D không thể bị che khuất bởi địa hình (Terrain) của bản đồ.
- **Camera Lag:** Camera của Three.js luôn bị trễ một frame so với bản đồ khi xoay/pan.

**Giải pháp:** Chúng ta "ký sinh" một React Three Fiber Root trực tiếp vào Canvas của MapLibre GL JS.

## 2. Kỹ thuật "Ký sinh" (Parasitic Root)

Bên trong component `MapThreeLayer`, chúng ta sử dụng `createRoot` từ `@react-three/fiber` để khởi tạo một Root không có Canvas riêng:

```typescript
// maplibre-gl custom layer
onAdd: function (mapInstance, gl) {
  const root = createRoot(mapInstance.getCanvas());
  root.configure({
    gl: new THREE.WebGLRenderer({ canvas: mapInstance.getCanvas(), context: gl }),
    frameloop: 'never', // Frame được điều khiển bởi MapLibre
  });
}
```

## 3. Đồng bộ hóa Ma trận và Hệ tọa độ

MapLibre GL JS sử dụng hệ tọa độ **Z-up** (Z là độ cao), trong khi Three.js sử dụng **Y-up**. Để model không bị "lún" hay xoay sai hướng, chúng ta sử dụng một ma trận thế giới (World Matrix) thủ công để tráo đổi trục:

```typescript
WORLD_MATRIX.set(
  s, 0, 0, centerCoord.x,
  0, 0, s, centerCoord.y,
  0, s, 0, centerCoord.z,
  0, 0, 0, 1
);
camera.projectionMatrix.copy(MAP_MATRIX).multiply(WORLD_MATRIX);
```

## 4. Chế ngự lớp "Drape" (Depth Occlusion)

Một vấn đề nghiêm trọng là lớp **Drape** (phủ texture địa hình) của MapLibre GL JS thường ghi đè Z-buffer. Chúng ta buộc phải ép trạng thái WebGL trước mỗi frame render của Three.js:

```typescript
gl.enable(gl.DEPTH_TEST);
gl.depthMask(true);
renderer.resetState();
```

Kỹ thuật này đảm bảo model 3D luôn được render đúng độ sâu so với núi non và công trình trong bản đồ gốc.

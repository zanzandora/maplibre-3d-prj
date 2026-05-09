# Các mô hình tối ưu hóa hiệu năng 3D Tiles

Tài liệu này mô tả các kỹ thuật render hiệu năng cao cho 3D Tiles trong môi trường
Three.js và React Three Fiber (R3F), dựa trên các tiêu chuẩn công nghiệp và những
cải tiến mới nhất từ thư viện `3d-tiles-renderer-js`.

## Chiến lược tối ưu hóa cốt lõi

Để duy trì tốc độ khung hình cao (40+ FPS) khi hiển thị các tập dữ liệu 3D Tiles
phức tạp cùng với MapLibre GL JS, bạn cần ưu tiên quản lý bộ nhớ GPU và tối ưu
hóa quá trình duyệt cây dữ liệu (traversal).

### 1. Nén Geometry và Texture

Các tập dữ liệu lớn có thể nhanh chóng làm cạn kiệt bộ nhớ VRAM của GPU, dẫn đến
trình duyệt bị treo, đặc biệt là trên các thiết bị di động.

- **`TilesCompressionPlugin`:** Sử dụng plugin này để kích hoạt nén geometry và
  tối ưu hóa việc sử dụng mipmap. Nó có thể giảm mức chiếm dụng bộ nhớ GPU hơn 30%.
- **Texture Subframe Uploads:** Tránh hiện tượng "khựng" (stall) trong vòng lặp
  render bằng cách chỉ tải các phần dữ liệu texture cần thiết lên GPU thay vì tải
  toàn bộ các tấm texture lớn cùng một lúc.

### 2. Chất lượng hình ảnh và chuyển đổi LOD

Sự thay đổi đột ngột giữa các cấp độ chi tiết (LOD), hay còn gọi là hiện tượng
"popping", có thể làm giảm trải nghiệm người dùng khi di chuyển camera.

- **`TilesFadePlugin`:** Thực hiện hiệu ứng chuyển cảnh mờ dần (dithered/cross-fade)
  giữa các cấp độ LOD. Điều này giúp các quá trình chuyển đổi trở nên mượt mà và
  tự nhiên hơn thay vì nhảy đột ngột.
- **Thời gian chuyển cảnh (Fade Duration):** Chúng tôi khuyến nghị đặt
  `fadeDuration` từ 300ms đến 500ms để cân bằng giữa độ mượt hình ảnh và hiệu năng.

### 3. Hiệu năng duyệt dữ liệu (Traversal)

Trong môi trường bản đồ hybrid, camera thường xuyên được cập nhật. Việc tính toán
lại các ô 3D hiển thị ở mỗi khung hình sẽ gây tốn kém tài nguyên CPU.

- **`UpdateOnChangePlugin`:** Plugin này đảm bảo rằng việc duyệt tileset và tính
  toán LOD chỉ xảy ra khi camera hoặc tileset thực sự thay đổi.
- **Ngưỡng di chuyển nhỏ (Micro-movement Thresholds):** Vì camera của MapLibre
  có thể có những rung động cực nhỏ, hãy cấu hình các ngưỡng để bỏ qua các di
  chuyển không đáng kể mà không ảnh hưởng đến LOD hiển thị.

## Tích hợp kiến trúc với R3F

Thư viện `3d-tiles-renderer` hiện đại sử dụng kiến trúc plugin, phù hợp hoàn hảo
với vòng đời (lifecycle) của React.

### Khai báo Plugin

Các plugin nên được khai báo là thành phần con của component `TilesRenderer` để
tận dụng khả năng quản lý khai báo (declarative management).

```tsx
<TilesRenderer url={tilesetUrl}>
  <TilesPlugin plugin={TilesCompressionPlugin} />
  <TilesPlugin plugin={TilesFadePlugin} fadeDuration={500} />
  {/* Thêm các plugin khác tại đây */}
</TilesRenderer>
```

### Metadata và Tương tác (Picking)

Với hỗ trợ 3D Tiles 1.1, metadata của các tính năng được lưu trữ trực tiếp trong
`mesh.userData`.

- **Raycasting:** Sử dụng standard Three.js raycasting để tương tác với các ô 3D.
- **Async Readback:** Đối với các tileset nặng về metadata, sử dụng cơ chế GPU
  readback bất đồng bộ để lấy ID tính năng mà không chặn luồng chính (main thread).

## So sánh với đồng bộ hóa bản đồ Hybrid

| Tối ưu hóa         | MapLibre Hybrid                 | Native Three.js    |
| :----------------- | :------------------------------ | :----------------- |
| **Depth Buffer**   | Yêu cầu chia sẻ context         | Mặc định           |
| **Đồng bộ Camera** | Sao chép ma trận mỗi khung hình | Tự động            |
| **Tỷ lệ LOD**      | Phụ thuộc vào zoom MapLibre     | Dựa trên phối cảnh |

> **Ghi chú:** Các mô hình này đang được tích hợp vào component `Tiles3DLayer.tsx`
> để giải quyết các nút thắt cổ chai về hiệu năng được xác định trong quá trình
> kiểm thử tự động.

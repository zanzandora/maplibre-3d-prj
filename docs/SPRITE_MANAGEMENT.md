# Sprite Asset Management & Integration

Tài liệu này giải thích cách hệ thống quản lý các tài nguyên đồ họa (Icons/Symbols) thông qua Sprite trong dự án MapLibre 3D.

## 1. Khái niệm về Sprite trong MapLibre
Trong MapLibre/MapBox, một **Sprite** là một tập hợp các hình ảnh nhỏ (icons) được ghép lại thành một file hình ảnh duy nhất kèm theo một file JSON định vị. Điều này giúp giảm số lượng request HTTP và tối ưu hiệu suất render các Layer `symbol`.

## 2. Cấu trúc cấu hình (`siteList.ts`)
Dữ liệu Sprite được định nghĩa linh hoạt theo từng Site (dự án) trong file `src/utils/siteList.ts`:

```typescript
export const SITES_LIST = [
  {
    site_id: 10,
    name: 'IVORY VILLAS & RESORT',
    // ...
    sprite: 'https://maps.vgm.ai/sprites/anlac_resort/sprite?v=${Date.now()}`',
    // ...
  },
];
```
- **Cache Busting**: Sử dụng `?v=${Date.now()}` để đảm bảo trình duyệt luôn tải bản mới nhất khi có thay đổi trên server, tránh việc hiển thị icon cũ do cache.

## 3. Cơ chế tích hợp trong `MapView.tsx`

Chúng ta sử dụng hai phương pháp đồng thời để đảm bảo tính linh hoạt:

### A. Override Sprite chính trong Map Style (Khuyên dùng)
Đây là cách chính thống để định nghĩa bộ icons mặc định cho bản đồ:

```typescript
const mapStyle = useMemo(() => {
  return {
    version: 8,
    style: maptilersdk.MapStyle.HYBRID_V4.DEFAULT,
    sprite: SITES_LIST[0].sprite || 'https://maps.vgm.ai/sprites/allsprite/sprite'
  };
}, []);
```
- **Lợi ích**: Các layer trong file style hoặc các layer thêm vào sau này có thể sử dụng trực tiếp `icon-image` bằng tên mà không cần tiền tố.

### B. Thêm Sprite phụ thông qua `map.addSprite`
Trong hàm `onMapLoad`, chúng ta đăng ký thêm một bộ sprite với tên định danh riêng:

```typescript
const ivorySite = SITES_LIST.find((s) => s.site_id === 10);
if (ivorySite && ivorySite.sprite) {
  const spriteUrl = ivorySite.sprite.split('?')[0]; // Loại bỏ query param để maplibre nhận diện đúng đường dẫn base
  map.addSprite('ivory-sprite', spriteUrl);
}
```
- **Lợi ích**: Cho phép sử dụng nhiều bộ icons từ các nguồn khác nhau trong cùng một bản đồ.

## 4. Sử dụng trong Layers (`IvoryLayers.tsx`)
Khi khai báo layer, chúng ta chỉ cần gọi tên icon đã được định nghĩa trong file JSON của Sprite:

```typescript
const cayXanh: SymbolLayerSpecification = {
  id: 'cayxanh-symbol',
  layout: {
    'icon-image': '0_Tree_4', // Tên icon trong sprite của Ivory
    'icon-size': [...],
    'icon-anchor': 'bottom',
  },
};
```

## 5. Lưu ý cho Developer
1. **Đường dẫn**: MapLibre sẽ tự động thêm đuôi `.json` và `.png` vào URL sprite. Do đó, URL cung cấp trong `SITES_LIST` không nên chứa phần mở rộng file.
2. **Hiển thị lỗi**: Nếu icon hiển thị là một hình vuông màu ghi/trắng, có nghĩa là tên `icon-image` không tồn tại trong file JSON của Sprite hoặc URL Sprite bị lỗi 404.
3. **Thứ tự tải**: Sprite cần được load trước khi các layer symbol sử dụng chúng được render. Việc đưa vào `mapStyle` giúp đảm bảo điều này.

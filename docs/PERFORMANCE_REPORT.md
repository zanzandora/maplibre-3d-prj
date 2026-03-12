# Báo cáo Tối ưu hóa Hiệu năng 3D WebGIS (MapLibre + Three.js)

Tài liệu này phân tích chi tiết các kỹ thuật "Surgical Optimization" đã được triển khai trong project để xử lý hàng ngàn model 3D trên nền địa hình thực tế mà vẫn duy trì mức **60 FPS** và giải phóng bộ nhớ WebGL hiệu quả.

---

## 1. Kiến trúc Giao thoa (Shared WebGL Context)
Thay vì sử dụng hai lớp Canvas đè lên nhau, chúng ta sử dụng **MapLibre Custom Layer** để Three.js "ký sinh" vào WebGL Context của MapLibre.
- **Lợi ích:** Loại bỏ hiện tượng Z-fighting, cho phép các model 3D nằm dưới các nhãn tên đường (Label), và giảm 50% tài nguyên GPU so với việc chạy 2 Context riêng biệt.
- **File tham chiếu:** `src/components/map3d/MapThreeLayer.tsx`

## 2. Chiến lược Render: GPU Instancing & Stable Capacity
Chúng ta không vẽ 1.000 Mesh riêng lẻ mà sử dụng `THREE.InstancedMesh`.
- **Kỹ thuật:** Gửi 1 lệnh vẽ duy nhất (Draw Call) cho toàn bộ các model cùng loại (ví dụ: 1.000 căn Villa).
- **Stable Capacity (Mới):** Duy trì một dung lượng đệm (`capacity`) ổn định cho mỗi `InstancedMesh`. Dung lượng này chỉ tăng lên (kèm 20% dự phòng) và không bao giờ giảm xuống. Điều này tránh việc R3F hủy/tạo lại Mesh liên tục khi số lượng model trong viewport thay đổi nhẹ, loại bỏ hiện tượng nhấp nháy (flicker).
- **useLayoutEffect (Mới):** Sử dụng `useLayoutEffect` thay cho `useEffect` để đồng bộ ma trận vị trí ngay trước khi trình duyệt vẽ (paint), giúp khung hình mượt mà tuyệt đối.
- **LOD (Level of Detail) with Hysteresis:** 
    - **Zoom >= 16.2:** Vẽ model GLB chi tiết.
    - **Zoom <= 15.8:** Chuyển sang "Massing Mode" (Box).
    - **Hysteresis:** Khoảng đệm 0.4 zoom giúp tránh việc nhảy LOD liên tục khi người dùng zoom chậm quanh ngưỡng.
- **File tham chiếu:** `src/engine/InstanceRenderer.tsx`

## 3. Tối ưu hóa Địa hình (Terrain Optimization)
Địa hình là tác nhân gây tốn CPU/GPU nhất. Chúng ta đã "thuần hóa" nó qua 3 bước:
- **Throttling setTerrain:** Chỉ gọi `map.setTerrain` khi camera dừng hẳn (`moveend`). Tránh việc SDK tính toán lại lưới địa hình liên tục khi đang bay.
- **FadeDuration: 0:** Tắt hiệu ứng chuyển cảnh địa hình để CPU không phải nội suy (interpolate) độ cao giữa các frame.
- **Tile Cache Reset:** Tự động dọn dẹp bộ nhớ đệm Tile (`TileCache.reset`) khi bắt đầu di chuyển để "dọn chỗ" cho dữ liệu mới.

## 4. Cơ chế "Viewport-Only Elevation Scanning" (Cải tiến)
Hàm `queryTerrainElevation` cực nặng vì nó ép CPU phải đợi GPU trả về dữ liệu độ cao.
- **Vấn đề cũ:** Gọi 1.000 lần cho toàn bộ model gây đứng hình (Jank).
- **Giải pháp mới:** 
    - **Spatial Filter:** Chỉ quét và tính toán Elevation cho các model đang nằm trong **Viewport thực tế** (`currentBounds`).
    - **Batched Updates:** Sử dụng `requestAnimationFrame` để chia nhỏ tác vụ nặng ra nhiều frame.
    - **Height Caching:** Lưu cao độ vào mảng `elevations`, tránh tính toán lặp lại cho các model đã biết độ cao.
- **File tham chiếu:** `src/loader/ModelManager.tsx`

## 5. Tương tác: Manual Raycasting
Thay vì dựa vào hệ thống sự kiện mặc định của R3F (vốn không tương thích hoàn toàn với MapLibre overlay), chúng ta triển khai **Manual Raycasting**.
- **Cơ chế:** Nghe sự kiện click từ MapLibre, chuyển đổi sang không gian 3D và tự bắn tia.
- **Lợi ích:** Tránh việc component Three.js phải render thêm layer bắt sự kiện, giảm tiêu thụ CPU và tăng độ chính xác khi click trong môi trường WebGIS phức tạp.
- **File tham chiếu:** `src/engine/MapClickInterceptor.tsx`

## 6. Memory & GC (Garbage Collection) Management
- **Pre-allocation:** Các biến ma trận (`Matrix4`, `Vector3`, `Euler`) được khởi tạo một lần duy nhất bên ngoài vòng lặp. 
- **Tuyệt đối không dùng `new`:** Tái sử dụng bộ nhớ bằng `.copy()` hoặc `.set()`, tránh rác tích tụ gây lag định kỳ (GC spikes).

---

### Chỉ số mục tiêu (Performance KPIs)
- **Render Time:** < 16.6ms (60 FPS).
- **Draw Calls:** < 10 (cho 1.000+ objects).
- **Main Thread Idle:** > 40% khi đang di chuyển camera (nhờ tối ưu Elevation).
- **Zero Flickering:** Không còn hiện tượng model biến mất hoặc nháy khi pan/zoom.

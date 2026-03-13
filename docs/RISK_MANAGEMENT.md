# Quản lý Rủi ro và Phân tích Thất bại (Failure Analysis)

Tài liệu này phân tích các kịch bản "thất bại thảm hại" của hệ thống Map 3D (sập trình duyệt, giật lag < 5 FPS, treo máy) và các nguyên nhân kỹ thuật cốt lõi.

---

## 1. Rủi ro về Hiệu năng Render (GPU Bottleneck)

### Hiện tượng:

Trình duyệt bị treo, FPS tụt xuống cực thấp (1-2 FPS), hoặc hiển thị thông báo "WebGL Context Lost".

### Nguyên nhân:

- **Quá tải Draw Calls:** Dù đã dùng Instancing, nhưng nếu số lượng **loại model độc nhất** quá lớn (ví dụ: 500 loại nhà khác nhau), số lượng Draw Calls sẽ vẫn vượt ngưỡng chịu tải của GPU tầm trung.
- **Tổng số Polygon quá lớn:** Nếu không có hệ thống LOD, việc hiển thị 10,000 căn villa High-poly cùng lúc sẽ khiến VRAM bị tràn.
- **Shader Complexity:** Sử dụng các hiệu ứng ánh sáng, đổ bóng (shadows) hoặc vật liệu phản chiếu (reflections) quá phức tạp trên hàng ngàn instance.

---

## 2. Rủi ro về Bộ nhớ (Memory Leaks & VRAM)

### Hiện tượng:

Trang web càng dùng càng chậm, sau một lúc thì trình duyệt tự đóng hoặc reload (Out of Memory).

### Nguyên nhân:

- **Không giải phóng tài nguyên (Disposal):** Khi người dùng di chuyển sang khu vực khác, các model cũ không được xóa khỏi bộ nhớ Three.js (`geometry.dispose()`, `material.dispose()`).
- **Texture quá lớn:** Tải quá nhiều hình ảnh 4K làm map cho model 3D khiến bộ nhớ đồ họa (VRAM) bị cạn kiệt.
- **Cache lồng nhau:** Sử dụng `useGLTF` mà không quản lý việc xóa cache khi số lượng model vượt quá giới hạn.

---

## 3. Rủi ro về Logic & CPU (Main Thread Blocking)

### Hiện tượng:

Bản đồ vẫn mượt nhưng UI bị "đơ" (freeze), không thể click, không thể tương tác với Sidebar.

### Nguyên nhân:

- **Elevation Scanning quá tải:** Hàm `queryTerrainElevation` chạy cho 10,000 đối tượng trên mỗi frame mà không có giới hạn `MAX_SCAN_PER_FRAME`.
- **Re-render Loop trong React:** Một thay đổi nhỏ ở tọa độ trung tâm gây ra việc tính toán lại toàn bộ 10,000 ma trận vị trí trong React `useMemo` hoặc `useEffect`.
- **Heavy Data Processing:** Xử lý file JSON dữ liệu nặng (vài chục MB) ngay trên Main Thread thay vì dùng Web Worker.

---

## 4. Rủi ro về Mạng & Tài nguyên (Network Failure)

### Hiện tượng:

Bản đồ trống rỗng, model mãi không hiện ra, hoặc hiện ra một nửa rồi dừng.

### Nguyên nhân:

- **Asset Size:** File GLB không được nén (nên dùng Draco compression hoặc Meshopt). Một file 10MB nhân với 20 loại model sẽ tạo ra gánh nặng tải 200MB lần đầu.
- **Sequential Loading:** Tải tài nguyên tuần tự (file này xong mới đến file kia) khiến thời gian chờ đợi lên đến > 30 giây.
- **Lỗi đồng bộ địa hình:** Dữ liệu Terrain từ MapLibre tải quá chậm hoặc lỗi, khiến model bị treo ở cao độ 0 (chìm dưới đất hoặc bay lơ lửng).

---

## 5. Rủi ro về Thiết bị & Tương thích

### Hiện tượng:

Chạy tốt trên máy Dev (RTX 3060) nhưng sập ngay lập tức trên Mobile hoặc Laptop văn phòng (Intel HD Graphics).

### Nguyên nhân:

- **Giới hạn WebGL của thiết bị:** Một số thiết bị cũ giới hạn số lượng instance tối đa hoặc kích thước texture.
- **Thiếu fallback:** Không có cơ chế tự động hạ thấp chất lượng đồ họa (ví dụ: ép buộc dùng LOD thấp nhất) trên thiết bị yếu.

---

## 6. Chiến lược giảm thiểu rủi ro (Mitigation Strategies)

1.  **Chặn đứng sự cố (Safe Guards):**
    - Thiết lập giới hạn cứng cho số lượng đối tượng tối đa được render.
    - Sử dụng `try-catch` và bắt sự kiện `webglcontextlost` để reload layer một cách êm ái.
2.  **Tối ưu hóa tài nguyên:**
    - Luôn nén model bằng **Draco**.
    - Sử dụng **LOD** (Bounding Box cho tầm nhìn xa).
3.  **Quản lý luồng dữ liệu:**
    - Chia nhỏ file JSON tòa nhà thành các ô lưới (Tiles).
    - Giới hạn số lượng quét địa hình mỗi frame (đã triển khai 200 model/frame).
4.  **Kiểm tra định kỳ (Monitoring):**
    - Sử dụng `stats.js` để theo dõi Draw Calls và Memory sử dụng.
    - Test trên thiết bị cấu hình thấp thường xuyên.

---

_Tài liệu này là kim chỉ nam để đảm bảo hệ thống duy trì sự ổn định ngay cả khi dữ liệu phình to._

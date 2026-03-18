# Tối ưu hóa Hiệu năng Tương tác (Interaction Optimization) (MapTiler SDK)

Tài liệu này giải thích các kỹ thuật tối ưu hóa để xử lý vấn đề nghẽn luồng chính (Main Thread) khi người dùng tương tác với hàng ngàn model 3D trên bản đồ.

## 1. Vấn đề: Cảnh báo `'mouseover' handler took 247ms`

### Nguyên nhân

Mặc định, React Three Fiber (R3F) sẽ thực hiện kiểm tra va chạm chuột (**Raycasting**) trên mọi vật thể 3D tại mỗi frame khi chuột di chuyển. Khi số lượng instance lớn (hàng ngàn căn nhà) và mỗi căn nhà có hàng triệu polygon, việc duyệt qua toàn bộ cấu trúc dữ liệu hình học này gây quá tải cho Main Thread, dẫn đến hiện tượng lag giật.

## 2. Giải pháp: Tối ưu hóa Raycaster

Chúng ta thực hiện tối ưu hóa tại `src/components/map3d/MapThreeLayer.tsx` để giảm tải hệ thống sự kiện:

### A. Cấu hình Raycaster Params

- Đặt `threshold` cho Mesh là `0.05`. Việc tăng ngưỡng này giúp giảm độ chính xác cực nhỏ không cần thiết nhưng tăng tốc độ tính toán va chạm đáng kể cho `InstancedMesh`.

### B. Chặn Pointer Events ở mức DOM

- Sử dụng `style={{ pointerEvents: 'none' }}` trên Canvas của R3F.
- **Mục tiêu:** Đảm bảo trình duyệt không gửi các sự kiện di chuyển chuột liên tục (`mousemove`, `mouseover`) vào không gian 3D của Three.js khi người dùng đang thao tác trên bản đồ nền. Điều này giúp MapTiler SDK xử lý các tác vụ như `queryRenderedFeatures` mượt mà hơn.

### C. Cơ chế On-Demand Interaction

- Hệ thống được thiết kế để ưu tiên các sự kiện click (`pointerdown`) thay vì theo dõi liên tục vị trí chuột.
- Điều này loại bỏ hoàn toàn việc tính toán Raycasting vô ích khi người dùng chỉ lướt chuột qua các khu vực có mật độ model dày đặc.

## 3. Lưu ý cho Developer khi mở rộng

1. **Khi cần bắt sự kiện hover:** Nếu thực sự cần hiệu ứng hover (đổi màu model khi di chuyển chuột qua), hãy cân nhắc tạo một **Picking Proxy** (một Mesh đơn giản như Box hoặc Plane bao quanh model) thay vì tính toán trực tiếp trên Mesh chi tiết của model.
2. **Raycasting Hierarchy:** Luôn đặt `frustumCulled={false}` trên `InstancedMesh` để giảm thiểu số lượng Draw Calls và tăng hiệu suất tính toán va chạm.
3. **Thứ tự sự kiện:** MapTiler SDK luôn được ưu tiên xử lý sự kiện trước. Nếu bạn muốn bắt sự kiện trong Three.js, hãy đảm bảo MapTiler SDK không bị chặn bởi Canvas overlay.

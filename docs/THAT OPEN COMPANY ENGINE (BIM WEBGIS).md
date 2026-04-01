# 📘 KỶ YẾU KIẾN TRÚC: THAT OPEN COMPANY ENGINE (BIM WEBGIS)

**Định nghĩa:** Tài liệu này là kim chỉ nam dành cho AI Agent khi phát triển các ứng dụng BIM/WebGIS sử dụng hệ sinh thái That Open Company (phiên bản Engine mới nhất). 

**Nguyên tắc Cốt lõi (Truth First):**
1. Tuyệt đối không nhầm lẫn giữa `components` (chạy được trên Node.js/Worker) và `components-front` (chỉ chạy trên Browser).
2. Xử lý hình học và data parsing luôn nằm ở Core. Xử lý UI/UX, Shader, DOM luôn nằm ở Front.
3. Không bao giờ khởi tạo đối tượng mà không gọi `.dispose()` khi component unmount.

---

## PHẦN 1: `@thatopen/components` (Core Functionality)



Đây là trái tim của Engine. Nó chứa các thuật toán toán học, quản lý Scene Graph của Three.js, phân tích dữ liệu IFC và quản lý Fragments. Chạy hoàn toàn độc lập với DOM, cho phép deploy trên Node.js backend để làm ETL Pipeline (chuyển đổi IFC -> Fragments).

### 1.1. Hệ thống Quản lý cốt lõi (Core Managers)
* **`Components` (`src/core/Components`)**: Biến Global quản lý toàn bộ vòng đời của ứng dụng. Là Dependency Injection container để lấy các module khác qua hàm `.get()`.
* **`Worlds` (`src/core/Worlds`)**: Thay thế kiến trúc single-scene cũ. Quản lý đồng thời nhiều Scene, Camera, và Renderer. Phù hợp để làm Mini-map, đa góc nhìn (Split views).
* **`OrthoPerspectiveCamera`**: Camera lai, chuyển đổi mượt mà giữa hình chiếu phối cảnh (Perspective) và hình chiếu trục đo (Orthographic).

### 1.2. Trái tim Hình học (Fragments & Loaders)
* **`FragmentsManager` (`src/fragments/FragmentsManager`)**: Quản lý bộ nhớ đệm (buffer) của các file `.frag`. Nó sử dụng kiến trúc Web Worker (`fragments.core`) để đẩy việc tính toán InstancedMesh ra khỏi luồng chính (Main Thread).
* **`IfcLoader` (`src/fragments/IfcLoader`)**: Parse file `.ifc` bằng WebAssembly (WASM) và chuyển đổi on-the-fly sang dạng Fragments.

### 1.3. Quản lý Dữ liệu BIM (OpenBIM & Classifier)
* **`Classifier` (`src/fragments/Classifier`)**: Công cụ phân loại cấu kiện. Cho phép nhóm các đối tượng theo tầng (Storey), loại cấu kiện (IFC Class - vd: IfcWall, IfcSlab), hoặc hệ thống (System).
* **`ItemsFinder` (`src/fragments/ItemsFinder`)**: Query engine để tìm kiếm các ID của cấu kiện dựa trên các điều kiện (BIM Queries) cực nhanh.
* **`BCFTopics` & `IDSSpecifications` (`src/openbim/`)**: Xử lý tiêu chuẩn OpenBIM. BCF (BIM Collaboration Format) dùng để giao tiếp lỗi/comment. IDS (Information Delivery Specification) dùng để kiểm tra tính hợp lệ của model.

### 1.4. Phân tích Kỹ thuật (Kinh nghiệm thực chiến)
* **Event-driven Pattern:** Mọi thao tác đều thông qua Events (`onItemSet`, `onEvent`). Core không ép Model vào Scene ngay lập tức, mà bắn sự kiện để `Worlds` hoặc user lắng nghe và quyết định.
* **Z-Fighting Fix:** Tích hợp logic xử lý Polygon Offset trực tiếp trong materials list của `FragmentsManager` để chống chớp nháy bề mặt.

---

## PHẦN 2: `@thatopen/components-front` (Browser Features)



Gói này **chỉ hoạt động trên Browser**. Nó chứa các tính năng tương tác với DOM (HTML elements), thao tác chuột/cảm ứng, và các hiệu ứng đồ họa nâng cao (Post-processing) của WebGL.

### 2.1. Đồ họa nâng cao (Postproduction)
* **`PostproductionRenderer` (`src/core/PostproductionRenderer`)**: Ghi đè lên `SimpleRenderer` mặc định. Nó cung cấp kiến trúc Multi-pass:
    * **Ambient Occlusion (AO):** Đổ bóng góc kẹt, giúp mô hình trông sâu và thật hơn.
    * **Outline/Edge Detection:** Vẽ nét viền (như bản vẽ kỹ thuật) cho các khối 3D.
    * **Gloss/Custom Passes:** Các hiệu ứng vật liệu nâng cao.

### 2.2. Tương tác Người dùng (Interactions)
* **`Highlighter` (`src/fragments/Highlighter`)**: Logic chọn cấu kiện (Selection). Khi click chuột vào một tường, nó lấy ID của fragment và đổi màu (Material override) mượt mà.
* **`Hoverer` (`src/fragments/Hoverer`)**: Tương tự Highlighter nhưng tối ưu cho sự kiện `mousemove`.
* **`Outliner` (`src/fragments/Outliner`)**: Bôi viền (glowing edge) cấu kiện được chọn, thay vì đổi màu toàn bộ.
* **`Marker` (`src/core/Marker`)**: Sử dụng `CSS2DRenderer` để gắn các thẻ HTML (Label, Tag) bám theo tọa độ 3D.

### 2.3. Công cụ Đo lường (Measurements)
* Nằm tại `src/measurement/`: Chứa `LengthMeasurement`, `AreaMeasurement`, `AngleMeasurement`, `VolumeMeasurement`.
* **Bản chất:** Là sự kết hợp giữa thuật toán Raycasting (từ Core), tạo hình học đường/mặt phẳng (Three.js Line/Mesh), và tạo text hiển thị bằng DOM HTML (`Marker`).

### 2.4. Hạ tầng & Giao thông (Civil)
* **`CivilNavigators` (`src/civil/CivilNavigators`)**: Cung cấp đồ thị (graphs) và mặt cắt ngang (cross-sections) dọc theo tuyến đường (Alignment). Hỗ trợ mạnh mẽ cho định dạng IFC4x3 (Cầu, Đường, Hầm).

---

## PHẦN 3: BOILERPLATE CHUẨN KẾT HỢP CORE & FRONT

Khi AI Agent được yêu cầu tạo một Viewer tiêu chuẩn, hãy tuân thủ cấu trúc sau:

```typescript
import * as THREE from 'three';
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front"; // Chú ý alias quy chuẩn

export function setupBIMViewer(container: HTMLDivElement) {
  // 1. KHỞI TẠO CORE (Bộ não)
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBCF.PostproductionRenderer // DÙNG RENDERER CỦA FRONT TẠI ĐÂY
  >();

  world.scene = new OBC.SimpleScene(components);
  world.camera = new OBC.OrthoPerspectiveCamera(components);
  
  // 2. KHỞI TẠO FRONT RENDERER (Giao diện)
  world.renderer = new OBCF.PostproductionRenderer(components, container);
  
  components.init();
  world.scene.setup();
  
  // 3. KÍCH HOẠT HIỆU ỨNG (Post-production)
  const postproduction = world.renderer.postproduction;
  postproduction.enabled = true;
  postproduction.customEffects.outlineEnabled = true;

  // 4. KÍCH HOẠT TƯƠNG TÁC CHUỘT (Front)
  const highlighter = components.get(OBCF.Highlighter);
  highlighter.setup({ world });
  highlighter.zoomToSelection = true;

  // 5. NẠP DỮ LIỆU (Core Worker)
  const fragments = components.get(OBC.FragmentsManager);
  
  // Hàm tải mô hình
  const loadModel = async (url: string) => {
    const file = await fetch(url);
    const data = await file.arrayBuffer();
    const buffer = new Uint8Array(data);
    const model = fragments.load(buffer);
    world.scene.three.add(model);
    
    // Cập nhật post-production để nhận diện mô hình mới
    postproduction.update();
  };

  // 6. QUY TẮC CLEANUP (Bắt buộc)
  return () => {
  components.dispose(); // Sẽ dọn dẹp cả Core và Front
  };
  }

  ---

  ## PHẦN 4: KINH NGHIỆM THỰC CHIẾN & BÀI HỌC (LESSONS LEARNED)

  ### 4.1. Cơ chế Picking & Raycasting (Trái tim tương tác)
  - **Vấn đề:** Các công cụ như `Highlighter`, `Measurement`, `Clipper` sẽ không thể tìm thấy bất kỳ điểm nào (raycast hit) nếu các lưới (meshes) không được đăng ký vào `world.meshes`.
  - **Giải pháp:** Sau khi nạp model qua `fragments.core.load`, bắt buộc phải lặp qua các con (children) của model và thêm các `FragmentMesh` vào `world.meshes`.
  ```typescript
  for (const mesh of model.children) {
  if (mesh instanceof THREE.Mesh) world.meshes.add(mesh);
  }
  ```
  - **Lưu ý:** Không nên tạo lưới giả (fake mesh) từ geometry thô để làm picking, vì các công cụ nâng cao như `VolumeMeasurement` yêu cầu metadata (modelId, expressID) và cấu trúc vertex map phức tạp chỉ có trên `FragmentMesh` gốc.

  ### 4.2. Quản lý Vòng đời (Lifecycle) và Renderer Error
  - **Lỗi:** "A renderer is needed for the raycaster to work!" xảy ra khi component chứa Viewer bị unmount (ví dụ khi user Log Out).
  - **Nguyên nhân:** `Raycasters` cố gắng cập nhật trong khi renderer đã bị hủy.
  - **Quy tắc Cleanup:** Phải dispose `Raycasters` một cách tường minh trước khi gọi `components.dispose()`.
  ```typescript
  try {
  const raycasters = components.get(OBC.Raycasters);
  raycasters.enabled = false;
  raycasters.dispose();
  } catch (e) {}
  components.dispose();
  ```

  ### 4.3. Đồng bộ hóa Đơn vị đo lường (Unit Strategy)
  - Khi ứng dụng có nhiều công cụ đo (Dài, Diện tích, Thể tích), không nên lưu trữ đơn vị dưới dạng string đơn lẻ (vd: 'm').
  - **Chiến lược:** Sử dụng một **Base Unit Index** (vd: 0 cho mm, 1 cho cm, 2 cho m). Khi chuyển đổi công cụ, chỉ cần dùng index này để tra cứu trong bảng map `UNIT_OPTIONS` tương ứng (vd: Index 2 sẽ map thành 'm' ở Length nhưng là 'm2' ở Area). Điều này giúp UI luôn đồng bộ và logic không bị sai lệch.

  ### 4.4. Tối ưu hóa UI React với Engine
  - Để tránh việc Engine bị khởi tạo lại (re-init) quá nhiều lần gây giật lag:
  - Sử dụng `useRef` cho `components`, `world`, `fragments`.
  - Sử dụng `useEffect` với dependency array cực kỳ chặt chẽ (vd: chỉ dùng `activeTool` thay vì toàn bộ `activeSubTools` object).
  - Tách biệt logic Engine (setup/cleanup) ra khỏi logic render UI.
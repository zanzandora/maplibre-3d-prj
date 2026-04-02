import { Viewer } from '@photo-sphere-viewer/core';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import type { PSVNode } from '../hooks/ui/useStreetViewData';
import { useEffect, useRef } from 'react';

interface StreetViewComponentProps {
  nodes: PSVNode[];
  startNodeId: string;
  onNodeChange: (nodeId: string, gps: [number, number]) => void;
  onClose: () => void;
}

export default function StreetViewComponent({
  nodes,
  startNodeId,
  onNodeChange,
  onClose,
}: StreetViewComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  // Dùng ref để bọc hàm callback, tránh việc useEffect bị trigger
  // mỗi khi reference của onNodeChange bị thay đổi từ component cha
  const onNodeChangeRef = useRef(onNodeChange);
  useEffect(() => {
    onNodeChangeRef.current = onNodeChange;
  }, [onNodeChange]);

  // LUỒNG 1: KHỞI TẠO VIEWER CHỈ 1 LẦN DUY NHẤT
  useEffect(() => {
    if (!containerRef.current || !nodes.length || !startNodeId) return;
    if (viewerRef.current) return; // Nếu đã có instance, tuyệt đối không tạo lại

    let isUnmounted = false;
    let viewer: Viewer | null = null;

    // Dùng setTimeout (50ms) để bypass qua cái "bẫy" double-mount của React 18 StrictMode
    const initTimer = setTimeout(() => {
      if (isUnmounted) return;

      viewer = new Viewer({
        container: containerRef.current!,
        defaultYaw: '0deg',
        defaultPitch: '0deg',
        navbar: ['zoom', 'fullscreen'],
        plugins: [
          [
            VirtualTourPlugin,
            {
              positionMode: 'gps',
              renderMode: '3d',
              nodes: nodes,
              startNodeId: startNodeId,
            },
          ],
        ],
      });

      viewerRef.current = viewer;
      const plugin = viewer.getPlugin(VirtualTourPlugin);

      const handleNodeChange = ({ node }: { node: PSVNode }) => {
        if (node && node.gps) {
          onNodeChangeRef.current(node.id, node.gps as [number, number]);
        }
      };

      if (plugin) {
        plugin.addEventListener('node-changed', handleNodeChange);
        // Gắn lén hàm cleanup vào viewer để dễ gọi lúc unmount
      }
    }, 50);

    return () => {
      isUnmounted = true;
      clearTimeout(initTimer);
      if (viewer) {
        viewer.destroy();
        viewerRef.current = null;
      }
    };
    // Chúng ta lừa React một chút: Chỉ trigger dependency dựa trên logic boolean.
    // Khi nodes từ mảng rỗng [] sang mảng có data, nó nhảy từ true -> false (chạy 1 lần).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length === 0]);

  // LUỒNG 2: CẬP NHẬT DỮ LIỆU KHÔNG GÂY RÒ RỈ BỘ NHỚ
  // Khi mảng nodes thay đổi, dùng API setNodes để update im lặng
  useEffect(() => {
    if (viewerRef.current && nodes.length > 0) {
      const plugin = viewerRef.current.getPlugin(VirtualTourPlugin) as any;
      if (plugin) {
        // PSV Plugin sẽ tự xử lý so sánh node mới/cũ mà không làm crash app
        plugin.setNodes(nodes);
      }
    }
  }, [nodes]);

  // LUỒNG 3: CHUYỂN CẢNH
  // Khi user click điểm khác trên bản đồ 2D (startNodeId thay đổi)
  useEffect(() => {
    if (viewerRef.current && startNodeId) {
      const plugin = viewerRef.current.getPlugin(VirtualTourPlugin) as any;
      if (plugin) {
        const currentNode = plugin.getCurrentNode();
        if (!currentNode || currentNode.id !== startNodeId) {
          plugin.setCurrentNode(startNodeId);
        }
      }
    }
  }, [startNodeId]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '10px 20px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: '1px solid white',
          borderRadius: 4,
          cursor: 'pointer',
          zIndex: 1001,
          fontSize: '16px',
        }}
      >
        Close Street View
      </button>
    </div>
  );
}

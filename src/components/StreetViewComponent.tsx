import { Viewer } from '@photo-sphere-viewer/core';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import type { PSVNode } from '../hooks/ui/useStreetViewData';
import { useEffect, useRef, useState, useMemo } from 'react';
import StreetViewMiniMap from './StreetViewMiniMap/index';

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
  const [viewerReady, setViewerReady] = useState(false);

  // Tính toán tọa độ hiện tại dựa trên startNodeId
  const currentLngLat = useMemo<[number, number]>(() => {
    const node = nodes.find((n) => n.id === startNodeId);
    if (node && node.gps) {
      return [node.gps[0], node.gps[1]];
    }
    return [0, 0];
  }, [nodes, startNodeId]);

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
      setViewerReady(true);

      const plugin = viewer.getPlugin(VirtualTourPlugin);

      const handleNodeChange = ({ node }: { node: PSVNode }) => {
        if (node && node.gps) {
          onNodeChangeRef.current(node.id, node.gps as [number, number]);
        }
      };

      if (plugin) {
        plugin.addEventListener('node-changed', handleNodeChange);
      }
    }, 50);

    return () => {
      isUnmounted = true;
      clearTimeout(initTimer);
      if (viewer) {
        viewer.destroy();
        viewerRef.current = null;
        setViewerReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length === 0]);

  // LUỒNG 2: CẬP NHẬT DỮ LIỆU KHÔNG GÂY RÒ RỈ BỘ NHỚ
  useEffect(() => {
    if (viewerRef.current && nodes.length > 0) {
      const plugin = viewerRef.current.getPlugin(
        VirtualTourPlugin
      ) as VirtualTourPlugin;
      if (plugin) {
        plugin.setNodes(nodes);
      }
    }
  }, [nodes]);

  // LUỒNG 3: CHUYỂN CẢNH
  useEffect(() => {
    if (viewerRef.current && startNodeId) {
      const plugin = viewerRef.current.getPlugin(
        VirtualTourPlugin
      ) as VirtualTourPlugin;
      if (plugin) {
        const currentNode = plugin.getCurrentNode();
        if (!currentNode || currentNode.id !== startNodeId) {
          plugin.setCurrentNode(startNodeId);
        }
      }
    }
  }, [startNodeId]);

  const handleHotspotClick = (nodeId: string) => {
    if (viewerRef.current) {
      const plugin = viewerRef.current.getPlugin(
        VirtualTourPlugin
      ) as VirtualTourPlugin;
      if (plugin) {
        plugin.setCurrentNode(nodeId);
      }
    }
  };

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

      {viewerReady && viewerRef.current && (
        <StreetViewMiniMap
          viewer={viewerRef.current}
          currentLngLat={currentLngLat}
          nodes={nodes}
          onHotspotClick={handleHotspotClick}
        />
      )}

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

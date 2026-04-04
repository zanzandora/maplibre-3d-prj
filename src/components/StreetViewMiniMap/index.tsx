import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StreetViewMiniMapProps } from './types';
import { MapControls } from './MapControls';
import ConeMarker from './ConeMarker';
import HotspotMarkers from './HotspotMarkers';

const StreetViewMiniMap = ({
  viewer,
  currentLngLat,
  nodes,
  onHotspotClick,
  zoom = 18,
  mapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  coneColor = 'rgba(30, 120, 230, 0.4)',
}: StreetViewMiniMapProps) => {
  const mapRef = useRef<MapRef>(null);
  const isUserInteractingRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ViewState khởi tạo
  const [viewState, setViewState] = useState({
    longitude: currentLngLat[0],
    latitude: currentLngLat[1],
    zoom: zoom,
  });

  // 1. Khi nhấn nút Expand/Collapse
  const toggleExpand = () => {
    setIsTransitioning(true); // Hiện lớp phủ trắng ngay lập tức
    setIsExpanded(!isExpanded);
  };

  // 2. Xử lý khi kết thúc Animation Transition của CSS
  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Chỉ bắt sự kiện transition của chính container (width/height)
    if (e.propertyName === 'width' || e.propertyName === 'height') {
      if (mapRef.current) {
        // Resize để map nhận kích thước container mới
        mapRef.current.resize();

        // Căn giữa map vào currentLngLat ngay lập tức
        mapRef.current.jumpTo({
          center: currentLngLat,
          zoom: zoom,
        });
      }

      // Tắt lớp phủ trắng sau khi map đã sẵn sàng
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }
  };

  // 3. Auto-centering khi chuyển node (chỉ chạy khi user KHÔNG tương tác và KHÔNG trong lúc transition)
  useEffect(() => {
    if (!isUserInteractingRef.current && !isTransitioning && mapRef.current) {
      mapRef.current.easeTo({
        center: currentLngLat,
        duration: 800,
        essential: true,
      });
    }
  }, [currentLngLat, isTransitioning]);

  const handleReset = useCallback(() => {
    mapRef.current?.flyTo({
      center: currentLngLat,
      zoom: zoom,
      speed: 1.2,
    });
  }, [currentLngLat, zoom]);

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '20px',
        width: isExpanded ? '80vw' : '200px',
        height: isExpanded ? '80vh' : '200px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '2px solid rgba(255,255,255,0.8)',
        transition:
          'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 2000,
        backgroundColor: 'white',
      }}
    >
      {/* Lớp phủ trắng (Overlay) khi đang phóng to/thu nhỏ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          zIndex: 10,
          opacity: isTransitioning ? 1 : 0,
          pointerEvents: isTransitioning ? 'all' : 'none',
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Có thể thêm logo hoặc spinner ở đây nếu muốn */}
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveStart={() => (isUserInteractingRef.current = true)}
        onMoveEnd={() => {
          setTimeout(() => {
            isUserInteractingRef.current = false;
          }, 200);
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyleUrl}
        attributionControl={false}
      >
        {/* Nón thị giác (Radar) */}
        <ConeMarker
          viewer={viewer}
          currentLngLat={currentLngLat}
          coneColor={coneColor}
        />

        {/* Các điểm hotspots */}
        <HotspotMarkers
          nodes={nodes}
          currentLngLat={currentLngLat}
          onHotspotClick={(id) => {
            onHotspotClick(id);
            if (isExpanded) {
              setIsTransitioning(true);
              setIsExpanded(false);
            }
          }}
        />
      </Map>

      {/* Actions Map */}
      <MapControls
        isExpanded={isExpanded}
        onToggleExpand={toggleExpand}
        onReset={handleReset}
      />
    </div>
  );
};

export default StreetViewMiniMap;

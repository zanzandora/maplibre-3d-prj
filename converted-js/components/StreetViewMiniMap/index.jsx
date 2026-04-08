import { useEffect, useRef, useState, useCallback } from "react";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapControls } from "./MapControls";
import ConeMarker from "./ConeMarker";
import HotspotMarkers from "./HotspotMarkers";

/*
  A radar-style overlay map that tracks the panorama's position and orientation.
  Supports expansion for a more interactive view.
*/
const StreetViewMiniMap = ({
  viewer,
  currentLngLat,
  nodes,
  onHotspotClick,
  zoom = 18,
  mapStyleUrl = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  coneColor = "rgba(30, 120, 230, 0.4)",
}) => {
  const mapRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initial map state
  const [viewState, setViewState] = useState({
    longitude: currentLngLat[0],
    latitude: currentLngLat[1],
    zoom: zoom,
  });

  /*
    Trigger an overlay when expanding/collapsing to hide visual artifacts 
    caused by the map not resizing instantly during CSS transitions.
  */
  const toggleExpand = () => {
    setIsTransitioning(true);
    setIsExpanded(!isExpanded);
  };

  /*
    Resizes the WebGL context and snaps to the active node once 
    the container's CSS transition completes.
  */
  const handleTransitionEnd = (e) => {
    if (e.propertyName === "width" || e.propertyName === "height") {
      if (mapRef.current) {
        mapRef.current.resize();
        mapRef.current.jumpTo({
          center: currentLngLat,
          zoom: zoom,
        });
      }

      // Briefly delay hiding the overlay to ensure the map has fully rendered.
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }
  };

  /*
    Automatically pans the map to follow the current panorama node,
    unless the user is actively interacting (panning/zooming) with the map.
  */
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
        position: "absolute",
        bottom: "60px",
        left: "20px",
        width: isExpanded ? "80vw" : "200px",
        height: isExpanded ? "80vh" : "200px",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        border: "2px solid rgba(255,255,255,0.8)",
        transition:
          "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 2000,
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "white",
          zIndex: 10,
          opacity: isTransitioning ? 1 : 0,
          pointerEvents: isTransitioning ? "all" : "none",
          transition: "opacity 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

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
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyleUrl}
        attributionControl={false}
      >
        <ConeMarker
          viewer={viewer}
          currentLngLat={currentLngLat}
          coneColor={coneColor}
        />

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

      <MapControls
        isExpanded={isExpanded}
        onToggleExpand={toggleExpand}
        onReset={handleReset}
      />
    </div>
  );
};

export default StreetViewMiniMap;

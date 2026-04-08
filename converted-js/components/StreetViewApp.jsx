import { useState } from "react";
import MapComponent from "./MapComponent";
import StreetViewComponent from "./StreetViewComponent";
import { useStreetViewData } from "../hooks/ui/useStreetViewData";

export default function StreetViewApp() {
  const { spots, psvNodes, loading, error } = useStreetViewData();
  const [activeSpotId, setActiveSpotId] = useState(null);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([105.809737, 21.021254]);

  if (loading)
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        Loading Street View Data...
      </div>
    );
  if (error)
    return (
      <div style={{ padding: 20, color: "red", fontFamily: "sans-serif" }}>
        Error loading data: {error.message}
      </div>
    );

  const handleMarkerClick = (spot) => {
    setActiveSpotId(spot.id);
    setMapCenter([spot.lon, spot.lat]);
    setIsStreetViewOpen(true);
  };

  const handleNodeChange = (nodeId, gps) => {
    setActiveSpotId(nodeId);
    setMapCenter([gps[0], gps[1]]);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MapComponent
        spots={spots}
        activeSpotId={activeSpotId}
        onMarkerClick={handleMarkerClick}
        center={mapCenter}
      />

      {isStreetViewOpen && activeSpotId && psvNodes.length > 0 && (
        <StreetViewComponent
          nodes={psvNodes}
          startNodeId={activeSpotId}
          onNodeChange={handleNodeChange}
          onClose={() => setIsStreetViewOpen(false)}
        />
      )}
    </div>
  );
}

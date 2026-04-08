import { useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl/maplibre";

/*
  Represents the viewer's field-of-view (FOV) on the map.
  Synchronizes rotation with the 360 viewer's yaw.
*/
const ConeMarker = ({ viewer, currentLngLat, coneColor }) => {
  const [rotation, setRotation] = useState(0);
  const prevYawRef = useRef(0);
  const cumulativeYawRef = useRef(0);

  /*
    Logic to calculate the shortest rotation path. 
    Prevents the marker from spinning 350+ degrees when passing 
    the 0/360 boundary (North).
  */
  useEffect(() => {
    if (!viewer) return;

    const handlePositionUpdated = (e) => {
      const newYawDeg = (e.position.yaw * 180) / Math.PI;

      let delta = newYawDeg - prevYawRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      cumulativeYawRef.current += delta;
      prevYawRef.current = newYawDeg;

      setRotation(cumulativeYawRef.current);
    };

    viewer.addEventListener("position-updated", handlePositionUpdated);
    return () =>
      viewer.removeEventListener("position-updated", handlePositionUpdated);
  }, [viewer]);

  return (
    <Marker
      longitude={currentLngLat[0]}
      latitude={currentLngLat[1]}
      rotation={rotation}
      rotationAlignment="map"
      anchor="center"
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: `conic-gradient(from 315deg, ${coneColor} 0deg, ${coneColor} 90deg, transparent 90deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            backgroundColor: "#1E78E6",
            border: "2px solid white",
            borderRadius: "50%",
          }}
        />
      </div>
    </Marker>
  );
};

export default ConeMarker;

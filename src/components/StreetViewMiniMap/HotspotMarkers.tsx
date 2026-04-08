import { Marker } from 'react-map-gl/maplibre';
import type { PSVNode } from '../../hooks/ui/useStreetViewData';

interface HotspotMarkersProps {
  nodes: PSVNode[];
  currentLngLat: [number, number];
  onHotspotClick: (nodeId: string) => void;
}

/*
  Renders all available panorama points (hotspots) as interactive markers on the map.
  Excludes the active node to avoid overlapping with the FOV radar.
*/
const HotspotMarkers = ({
  nodes,
  currentLngLat,
  onHotspotClick,
}: HotspotMarkersProps) => {
  return (
    <>
      {nodes.map((node) => {
        const nodeGps = node.gps;
        if (!nodeGps) return null;

        if (
          nodeGps[0] === currentLngLat[0] &&
          nodeGps[1] === currentLngLat[1]
        ) {
          return null;
        }

        return (
          <Marker
            key={node.id}
            longitude={nodeGps[0]}
            latitude={nodeGps[1]}
            anchor='center'
          >
            <div
              className='minimap-hotspot'
              onClick={(e) => {
                e.stopPropagation();
                onHotspotClick(node.id);
              }}
              title={node.name}
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: 'white',
                border: '2px solid #1E78E6',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.2)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            />
          </Marker>
        );
      })}
    </>
  );
};

export default HotspotMarkers;

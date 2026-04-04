import * as React from 'react';
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Spot } from '../hooks/ui/useStreetViewData';

interface MapComponentProps {
  spots: Spot[];
  activeSpotId: string | null;
  onMarkerClick: (spot: Spot) => void;
  center: [number, number];
}

export default function MapComponent({
  spots,
  activeSpotId,
  onMarkerClick,
  center,
}: MapComponentProps) {
  const mapRef = React.useRef<MapRef>(null);

  React.useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: center, zoom: 18, duration: 1000 });
    }
  }, [center]);

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl as never}
      initialViewState={{
        longitude: 105.809737,
        latitude: 21.021254,
        zoom: 18,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
    >
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          longitude={spot.lon}
          latitude={spot.lat}
          anchor='center'
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            onMarkerClick(spot);
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: activeSpotId === spot.id ? '#ff0000' : '#0066ff',
              borderRadius: '50%',
              border: '3px solid white',
              cursor: 'pointer',
              boxShadow: '0 0 5px rgba(0,0,0,0.5)',
              transform: activeSpotId === spot.id ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            title={spot.name}
          />
        </Marker>
      ))}
    </Map>
  );
}

import Map, { Marker, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Spot } from '../hooks/ui/useStreetViewData';
import { useEffect, useRef } from 'react';

interface MapComponentProps {
  spots: Spot[];
  activeSpotId: string | null;
  onMarkerClick: (spot: Spot) => void;
  center: [number, number];
}

/*
  Global 2D Map component used for overall navigation.
  Provides a birds-eye view of all available photography points (spots).
*/
export default function MapComponent({
  spots,
  activeSpotId,
  onMarkerClick,
  center,
}: MapComponentProps) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: center, zoom: 18, duration: 1000 });
    }
  }, [center]);

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl as never}
      initialViewState={{
        longitude: 105.7029751,
        latitude: 20.5795143,
        zoom: 18,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://api.maptiler.com/maps/satellite/style.json?key=qsnCKTeh4edupyr3wmzP'
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
              width: 12,
              height: 12,
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

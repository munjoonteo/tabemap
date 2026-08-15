import { useEffect, useRef } from 'react';
import L from 'leaflet';

const STYLES = [
  {
    id: 'voyager',
    label: 'Carto Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  {
    id: 'positron',
    label: 'Carto Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  {
    id: 'dark',
    label: 'Carto Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  {
    id: 'stadia',
    label: 'Stadia Alidade Smooth',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '© Stadia Maps',
  },
];

// Tokyo Shinjuku area as preview center
const CENTER: [number, number] = [35.6897, 139.7006];
const ZOOM = 13;

function MiniMap({ label, url, attribution }: (typeof STYLES)[0]) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, {
      center: CENTER,
      zoom: ZOOM,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(url, { attribution }).addTo(map);
    // add pins after tiles load so the map has painted and has a real size
    map.whenReady(() => {
      L.circleMarker(CENTER, {
        radius: 8,
        color: 'white',
        fillColor: '#e74c3c',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      L.circleMarker([35.6862, 139.7053], {
        radius: 8,
        color: 'white',
        fillColor: '#3498db',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      L.circleMarker([35.6938, 139.7034], {
        radius: 8,
        color: 'white',
        fillColor: '#2ecc71',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      map.invalidateSize();
    });
    return () => {
      map.remove();
    };
  }, [url, attribution]);

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={ref} style={{ height: 200 }} />
      <div className="px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700">
        {label}
      </div>
    </div>
  );
}

interface Props {
  onPick: (styleId: string) => void;
  onClose: () => void;
}

export function MapStylePicker({ onPick, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col gap-4 p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Choose map style</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onPick(s.id);
                onClose();
              }}
              className="flex flex-col rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors focus:outline-none focus:border-blue-500"
            >
              <MiniMap {...s} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

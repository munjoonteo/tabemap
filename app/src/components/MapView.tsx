import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useAppContext } from '../contexts/AppContext';
import { tCuisine } from '../lib/translations';
import { PRICE_TIER_LABELS } from '../types/restaurant';
import type { Restaurant } from '../types/restaurant';
import { groupAwards } from './AwardBadge';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';

function makeIcon(color: string, size: number, visited = false): L.DivIcon {
  const check = visited
    ? `<span style="
        position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
        color:white;font-size:${Math.round(size * 0.55)}px;line-height:1;font-weight:700;
        text-shadow:0 1px 2px rgba(0,0,0,0.3);
      ">✓</span>`
    : '';
  return L.divIcon({
    className: '',
    html: `<div style="
      position:relative;
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    ">${check}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const TILE_URLS: Record<string, { url: string; attribution: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  stadia: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '© Stadia Maps',
  },
};

interface Props {
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  colors: Record<string, string>;
  tileStyle?: string;
  fitToBounds?: number;
  disablePopups?: boolean;
}

export function MapView({
  restaurants,
  selectedId,
  onSelect,
  colors,
  tileStyle = 'osm',
  fitToBounds = 0,
  disablePopups = false,
}: Props) {
  const { isEnglish } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const layerGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [35.6762, 139.6503],
      zoom: 12,
      zoomControl: true,
    });
    const tile = TILE_URLS[tileStyle] ?? TILE_URLS.osm;
    tileLayerRef.current = L.tileLayer(tile.url, { attribution: tile.attribution }).addTo(map);
    layerGroupRef.current = L.markerClusterGroup({
      maxClusterRadius: 3,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // swap tile layer when style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const tile = TILE_URLS[tileStyle] ?? TILE_URLS.osm;
    if (tileLayerRef.current) tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(tile.url, { attribution: tile.attribution }).addTo(map);
    tileLayerRef.current.bringToBack();
  }, [tileStyle]);

  const prevSelectedId = useRef<string | null>(null);

  // rebuild all markers when the restaurant list or colors change
  useEffect(() => {
    const layer = layerGroupRef.current;
    if (!layer) return;

    layer.clearLayers();
    markersRef.current.clear();

    restaurants.forEach((r) => {
      if (!r.lat || !r.lng) return;
      const color = colors[r.cuisine] ?? '#999999';
      const marker = L.marker([r.lat, r.lng], { icon: makeIcon(color, 18, r.visited) });
      if (!disablePopups) {
        marker.bindPopup(
          `
          <div style="min-width:160px">
            <a href="${r.tabelog_url}" target="_blank" rel="noreferrer"
               class="popup-name"
               style="font-size:14px;font-weight:600;text-decoration:none"
               onmouseover="this.style.textDecoration='underline'"
               onmouseout="this.style.textDecoration='none'"
            >${r.name}</a>${r.visited ? ' <span class="popup-visited" style="font-size:12px">✓</span>' : ''}<br/>
            <span class="popup-sub" style="font-size:12px">${tCuisine(r.cuisine, isEnglish)} · ${PRICE_TIER_LABELS[r.price_tier]}</span><br/>
            <span style="font-size:12px">★ ${r.tabelog_rating.toFixed(2)}</span>
            ${(r.awards?.length ?? 0) > 0 || r.tags.length > 0 ? `<div class="popup-sub" style="margin-top:4px;font-size:11px">${[...(r.awards ? groupAwards(r.awards).map((g) => g.label) : []), ...r.tags].join(', ')}</div>` : ''}
          </div>
        `,
          { maxWidth: 240 },
        );
      }
      marker.on('click', () => onSelect(r.id));
      marker.addTo(layer);
      markersRef.current.set(r.id, marker);
    });

    if (prevSelectedId.current) {
      const sel = restaurants.find((r) => r.id === prevSelectedId.current);
      if (sel)
        markersRef.current
          .get(prevSelectedId.current)
          ?.setIcon(makeIcon(colors[sel.cuisine] ?? '#999999', 26, sel.visited));
    }
  }, [restaurants, onSelect, colors, disablePopups, isEnglish]);

  // update only the affected pins when selection changes
  useEffect(() => {
    const prev = prevSelectedId.current;
    if (prev && prev !== selectedId) {
      const r = restaurants.find((r) => r.id === prev);
      if (r)
        markersRef.current
          .get(prev)
          ?.setIcon(makeIcon(colors[r.cuisine] ?? '#999999', 18, r.visited));
    }
    if (selectedId) {
      const r = restaurants.find((r) => r.id === selectedId);
      if (r)
        markersRef.current
          .get(selectedId)
          ?.setIcon(makeIcon(colors[r.cuisine] ?? '#999999', 26, r.visited));
    }
    prevSelectedId.current = selectedId;
  }, [selectedId, restaurants, colors]);

  // fit map to current filtered restaurants
  useEffect(() => {
    if (!mapRef.current || fitToBounds === 0) return;
    const points = restaurants
      .filter((r) => r.lat && r.lng)
      .map((r) => [r.lat, r.lng] as [number, number]);
    if (points.length === 0) return;
    mapRef.current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
  }, [fitToBounds]);

  // fly to selected — only break out of cluster if the marker is actually hidden inside one
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    const cluster = layerGroupRef.current;
    const visibleParent = cluster?.getVisibleParent(marker);
    if (visibleParent && visibleParent !== marker) {
      // marker is inside a cluster — zoom to reveal it first
      cluster!.zoomToShowLayer(marker, () => {
        mapRef.current?.flyTo(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 15), {
          duration: 0.5,
        });
        if (!disablePopups) marker.openPopup();
      });
    } else {
      // marker is already visible — only fly if it's outside the current viewport
      const latlng = marker.getLatLng();
      const inView = mapRef.current.getBounds().contains(latlng);
      if (!inView) {
        mapRef.current.flyTo(latlng, Math.max(mapRef.current.getZoom(), 15), { duration: 0.5 });
        if (!disablePopups) setTimeout(() => marker.openPopup(), 600);
      } else {
        if (!disablePopups) marker.openPopup();
      }
    }
  }, [selectedId, disablePopups]);

  return <div ref={containerRef} className="w-full h-full" style={{ isolation: 'isolate' }} />;
}

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Destination, Hotel } from '../types/travelmate';
import { formatPkr } from '../lib/formatters';

interface PakistanMapProps {
  destinations: Destination[];
  hotels?: Hotel[];
  selectedDestination?: Destination | null;
  userCoords?: { lat: number; lng: number } | null;
  showRouteFromIslamabad?: boolean;
  heightClass?: string;
  onSelectDestination?: (dest: Destination) => void;
}

const ISLAMABAD_COORDS: [number, number] = [33.6844, 73.0479];

export function PakistanMap({
  destinations,
  hotels = [],
  selectedDestination,
  userCoords,
  showRouteFromIslamabad = false,
  heightClass = 'h-[420px]',
  onSelectDestination,
}: PakistanMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center: [number, number] = selectedDestination
      ? [selectedDestination.lat, selectedDestination.lng]
      : [35.4, 74.3];
    const zoom = selectedDestination ? 9 : 6;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Destination circle markers (no broken external marker PNG icon issues)
    destinations.forEach((dest) => {
      const isSelected = selectedDestination?.id === dest.id;
      const marker = L.circleMarker([dest.lat, dest.lng], {
        radius: isSelected ? 10 : 7,
        color: '#0A2351',
        weight: isSelected ? 3 : 2,
        fillColor: isSelected ? '#0D5EFF' : '#EEF4FF',
        fillOpacity: 0.95,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family: 'DM Sans', sans-serif; min-width: 170px;">
          <div style="font-weight: 700; color: #0A2351; font-size: 14px;">${dest.name}</div>
          <div style="color: #475569; font-size: 12px; margin: 2px 0;">${dest.region} · ${dest.elevationMeters || 2200}m</div>
          <div style="color: #0D5EFF; font-weight: 600; font-size: 12px;">Est. ${formatPkr(dest.estimatedBudgetPkr)}</div>
        </div>`
      );

      marker.on('click', () => {
        if (onSelectDestination) onSelectDestination(dest);
      });
    });

    // Public hotel markers
    hotels.forEach((hotel) => {
      if (typeof hotel.lat === 'number' && typeof hotel.lng === 'number') {
        L.circleMarker([hotel.lat, hotel.lng], {
          radius: 6,
          color: '#0F172A',
          weight: 2,
          fillColor: '#FF6B2C',
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindPopup(
            `<div style="font-family: 'DM Sans', sans-serif;">
              <div style="font-weight: 700; font-size: 13px;">${hotel.name}</div>
              <div style="font-size: 12px; color: #475569;">Stay in ${hotel.destinationName}</div>
            </div>`
          );
      }
    });

    // Route polyline from Islamabad if a destination is selected
    if (showRouteFromIslamabad && selectedDestination) {
      L.circleMarker(ISLAMABAD_COORDS, {
        radius: 6,
        color: '#0A2351',
        weight: 2,
        fillColor: '#0D5EFF',
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup('Islamabad Starting Hub');

      L.polyline([ISLAMABAD_COORDS, [selectedDestination.lat, selectedDestination.lng]], {
        color: '#0D5EFF',
        weight: 3,
        dashArray: '6 6',
      }).addTo(map);
    }

    // Private user location marker (only rendered locally when user grants permission)
    if (userCoords) {
      L.circleMarker([userCoords.lat, userCoords.lng], {
        radius: 8,
        color: '#DC2626',
        weight: 2,
        fillColor: '#EF4444',
        fillOpacity: 0.85,
      })
        .addTo(map)
        .bindPopup('Your detected GPS location (private to your session)');
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [destinations, hotels, selectedDestination, userCoords, showRouteFromIslamabad, onSelectDestination]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-[#EEF4FF]/40">
      <div ref={containerRef} className={`w-full ${heightClass} z-0`} />
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>OpenStreetMap · Interactive Northern Pakistan Corridor</span>
        <span>Blue pins: Destinations · Orange pins: Hotels</span>
      </div>
    </div>
  );
}

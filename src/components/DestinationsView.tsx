import React, { useEffect, useMemo, useState } from 'react';
import {
  CloudSun,
  Compass,
  Droplets,
  Heart,
  MapPin,
  Mountain,
  Navigation,
  Search,
  Wind,
} from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import { formatPkr } from '../lib/formatters';
import { HERO_IMAGE } from '../data/seedData';
import { PakistanMap } from './PakistanMap';
import type { Destination, DestinationCategory, WeatherData } from '../types/travelmate';

interface DestinationsViewProps {
  initialSelectedId?: string | null;
  onPlanTripForDestination: (destName: string) => void;
  onBookService: () => void;
}

const CATEGORIES: Array<'All' | DestinationCategory> = [
  'All',
  'Mountains',
  'Valleys',
  'Lakes',
  'Historical',
  'Adventure',
  'Cultural',
  'Family',
];

export function DestinationsView({
  initialSelectedId,
  onPlanTripForDestination,
  onBookService,
}: DestinationsViewProps) {
  const {
    destinations,
    hotels,
    tourPackages,
    favorites,
    firebaseUser,
    toggleFavorite,
  } = useTravelMate();

  const [queryText, setQueryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DestinationCategory>('All');
  const [sortBy, setSortBy] = useState<'default' | 'budget-asc' | 'elevation-desc'>('default');
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (initialSelectedId) {
      const found = destinations.find((d) => d.id === initialSelectedId);
      if (found) setSelectedDest(found);
    } else if (!selectedDest && destinations.length > 0) {
      setSelectedDest(destinations[0]);
    }
  }, [initialSelectedId, destinations, selectedDest]);

  useEffect(() => {
    if (!selectedDest) return;
    let active = true;
    setWeatherLoading(true);
    fetch(`/api/weather?lat=${selectedDest.lat}&lng=${selectedDest.lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data && data.current) setWeather(data);
      })
      .catch(() => {
        if (active) setWeather(null);
      })
      .finally(() => {
        if (active) setWeatherLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDest]);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const list = destinations.filter((d) => {
      const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
      const matchesQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
    if (sortBy === 'budget-asc') {
      return [...list].sort((a, b) => a.estimatedBudgetPkr - b.estimatedBudgetPkr);
    }
    if (sortBy === 'elevation-desc') {
      return [...list].sort((a, b) => (b.elevationMeters || 0) - (a.elevationMeters || 0));
    }
    return list;
  }, [destinations, queryText, selectedCategory, sortBy]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const isFavorited = (destId: string) =>
    favorites.some((f) => f.itemType === 'destination' && f.itemId === destId);

  const nearbyHotels = selectedDest
    ? hotels.filter((h) => h.destinationName.toLowerCase() === selectedDest.name.toLowerCase())
    : [];
  const nearbyPackages = selectedDest
    ? tourPackages.filter((p) => p.destinationName.toLowerCase() === selectedDest.name.toLowerCase())
    : [];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-10">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0F172A]">
            Destination Discovery &amp; Interactive Map
          </h1>
          <p className="text-sm text-[#0F172A]/70 mt-1.5 max-w-2xl">
            Explore all 14 flagship Pakistan destinations with OpenStreetMap coordinates, live
            Open-Meteo weather forecasts, nearby stays, and estimated PKR budgets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#0F172A]/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Filter destinations..."
              className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
          >
            <option value="default">Sort: Curated Order</option>
            <option value="budget-asc">Budget: Lowest PKR First</option>
            <option value="elevation-desc">Elevation: Highest First</option>
          </select>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#0D5EFF] text-white'
                : 'bg-white text-[#0F172A]/75 border border-slate-200 hover:bg-[#EEF4FF]/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Map + Selected Destination Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[#0F172A]">
              Northern Corridor &amp; Destination Pins
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRoute((v) => !v)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-[#EEF4FF]/40 cursor-pointer"
              >
                {showRoute ? 'Hide Islamabad Route' : 'Show Route from Islamabad'}
              </button>
              <button
                type="button"
                onClick={handleLocateMe}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-[#EEF4FF]/40 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-[#0B57D0]" />
                <span>My Location</span>
              </button>
            </div>
          </div>

          <PakistanMap
            destinations={filtered}
            hotels={hotels}
            selectedDestination={selectedDest}
            userCoords={userCoords}
            showRouteFromIslamabad={showRoute}
            onSelectDestination={(dest) => setSelectedDest(dest)}
          />
        </div>

        {/* Selected Destination Detail Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {selectedDest ? (
            <div>
              <div className="aspect-[16/9] relative bg-[#EEF4FF]">
                <img
                  src={selectedDest.imageUrl || HERO_IMAGE}
                  alt={selectedDest.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {firebaseUser && (
                  <button
                    type="button"
                    onClick={() =>
                      void toggleFavorite({
                        itemType: 'destination',
                        itemId: selectedDest.id,
                        itemTitle: selectedDest.name,
                        destinationName: selectedDest.name,
                      })
                    }
                    aria-label="Save destination to favorites"
                    className="absolute top-3 right-3 p-2.5 rounded-lg bg-white/90 text-[#0D5EFF] hover:bg-white cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFavorited(selectedDest.id) ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#0F172A]/60 mb-1">
                    <span>{selectedDest.region}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedDest.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {selectedDest.elevationMeters || 2400} m
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#0F172A]">
                    {selectedDest.name}
                  </h2>
                  <p className="text-sm text-[#0F172A]/75 leading-relaxed mt-2">
                    {selectedDest.description}
                  </p>
                </div>

                {/* Live Weather Strip */}
                <div className="bg-[#F4F7FC] border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#0D5EFF] flex items-center gap-1.5">
                      <CloudSun className="w-4 h-4" />
                      Live Open-Meteo Weather
                    </span>
                    <span className="text-xs text-[#0F172A]/55">
                      Best season: {selectedDest.bestSeason}
                    </span>
                  </div>
                  {weatherLoading ? (
                    <div className="text-xs text-[#0F172A]/60">Loading alpine forecast...</div>
                  ) : weather ? (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="font-mono text-lg font-bold text-[#0F172A] tabular-nums">
                          {weather.current.temperatureC}°C
                        </div>
                        <div className="text-[#0F172A]/65">{weather.current.condition}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#0F172A]/75">
                        <Droplets className="w-3.5 h-3.5 text-[#0B57D0]" />
                        <span className="font-mono tabular-nums">{weather.current.humidityPct}%</span>
                        <span>Humidity</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#0F172A]/75">
                        <Wind className="w-3.5 h-3.5 text-[#0B57D0]" />
                        <span className="font-mono tabular-nums">{weather.current.windSpeedKmh}</span>
                        <span>km/h</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[#0F172A]/60">
                      Live weather currently unavailable for coordinates.
                    </div>
                  )}
                </div>

                {/* Highlights & Activities */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-[#0F172A] mb-1.5">Popular Attractions</div>
                    <ul className="space-y-1 text-[#0F172A]/75">
                      {(selectedDest.highlights || []).map((h) => (
                        <li key={h} className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#0B57D0] shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A] mb-1.5">Available Activities</div>
                    <ul className="space-y-1 text-[#0F172A]/75">
                      {(selectedDest.activities || []).map((a) => (
                        <li key={a} className="flex items-center gap-1.5">
                          <Mountain className="w-3 h-3 text-[#0B57D0] shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Linked Services Summary */}
                <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-3">
                  <span className="text-[#0F172A]/70">
                    {nearbyPackages.length} packages · {nearbyHotels.length} nearby hotels
                  </span>
                  <span className="font-mono font-bold text-[#0D5EFF] tabular-nums">
                    Est. {formatPkr(selectedDest.estimatedBudgetPkr)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onPlanTripForDestination(selectedDest.name)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Plan AI Trip Here</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBookService}
                    className="px-4 py-2.5 border border-[#0D5EFF]/20 text-[#0D5EFF] text-sm font-semibold rounded-lg hover:bg-[#EEF4FF]/50 cursor-pointer"
                  >
                    Find Stays &amp; Guides
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Full Grid of Filtered Destinations */}
      <div>
        <div className="text-sm font-semibold text-[#0F172A] mb-4">
          Showing {filtered.length} destinations
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((dest) => {
            const active = selectedDest?.id === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => setSelectedDest(dest)}
                className={`text-left rounded-xl border overflow-hidden transition-colors cursor-pointer bg-white ${
                  active
                    ? 'border-[#0D5EFF] ring-1 ring-[#0D5EFF]'
                    : 'border-slate-200 hover:border-[#0B57D0]/40'
                }`}
              >
                <div className="aspect-[4/3] bg-[#EEF4FF]">
                  <img
                    src={dest.imageUrl || HERO_IMAGE}
                    alt={dest.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-[#0F172A]/60 mb-1">
                    {dest.region} · {dest.category}
                  </div>
                  <div className="font-display font-bold text-[#0F172A] mb-1">{dest.name}</div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="font-mono text-[#0F172A]/65 tabular-nums">
                      {dest.elevationMeters || 2400}m
                    </span>
                    <span className="font-mono font-semibold text-[#0D5EFF] tabular-nums">
                      {formatPkr(dest.estimatedBudgetPkr)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

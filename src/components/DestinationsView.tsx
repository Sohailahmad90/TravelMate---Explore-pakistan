import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Calendar,
  CloudSun,
  Compass,
  Droplets,
  Heart,
  MapPin,
  Mountain,
  Navigation,
  Package,
  Search,
  Sparkles,
  Star,
  UserCheck,
  Wind,
  X,
} from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import { formatPkr } from '../lib/formatters';
import { fetchWeatherForCoords } from '../lib/weather';
import { HERO_IMAGE } from '../data/seedData';
import { PakistanMap } from './PakistanMap';
import type { Destination, DestinationCategory, WeatherData } from '../types/travelmate';
import type { ServiceTab } from './MarketplaceView';

interface DestinationsViewProps {
  initialSelectedId?: string | null;
  onPlanTripForDestination: (destName: string) => void;
  onBookService: (tab?: ServiceTab, destName?: string) => void;
  onRequireSignIn?: () => void;
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
  onRequireSignIn,
}: DestinationsViewProps) {
  const {
    destinations,
    hotels,
    tourPackages,
    publicProfiles,
    favorites,
    firebaseUser,
    toggleFavorite,
  } = useTravelMate();

  const [queryText, setQueryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DestinationCategory>('All');
  const [sortBy, setSortBy] = useState<'default' | 'budget-asc' | 'elevation-desc'>('default');
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const lastAppliedInitialIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!destinations.length) return;
    if (initialSelectedId && initialSelectedId !== lastAppliedInitialIdRef.current) {
      const found = destinations.find((d) => d.id === initialSelectedId);
      if (found) {
        lastAppliedInitialIdRef.current = initialSelectedId;
        setSelectedDest(found);
        setDetailModalOpen(true);
        return;
      }
    }
    setSelectedDest((prev) => prev || destinations[0]);
  }, [initialSelectedId, destinations]);

  useEffect(() => {
    if (!selectedDest) return;
    let active = true;
    setWeatherLoading(true);
    fetchWeatherForCoords(selectedDest.lat, selectedDest.lng)
      .then((data) => {
        if (active) setWeather(data);
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

  const handleToggleFavorite = (dest: Destination) => {
    if (!firebaseUser) {
      if (onRequireSignIn) onRequireSignIn();
      return;
    }
    void toggleFavorite({
      itemType: 'destination',
      itemId: dest.id,
      itemTitle: dest.name,
      destinationName: dest.name,
    });
  };

  const nearbyHotels = selectedDest
    ? hotels.filter(
        (h) =>
          h.destinationName.toLowerCase() === selectedDest.name.toLowerCase() ||
          selectedDest.name.toLowerCase().includes(h.destinationName.toLowerCase())
      )
    : [];

  const nearbyPackages = selectedDest
    ? tourPackages.filter(
        (p) =>
          p.destinationName.toLowerCase() === selectedDest.name.toLowerCase() ||
          selectedDest.name.toLowerCase().includes(p.destinationName.toLowerCase())
      )
    : [];

  const nearbyGuides = selectedDest
    ? publicProfiles.filter(
        (g) =>
          g.role === 'guide' &&
          (g.operatingDestinations || []).some(
            (od) =>
              od.toLowerCase() === selectedDest.name.toLowerCase() ||
              selectedDest.name.toLowerCase().includes(od.toLowerCase()) ||
              selectedDest.region.toLowerCase().includes(od.toLowerCase())
          )
      )
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
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(selectedDest)}
                  aria-label="Save destination to favorites"
                  className="absolute top-3 right-3 p-2.5 rounded-lg bg-white/90 text-[#0D5EFF] hover:bg-white cursor-pointer shadow-xs"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorited(selectedDest.id) ? 'fill-red-500 text-red-500' : ''
                    }`}
                  />
                </button>
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
                    {nearbyPackages.length} packages · {nearbyHotels.length} hotels ·{' '}
                    {nearbyGuides.length} guides
                  </span>
                  <span className="font-mono font-bold text-[#0D5EFF] tabular-nums">
                    Est. {formatPkr(selectedDest.estimatedBudgetPkr)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>View Full Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlanTripForDestination(selectedDest.name)}
                    className="px-4 py-2.5 border border-[#0D5EFF]/25 text-[#0D5EFF] text-sm font-semibold rounded-lg hover:bg-[#EEF4FF]/60 cursor-pointer"
                  >
                    Plan AI Trip
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Full Grid of Filtered Destinations */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="text-sm font-semibold text-[#0F172A]">
            Showing {filtered.length} destinations
          </div>
          <div className="text-xs text-slate-500">
            Click any destination card to open full guide, 5-day weather, packages &amp; hotels
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((dest) => {
            const active = selectedDest?.id === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => {
                  setSelectedDest(dest);
                  setDetailModalOpen(true);
                }}
                className={`text-left rounded-xl border overflow-hidden transition-colors cursor-pointer bg-white flex flex-col justify-between ${
                  active
                    ? 'border-[#0D5EFF] ring-1 ring-[#0D5EFF]'
                    : 'border-slate-200 hover:border-[#0B57D0]/40'
                }`}
              >
                <div>
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
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {dest.description}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-mono text-[#0F172A]/65 tabular-nums">
                    {dest.elevationMeters || 2400}m · {dest.bestSeason}
                  </span>
                  <span className="font-mono font-semibold text-[#0D5EFF] tabular-nums">
                    {formatPkr(dest.estimatedBudgetPkr)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Destination Detail Modal */}
      {detailModalOpen && selectedDest && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner Header */}
            <div className="relative h-56 sm:h-64 bg-[#0A2351]">
              <img
                src={selectedDest.imageUrl || HERO_IMAGE}
                alt={selectedDest.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(selectedDest)}
                  aria-label="Save destination"
                  className="p-2.5 rounded-xl bg-white/95 text-[#0D5EFF] hover:bg-white cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorited(selectedDest.id) ? 'fill-red-500 text-red-500' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  aria-label="Close destination details"
                  className="p-2.5 rounded-xl bg-white/95 text-slate-700 hover:bg-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-blue-200 mb-1">
                    {selectedDest.region} · {selectedDest.category} ·{' '}
                    {selectedDest.elevationMeters || 2400} m elevation
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold">
                    {selectedDest.name}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-blue-100/80">Estimated 4–5 Day Budget</div>
                  <div className="font-mono text-xl font-bold text-white tabular-nums">
                    {formatPkr(selectedDest.estimatedBudgetPkr)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview & Key Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    Destination Overview
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedDest.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-[#F4F7FC] border border-slate-200 rounded-xl p-4">
                      <div className="text-xs font-semibold text-[#0F172A] mb-2">
                        Top Landmarks &amp; Attractions
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {(selectedDest.highlights || []).map((h) => (
                          <li key={h} className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0D5EFF] shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#F4F7FC] border border-slate-200 rounded-xl p-4">
                      <div className="text-xs font-semibold text-[#0F172A] mb-2">
                        Activities &amp; Experiences
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {(selectedDest.activities || []).map((a) => (
                          <li key={a} className="flex items-center gap-1.5">
                            <Mountain className="w-3.5 h-3.5 text-[#0D5EFF] shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Info + Coordinates */}
                <div className="bg-[#EEF4FF]/60 border border-[#0D5EFF]/15 rounded-xl p-4 space-y-3 text-xs">
                  <div className="font-display font-bold text-sm text-[#0A2351]">
                    Travel Snapshot
                  </div>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Best Season</span>
                      <span className="font-semibold text-[#0F172A]">{selectedDest.bestSeason}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Elevation</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {selectedDest.elevationMeters || 2400} m
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">GPS Coordinates</span>
                      <span className="font-mono tabular-nums">
                        {selectedDest.lat.toFixed(2)}, {selectedDest.lng.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Packages Found</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {nearbyPackages.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Partner Stays</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {nearbyHotels.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Weather + 5-Day Forecast */}
              <div className="bg-[#F4F7FC] border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#0D5EFF] flex items-center gap-1.5">
                    <CloudSun className="w-4 h-4" />
                    Live Weather &amp; 5-Day Alpine Forecast
                  </span>
                  <span className="text-xs text-slate-500">Open-Meteo Live Telemetry</span>
                </div>
                {weatherLoading ? (
                  <div className="text-xs text-slate-600">Loading live forecast...</div>
                ) : weather ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                          {weather.current.temperatureC}°C
                        </span>
                        <span className="text-slate-700 font-medium">{weather.current.condition}</span>
                      </div>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Droplets className="w-3.5 h-3.5 text-[#0D5EFF]" />
                        Humidity: {weather.current.humidityPct}%
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Wind className="w-3.5 h-3.5 text-[#0D5EFF]" />
                        Wind: {weather.current.windSpeedKmh} km/h
                      </span>
                    </div>
                    {weather.forecast && weather.forecast.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {weather.forecast.map((day) => (
                          <div
                            key={day.date}
                            className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                          >
                            <div className="font-mono font-semibold text-[#0F172A] tabular-nums">
                              {day.date.slice(5)}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate mt-0.5">
                              {day.condition}
                            </div>
                            <div className="font-mono text-xs font-bold text-[#0D5EFF] mt-1 tabular-nums">
                              {day.tempMinC}° / {day.tempMaxC}°C
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-600">
                    Live weather unavailable right now for these coordinates.
                  </div>
                )}
              </div>

              {/* Matching Services for This Destination */}
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[#0F172A]">
                  Packages, Stays &amp; Local Guides for {selectedDest.name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Packages */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0D5EFF] inline-flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Tour Packages ({nearbyPackages.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailModalOpen(false);
                          onBookService('packages', selectedDest.name);
                        }}
                        className="text-xs font-semibold text-[#0D5EFF] hover:underline cursor-pointer"
                      >
                        Explore
                      </button>
                    </div>
                    {nearbyPackages.length > 0 ? (
                      nearbyPackages.slice(0, 2).map((pkg) => (
                        <div key={pkg.id} className="text-xs bg-[#F4F7FC] p-2.5 rounded-lg">
                          <div className="font-semibold text-[#0F172A]">{pkg.title}</div>
                          <div className="text-slate-600 mt-0.5">
                            {pkg.durationDays} days · {formatPkr(pkg.pricePerPersonPkr)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Explore regional northern packages or request a custom tour guide.
                      </p>
                    )}
                  </div>

                  {/* Hotels */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0D5EFF] inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Hotels &amp; Lodges ({nearbyHotels.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailModalOpen(false);
                          onBookService('hotels', selectedDest.name);
                        }}
                        className="text-xs font-semibold text-[#0D5EFF] hover:underline cursor-pointer"
                      >
                        Browse Stays
                      </button>
                    </div>
                    {nearbyHotels.length > 0 ? (
                      nearbyHotels.slice(0, 2).map((h) => (
                        <div key={h.id} className="text-xs bg-[#F4F7FC] p-2.5 rounded-lg">
                          <div className="font-semibold text-[#0F172A]">{h.name}</div>
                          <div className="text-slate-600 mt-0.5 line-clamp-1">{h.address || h.destinationName}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Browse all verified northern lodges &amp; guesthouses in Marketplace.
                      </p>
                    )}
                  </div>

                  {/* Guides */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0D5EFF] inline-flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        Local Guides ({nearbyGuides.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailModalOpen(false);
                          onBookService('guides', 'All');
                        }}
                        className="text-xs font-semibold text-[#0D5EFF] hover:underline cursor-pointer"
                      >
                        View Guides
                      </button>
                    </div>
                    {nearbyGuides.length > 0 ? (
                      nearbyGuides.slice(0, 2).map((g) => (
                        <div key={g.uid} className="text-xs bg-[#F4F7FC] p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-[#0F172A]">{g.displayName}</div>
                            <div className="text-slate-600">{g.experienceYears || 0} yrs exp</div>
                          </div>
                          <span className="inline-flex items-center gap-0.5 text-amber-500 font-mono font-semibold">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {(g.avgRating || 4.8).toFixed(1)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Connect with verified Pakistan mountain guides in the Guides directory.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    onBookService('packages', selectedDest.name);
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-[#0D5EFF] bg-[#EEF4FF] rounded-xl hover:bg-blue-100 cursor-pointer"
                >
                  Book Packages &amp; Stays
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    onPlanTripForDestination(selectedDest.name);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-xl hover:bg-[#0948CC] cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Plan AI Trip to {selectedDest.name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

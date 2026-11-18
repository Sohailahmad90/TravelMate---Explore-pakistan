import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CloudSun,
  Hospital,
  MapPin,
  PhoneCall,
  ShieldAlert,
  Wind,
} from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import { fetchWeatherForCoords } from '../lib/weather';
import type { TravelAdvisory, WeatherData } from '../types/travelmate';

interface SafetyWeatherViewProps {
  onRequireSignIn: () => void;
}

const EMERGENCY_DIRECTORY = [
  { region: 'Gilgit / Hunza', facility: 'District Headquarters (DHQ) Hospital Gilgit', police: '15 / Hunza Tourist Police 1422', phone: '+92-5811-920253' },
  { region: 'Skardu / Baltistan', facility: 'Combined Military Hospital (CMH) & DHQ Skardu', police: '15 / Skardu Control', phone: '+92-5815-920144' },
  { region: 'Naran / Kaghan', facility: 'THQ Hospital Balakot & Naran Medical Post', police: 'Rescue 1122 / Mansehra 15', phone: '1122' },
  { region: 'Swat / Kalam', facility: 'Saidu Teaching Hospital Mingora & Kalam RHC', police: 'Swat Tourist Police 1422', phone: '+92-946-9240111' },
];

export function SafetyWeatherView({ onRequireSignIn }: SafetyWeatherViewProps) {
  const {
    destinations,
    travelAdvisories,
    emergencyEvents,
    bookings,
    userProfile,
    firebaseUser,
    triggerEmergencySos,
    publishAdvisory,
  } = useTravelMate();

  const [selectedDestId, setSelectedDestId] = useState(destinations[0]?.id || 'hunza-valley');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // SOS state
  const [sosNotes, setSosNotes] = useState('');
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosResult, setSosResult] = useState<string>('');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Community Advisory Report state
  const [advTitle, setAdvTitle] = useState('');
  const [advDest, setAdvDest] = useState('Hunza Valley');
  const [advCategory, setAdvCategory] = useState<TravelAdvisory['category']>('Road closure');
  const [advSeverity, setAdvSeverity] = useState<TravelAdvisory['severity']>('moderate');
  const [advDesc, setAdvDesc] = useState('');
  const [advFeedback, setAdvFeedback] = useState('');

  const selectedDest = destinations.find((d) => d.id === selectedDestId) || destinations[0];

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

  const handleTriggerSos = async () => {
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    setSosSubmitting(true);
    setSosResult('');

    const activeGuideBooking = bookings.find(
      (b) => b.touristId === firebaseUser.uid && ['accepted', 'confirmed'].includes(b.status)
    );

    const submitWithCoords = async (lat?: number, lng?: number) => {
      const label =
        lat && lng
          ? `GPS ${lat.toFixed(4)}, ${lng.toFixed(4)} (near ${selectedDest?.name || 'Northern Pakistan'})`
          : `Manual check-in near ${selectedDest?.name || 'Northern Pakistan'} (GPS permission declined)`;
      await triggerEmergencySos({
        lat,
        lng,
        locationLabel: label,
        notes: sosNotes || 'Tourist requested urgent assistance check-in via TravelMate Safety Center.',
        assignedGuideId: activeGuideBooking?.providerId,
      });
      setSosResult(
        `In-app SOS event recorded at ${new Date().toLocaleTimeString()} (${label}). Note: In-app alerts notify platform coordinators and assigned guide; please dial 1122 or 15 directly for immediate emergency dispatch.`
      );
      setSosNotes('');
      setSosSubmitting(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDetectedCoords(c);
          void submitWithCoords(c.lat, c.lng);
        },
        () => {
          void submitWithCoords(undefined, undefined);
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      await submitWithCoords(undefined, undefined);
    }
  };

  const handleSubmitAdvisoryReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    await publishAdvisory({
      title: advTitle,
      destination: advDest,
      category: advCategory,
      severity: advSeverity,
      description: advDesc,
      sourceType: 'user_report',
      verificationSource: 'Tourist Field Observation (Unverified Community Report)',
      status: 'active',
      expiresAt: '2027-01-31',
    });
    setAdvTitle('');
    setAdvDesc('');
    setAdvFeedback('Community road/weather report submitted and labeled distinctly from official NHA/NDMA bulletins.');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0F172A]">
          Tourist Safety Center, Weather &amp; Travel Advisories
        </h1>
        <p className="text-sm text-[#0F172A]/70 mt-1.5 max-w-2xl">
          Live Open-Meteo mountain forecasts, official NHA/NDMA advisories, emergency SOS event
          logging, and verified regional hospital/police contacts.
        </p>
      </div>

      {/* Top Grid: Emergency SOS + Live Destination Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Emergency SOS Panel */}
        <div className="lg:col-span-5 bg-white border border-red-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-red-700">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="font-display text-xl font-bold">Emergency SOS Check-In</h2>
          </div>
          <p className="text-xs text-[#0F172A]/75 leading-relaxed">
            Activating SOS requests your GPS coordinates with permission, logs an urgent event for
            platform safety coordinators and your assigned tour guide, and records your timestamp.
          </p>

          <textarea
            rows={2}
            value={sosNotes}
            onChange={(e) => setSosNotes(e.target.value)}
            placeholder="Describe your situation (vehicle breakdown, landslide delay, medical aid)..."
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
          />

          <button
            type="button"
            onClick={handleTriggerSos}
            disabled={sosSubmitting}
            className="w-full py-3 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {sosSubmitting ? 'Capturing GPS & Logging Alert...' : 'Send Emergency SOS Alert'}
          </button>

          {detectedCoords && (
            <div className="text-xs font-mono text-[#0D5EFF] bg-[#F4F7FC] p-2.5 rounded-lg">
              Detected GPS: {detectedCoords.lat.toFixed(5)}, {detectedCoords.lng.toFixed(5)}
            </div>
          )}

          {sosResult && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg leading-relaxed">
              {sosResult}
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 text-xs text-[#0F172A]/75 space-y-1">
            <div className="font-semibold text-[#0F172A]">
              Your Trusted Contacts ({userProfile?.emergencyContacts?.length || 0})
            </div>
            {userProfile?.emergencyContacts && userProfile.emergencyContacts.length > 0 ? (
              userProfile.emergencyContacts.map((c, idx) => (
                <div key={idx} className="font-mono tabular-nums">
                  {c.name} ({c.relation}): {c.phone}
                </div>
              ))
            ) : (
              <div>Add trusted emergency contacts in your Dashboard Profile tab.</div>
            )}
          </div>
        </div>

        {/* Live Open-Meteo Weather Intelligence */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-[#0B57D0]" />
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Live Destination Weather Forecast
              </h2>
            </div>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.region})
                </option>
              ))}
            </select>
          </div>

          {weatherLoading ? (
            <div className="py-10 text-center text-sm text-[#0F172A]/60">
              Retrieving real-time telemetry from Open-Meteo...
            </div>
          ) : weather ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F4F7FC] border border-slate-200 rounded-xl p-4">
                <div>
                  <div className="text-xs text-[#0F172A]/60">Temperature</div>
                  <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums">
                    {weather.current.temperatureC}°C
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#0F172A]/60">Condition</div>
                  <div className="text-sm font-semibold text-[#0F172A] mt-1">
                    {weather.current.condition}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#0F172A]/60">Humidity</div>
                  <div className="font-mono text-lg font-bold text-[#0F172A] tabular-nums mt-0.5">
                    {weather.current.humidityPct}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#0F172A]/60">Wind Speed</div>
                  <div className="font-mono text-lg font-bold text-[#0F172A] tabular-nums mt-0.5 flex items-center gap-1">
                    <Wind className="w-4 h-4 text-[#0B57D0]" />
                    <span>{weather.current.windSpeedKmh} km/h</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#0F172A] mb-2">
                  5-Day Outlook · {weather.source}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {weather.forecast.map((day) => (
                    <div
                      key={day.date}
                      className="border border-slate-200 rounded-xl p-3 text-xs space-y-1"
                    >
                      <div className="font-semibold text-[#0D5EFF]">{day.date.slice(5)}</div>
                      <div className="text-[#0F172A]/75 truncate">{day.condition}</div>
                      <div className="font-mono font-bold text-[#0F172A] tabular-nums">
                        {day.tempMaxC}° / {day.tempMinC}°C
                      </div>
                      <div className="font-mono text-[#0B57D0] tabular-nums">
                        Rain: {day.rainProbabilityPct}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#0F172A]/65">Weather service temporarily unavailable.</div>
          )}
        </div>
      </div>

      {/* Advisories Feed + Community Report Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0F172A]">
            Active Travel Advisories
          </h2>
          {travelAdvisories.map((adv) => (
            <div
              key={adv.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#0D5EFF]">
                  {adv.sourceType === 'official' ? 'Official Bulletin' : 'Community User Report'} ·{' '}
                  {adv.category}
                </span>
                <span className="font-mono uppercase text-amber-700 font-semibold">
                  Severity: {adv.severity}
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-[#0F172A]">{adv.title}</h3>
              <p className="text-sm text-[#0F172A]/75">{adv.description}</p>
              <div className="text-xs text-[#0F172A]/60 pt-1 border-t border-slate-200 flex flex-wrap justify-between gap-2">
                <span>Corridor: {adv.destination}</span>
                <span>Source: {adv.verificationSource}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSubmitAdvisoryReport}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
          >
            <div className="flex items-center gap-2 text-[#0D5EFF]">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="font-display font-bold text-base">Submit Road / Weather Report</h3>
            </div>
            <p className="text-xs text-[#0F172A]/65">
              User-submitted observations are clearly labeled separately from official NHA/NDMA advisories.
            </p>
            <input
              type="text"
              required
              value={advTitle}
              onChange={(e) => setAdvTitle(e.target.value)}
              placeholder="Short summary (e.g., Heavy fog near Babusar approach)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={advDest}
                onChange={(e) => setAdvDest(e.target.value)}
                className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={advCategory}
                onChange={(e) => setAdvCategory(e.target.value as TravelAdvisory['category'])}
                className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option>Road closure</option>
                <option>Landslide warning</option>
                <option>Flood alert</option>
                <option>Snowfall warning</option>
                <option>Severe weather</option>
              </select>
              <select
                value={advSeverity}
                onChange={(e) => setAdvSeverity(e.target.value as TravelAdvisory['severity'])}
                className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <textarea
              rows={2}
              required
              value={advDesc}
              onChange={(e) => setAdvDesc(e.target.value)}
              placeholder="Provide location landmark and road condition details..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            {advFeedback && (
              <div className="text-xs text-[#0D5EFF] bg-[#EEF4FF] px-3 py-2 rounded-lg">
                {advFeedback}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
            >
              Submit Field Observation
            </button>
          </form>

          {/* Hospitals & Police Directory */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <h3 className="font-display font-bold text-base text-[#0F172A] flex items-center gap-2">
              <Hospital className="w-4 h-4 text-[#0B57D0]" />
              <span>Regional Hospitals &amp; Police Stations</span>
            </h3>
            <div className="space-y-3">
              {EMERGENCY_DIRECTORY.map((row) => (
                <div key={row.region} className="text-xs border-b border-slate-200 pb-2.5 last:border-0">
                  <div className="font-semibold text-[#0D5EFF] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{row.region}</span>
                  </div>
                  <div className="text-[#0F172A]/80 mt-0.5">{row.facility}</div>
                  <div className="text-[#0F172A]/65 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                    <PhoneCall className="w-3 h-3" />
                    <span>
                      {row.police} · {row.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {emergencyEvents.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold text-[#0F172A]">
                Your Recent SOS Logs ({emergencyEvents.length})
              </div>
              {emergencyEvents.slice(0, 3).map((ev) => (
                <div key={ev.id} className="text-xs text-[#0F172A]/75 border-t border-slate-200 pt-2">
                  <span className="font-semibold uppercase text-red-700">{ev.status}</span> ·{' '}
                  {ev.locationLabel}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

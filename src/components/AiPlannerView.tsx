import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookmarkCheck,
  Calendar,
  CloudRain,
  Compass,
  Printer,
  RefreshCw,
  Send,
  Wallet,
} from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import { formatPkr } from '../lib/formatters';
import type { BudgetBreakdown, Itinerary, ItineraryDay } from '../types/travelmate';

interface AiPlannerViewProps {
  initialDestination?: string;
  onRequireSignIn: () => void;
  onNavigateDashboard: () => void;
}

const INTEREST_CATEGORIES = [
  'Mountain exploration',
  'Lakes and valleys',
  'Adventure tourism',
  'Hiking and trekking',
  'Historical exploration',
  'Cultural experiences',
  'Wildlife',
  'Photography',
  'Local cuisine',
  'Family tourism',
  'Honeymoon travel',
];

interface GeneratedPlanPayload {
  title: string;
  recommendedDurationDays: number;
  destinationSummary: string;
  safetyAndSeasonNote: string;
  budgetBreakdown: BudgetBreakdown;
  days: ItineraryDay[];
  alternativeOptions: Array<{
    label: string;
    estimatedBudgetPkr: number;
    summary: string;
  }>;
  disclaimer?: string;
}

interface ReplanProposal {
  weatherAssessment: string;
  affectedActivities: string[];
  proposedDayPlan: ItineraryDay;
  budgetDeltaPkr: number;
  guideNotificationNote: string;
  weatherContext?: string;
}

export function AiPlannerView({
  initialDestination,
  onRequireSignIn,
  onNavigateDashboard,
}: AiPlannerViewProps) {
  const {
    destinations,
    tourPackages,
    publicProfiles,
    itineraries,
    firebaseUser,
    saveItinerary,
    createBooking,
  } = useTravelMate();

  const [startingLocation, setStartingLocation] = useState('Islamabad');
  const [destination, setDestination] = useState(initialDestination || 'Hunza Valley');
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2026-12-05');
  const [travelers, setTravelers] = useState(2);
  const [budgetPkr, setBudgetPkr] = useState(40000);
  const [interests, setInterests] = useState<string[]>([
    'Mountain exploration',
    'Lakes and valleys',
    'Photography',
  ]);
  const [accommodationPref, setAccommodationPref] = useState('Mid-range mountain lodge');
  const [transportPref, setTransportPref] = useState('Shared coaster / 4x4 Jeep');
  const [specialRequirements, setSpecialRequirements] = useState('');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<GeneratedPlanPayload | null>(null);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Dynamic Re-planning state
  const [replanDay, setReplanDay] = useState(2);
  const [disruptionReason, setDisruptionReason] = useState(
    'Unexpected heavy rain and mountain mist affecting high-altitude excursion'
  );
  const [replanning, setReplanning] = useState(false);
  const [proposal, setProposal] = useState<ReplanProposal | null>(null);
  const [revisions, setRevisions] = useState<Itinerary['revisions']>([]);

  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const buildEditableStaticTemplate = (): GeneratedPlanPayload => {
    const destObj = destinations.find((d) => d.name.toLowerCase() === destination.toLowerCase());
    const startMs = startDate ? new Date(startDate).getTime() : Date.now();
    const endMs = endDate ? new Date(endDate).getTime() : startMs + 4 * 86400000;
    const daysCount = Math.min(10, Math.max(1, Math.round((endMs - startMs) / 86400000) + 1 || 5));
    const perDayBudget = Math.round(budgetPkr / daysCount);
    const highlights = destObj?.highlights || ['Scenic Overlook', 'Local Bazaar', 'Valley Walk'];
    const activities = destObj?.activities || ['Sightseeing', 'Photography', 'Local Cuisine'];

    const days: ItineraryDay[] = Array.from({ length: daysCount }).map((_, idx) => {
      const h1 = highlights[idx % highlights.length];
      const a1 = activities[idx % activities.length];
      return {
        dayNumber: idx + 1,
        title:
          idx === 0
            ? `Departure from ${startingLocation} & Arrival in ${destination}`
            : idx === daysCount - 1
              ? `Morning Local Exploration & Return to ${startingLocation}`
              : `${destination}: ${h1} & ${a1}`,
        morning:
          idx === 0
            ? `Depart ${startingLocation} early morning via ${transportPref} toward ${destination}.`
            : `Breakfast at ${accommodationPref} followed by ${a1.toLowerCase()} around ${h1}.`,
        afternoon:
          idx === daysCount - 1
            ? `Check out, stop for regional handicrafts, and begin return drive to ${startingLocation}.`
            : `Explore ${highlights[(idx + 1) % highlights.length]} with lunch at a local mountain cafe.`,
        evening:
          idx === daysCount - 1
            ? `Arrive back in ${startingLocation} and wrap up trip expenses.`
            : `Sunset views, dinner, and next-day weather briefing in ${destination}.`,
        attractions: [h1, highlights[(idx + 1) % highlights.length]],
        estimatedDayCostPkr: perDayBudget,
      };
    });

    const trans = Math.round(budgetPkr * 0.3);
    const accom = Math.round(budgetPkr * 0.35);
    const food = Math.round(budgetPkr * 0.18);
    const act = Math.round(budgetPkr * 0.1);
    const misc = Math.max(0, budgetPkr - trans - accom - food - act);

    return {
      title: `${daysCount}-Day ${destination} Custom Itinerary`,
      recommendedDurationDays: daysCount,
      destinationSummary:
        destObj?.description ||
        `Editable ${daysCount}-day travel itinerary from ${startingLocation} to ${destination} tailored to your PKR budget.`,
      safetyAndSeasonNote: `Best season: ${destObj?.bestSeason || 'April to October'}. Always check Open-Meteo mountain weather and NHA advisories before mountain travel.`,
      budgetBreakdown: {
        transportationPkr: trans,
        accommodationPkr: accom,
        foodPkr: food,
        activitiesPkr: act,
        miscellaneousPkr: misc,
        totalEstimatedPkr: budgetPkr,
      },
      days,
      alternativeOptions: [
        {
          label: 'Economy Group Plan',
          estimatedBudgetPkr: Math.round(budgetPkr * 0.8),
          summary: 'Shared coaster transport and standard guesthouse stays.',
        },
        {
          label: 'Comfort Private 4x4 Plan',
          estimatedBudgetPkr: Math.round(budgetPkr * 1.25),
          summary: 'Private SUV with dedicated driver and deluxe mountain lodge.',
        },
      ],
      disclaimer:
        'Editable destination template generated locally (static hosting mode — deploy Express backend with GEMINI_API_KEY for live Gemini AI generation).',
    };
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setStatusMessage('');
    setProposal(null);
    setSavedItineraryId(null);
    try {
      const resp = await fetch('/api/ai/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingLocation,
          destination,
          startDate,
          endDate,
          travelers,
          budgetPkr,
          interests,
          accommodationPref,
          transportPref,
          specialRequirements,
        }),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Static hosting (e.g. GitHub Pages) has no Express /api/* backend
        setPlan(buildEditableStaticTemplate());
        setRevisions([]);
        setStatusMessage(
          'Loaded an editable itinerary template (static hosting mode). Customize any day below and save to your account.'
        );
        return;
      }
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to generate AI itinerary.');
      setPlan(data);
      setRevisions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate itinerary.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDayEdit = (dayIndex: number, field: 'title' | 'morning' | 'afternoon' | 'evening', value: string) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d, idx) => (idx === dayIndex ? { ...d, [field]: value } : d));
    setPlan({ ...plan, days: updatedDays });
  };

  const handleSave = async () => {
    if (!plan) return;
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    try {
      const id = await saveItinerary(
        {
          title: plan.title || `${destination} Trip`,
          startingLocation,
          destination,
          startDate,
          endDate,
          travelers,
          budgetPkr,
          interests,
          accommodationPref,
          transportPref,
          days: plan.days,
          budgetBreakdown: plan.budgetBreakdown,
          revisions: revisions || [],
        },
        savedItineraryId || undefined
      );
      setSavedItineraryId(id);
      setStatusMessage('Itinerary saved to your TravelMate dashboard.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save itinerary.');
    }
  };

  const handleLoadSaved = (itin: Itinerary) => {
    setDestination(itin.destination);
    setStartingLocation(itin.startingLocation || 'Islamabad');
    setStartDate(itin.startDate);
    setEndDate(itin.endDate);
    setTravelers(itin.travelers);
    setBudgetPkr(itin.budgetPkr);
    setSavedItineraryId(itin.id);
    setRevisions(itin.revisions || []);
    setPlan({
      title: itin.title,
      recommendedDurationDays: itin.days.length,
      destinationSummary: `Saved itinerary for ${itin.destination} (${itin.travelers} travelers).`,
      safetyAndSeasonNote: 'Review live advisories and weather telemetry before departure.',
      budgetBreakdown: itin.budgetBreakdown || {
        transportationPkr: 0,
        accommodationPkr: 0,
        foodPkr: 0,
        activitiesPkr: 0,
        miscellaneousPkr: 0,
        totalEstimatedPkr: itin.budgetPkr,
      },
      days: itin.days,
      alternativeOptions: [],
    });
    setStatusMessage('Loaded saved itinerary.');
  };

  const handleConvertToTripRequest = async () => {
    if (!plan) return;
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    const matchingGuide =
      publicProfiles.find(
        (p) =>
          p.role === 'guide' &&
          (p.operatingDestinations || []).some((d) =>
            d.toLowerCase().includes(destination.toLowerCase())
          )
      ) || publicProfiles.find((p) => p.role === 'guide');

    if (!matchingGuide) {
      setError('No verified tour guide is currently available for custom requests.');
      return;
    }

    try {
      await createBooking({
        providerId: matchingGuide.uid,
        providerName: matchingGuide.displayName,
        bookingType: 'custom_trip',
        itemId: savedItineraryId || 'custom_ai_plan',
        itemTitle: `Custom Trip: ${plan.title}`,
        destinationName: destination,
        startDate,
        endDate,
        guests: travelers,
        totalPricePkr: plan.budgetBreakdown?.totalEstimatedPkr || budgetPkr,
        paymentMethod: 'cash_on_arrival',
        notes: `AI Trip Request (${plan.days.length} days, interests: ${interests.join(', ')})`,
      });
      setStatusMessage(
        `Custom trip request sent to verified guide ${matchingGuide.displayName}. Track it in your Dashboard.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit custom trip request.');
    }
  };

  const handleProposeReplan = async () => {
    if (!plan) return;
    setReplanning(true);
    setError('');
    setProposal(null);
    const destObj = destinations.find((d) => d.name.toLowerCase() === destination.toLowerCase());
    try {
      const resp = await fetch('/api/ai/replan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary: { title: plan.title, destination, days: plan.days },
          affectedDayNumber: replanDay,
          disruptionReason,
          lat: destObj?.lat,
          lng: destObj?.lng,
        }),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const currentDay =
          plan.days.find((d) => d.dayNumber === replanDay) || plan.days[0];
        setProposal({
          weatherAssessment: `Static hosting mode: reviewing safer lower-altitude fallback options for ${disruptionReason}.`,
          affectedActivities: currentDay?.attractions || ['High-altitude excursion'],
          proposedDayPlan: {
            dayNumber: replanDay,
            title: `Day ${replanDay}: Safer Low-Altitude & Cultural Alternative in ${destination}`,
            morning: `Wait out morning weather at your lodge and visit sheltered local bazaar or heritage museum in ${destination}.`,
            afternoon: `Short accessible valley viewpoint stop (weather permitting) and local culinary tasting.`,
            evening: `Indoor evening dinner and updated next-day route confirmation with your local guide.`,
            attractions: ['Local Heritage Museum', 'Sheltered Valley Cafe', 'Artisan Bazaar'],
            estimatedDayCostPkr: currentDay?.estimatedDayCostPkr || Math.round(budgetPkr / Math.max(1, plan.days.length)),
          },
          budgetDeltaPkr: 0,
          guideNotificationNote: `Proposed indoor/low-altitude fallback for Day ${replanDay} due to: ${disruptionReason}.`,
        });
        return;
      }
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to generate re-plan proposal.');
      setProposal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to evaluate dynamic re-planning.');
    } finally {
      setReplanning(false);
    }
  };

  const handleApproveProposal = async () => {
    if (!plan || !proposal) return;
    const prevDay = plan.days.find((d) => d.dayNumber === proposal.proposedDayPlan.dayNumber);
    const updatedDays = plan.days.map((d) =>
      d.dayNumber === proposal.proposedDayPlan.dayNumber ? proposal.proposedDayPlan : d
    );
    const updatedBudget = {
      ...plan.budgetBreakdown,
      totalEstimatedPkr: Math.max(
        0,
        (plan.budgetBreakdown?.totalEstimatedPkr || budgetPkr) + (proposal.budgetDeltaPkr || 0)
      ),
    };
    const newRevision = {
      revisedAt: new Date().toISOString(),
      reason: disruptionReason,
      affectedDayNumber: proposal.proposedDayPlan.dayNumber,
      previousDayTitle: prevDay?.title || `Day ${proposal.proposedDayPlan.dayNumber}`,
      newDayTitle: proposal.proposedDayPlan.title,
      budgetDeltaPkr: proposal.budgetDeltaPkr || 0,
    };
    const nextRevisions = [...(revisions || []), newRevision];

    const updatedPlan = { ...plan, days: updatedDays, budgetBreakdown: updatedBudget };
    setPlan(updatedPlan);
    setRevisions(nextRevisions);
    setProposal(null);

    if (firebaseUser && savedItineraryId) {
      await saveItinerary(
        {
          title: updatedPlan.title,
          startingLocation,
          destination,
          startDate,
          endDate,
          travelers,
          budgetPkr,
          interests,
          accommodationPref,
          transportPref,
          days: updatedDays,
          budgetBreakdown: updatedBudget,
          revisions: nextRevisions,
        },
        savedItineraryId
      );
      setStatusMessage('Approved re-plan saved with full revision history.');
    } else {
      setStatusMessage('Approved re-plan applied to your active itinerary.');
    }
  };

  const matchedPackages = tourPackages.filter((p) =>
    p.destinationName.toLowerCase().includes(destination.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0F172A]">
            AI Smart Trip Planner &amp; Dynamic Re-Planning
          </h1>
          <p className="text-sm text-[#0F172A]/70 mt-1.5 max-w-2xl">
            Generate structured Pakistan itineraries in PKR, inspect categorized cost estimates, and
            adapt active schedules dynamically when weather changes.
          </p>
        </div>

        {firebaseUser && itineraries.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const found = itineraries.find((i) => i.id === e.target.value);
                if (found) handleLoadSaved(found);
              }}
              defaultValue=""
              className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            >
              <option value="" disabled>
                Load Saved Itinerary ({itineraries.length})
              </option>
              {itineraries.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.title} · {it.destination}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Preferences Form */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 no-print"
        >
          <h2 className="font-display text-lg font-bold text-[#0F172A]">Trip Parameters</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Starting Location
              </label>
              <input
                type="text"
                required
                value={startingLocation}
                onChange={(e) => setStartingLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Destination
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Departure Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Return Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Travelers
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Budget (PKR)
              </label>
              <input
                type="number"
                min={5000}
                step={1000}
                value={budgetPkr}
                onChange={(e) => setBudgetPkr(Number(e.target.value) || 10000)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Accommodation Preference
              </label>
              <select
                value={accommodationPref}
                onChange={(e) => setAccommodationPref(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option>Budget guesthouse / hostel</option>
                <option>Mid-range mountain lodge</option>
                <option>Boutique eco-resort</option>
                <option>Family suites</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                Transportation Preference
              </label>
              <select
                value={transportPref}
                onChange={(e) => setTransportPref(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option>Shared coaster / 4x4 Jeep</option>
                <option>Private 4x4 Prado / Land Cruiser</option>
                <option>Private Sedan + local 4x4</option>
                <option>Domestic Flight + 4x4</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0F172A]/80 mb-2">
              Travel Interests
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_CATEGORIES.map((item) => {
                const active = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0D5EFF] text-white border-[#0D5EFF]'
                        : 'bg-[#F4F7FC] text-[#0F172A]/75 border-slate-200 hover:bg-[#EEF4FF]/60'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
              Special Requirements
            </label>
            <input
              type="text"
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="Elderly accessibility, vegetarian meals, photography stops..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] disabled:opacity-60 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{generating ? 'Generating AI Itinerary...' : 'Generate Smart Itinerary'}</span>
          </button>
        </form>

        {/* Right: Generated Itinerary & Dynamic Re-Planning */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="bg-[#EEF4FF] border border-[#0B57D0]/30 text-[#0D5EFF] px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3 no-print">
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Open Dashboard
              </button>
            </div>
          )}

          {!plan ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <Compass className="w-10 h-10 text-[#0B57D0] mx-auto" />
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Configure your journey and generate a live itinerary
              </h2>
              <p className="text-sm text-[#0F172A]/70 max-w-lg mx-auto">
                TravelMate will assemble a day-by-day route, categorized PKR cost estimates,
                verified local provider matches, and weather-adaptive backup options.
              </p>
            </div>
          ) : (
            <>
              {/* Plan Header & Action Toolbar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#0B57D0] mb-1">
                      AI-Generated Estimate · {destination} · {plan.days.length} Days · {travelers} Travelers
                    </div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A]">
                      {plan.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 no-print">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>{savedItineraryId ? 'Update Saved' : 'Save Itinerary'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-[#F4F7FC] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConvertToTripRequest}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B57D0] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send as Guide Request</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#0F172A]/75 leading-relaxed">
                  {plan.destinationSummary}
                </p>

                <div className="bg-[#F4F7FC] border border-slate-200 rounded-xl p-3.5 text-xs text-[#0F172A]/75">
                  <strong className="text-[#0D5EFF]">Estimate Notice:</strong>{' '}
                  {plan.disclaimer ||
                    'Cost figures below are AI-generated PKR estimates, distinct from confirmed provider quotes. Safety note: ' +
                      plan.safetyAndSeasonNote}
                </div>

                {/* Categorized PKR Budget Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                  {[
                    { label: 'Transport', val: plan.budgetBreakdown?.transportationPkr },
                    { label: 'Stay', val: plan.budgetBreakdown?.accommodationPkr },
                    { label: 'Food', val: plan.budgetBreakdown?.foodPkr },
                    { label: 'Activities', val: plan.budgetBreakdown?.activitiesPkr },
                    { label: 'Misc', val: plan.budgetBreakdown?.miscellaneousPkr },
                    { label: 'Est. Total', val: plan.budgetBreakdown?.totalEstimatedPkr, bold: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`p-3 rounded-lg border ${
                        item.bold
                          ? 'bg-[#EEF4FF]/60 border-[#0B57D0]/30'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-[11px] text-[#0F172A]/60">{item.label}</div>
                      <div className="font-mono text-sm font-bold text-[#0D5EFF] tabular-nums mt-0.5">
                        {formatPkr(item.val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Day-by-Day Schedule */}
              <div className="space-y-4">
                {plan.days.map((day, idx) => (
                  <div
                    key={day.dayNumber}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <span className="font-mono text-xs font-bold text-[#0B57D0] uppercase">
                          Day {day.dayNumber}
                        </span>
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => handleDayEdit(idx, 'title', e.target.value)}
                          className="font-display font-bold text-base text-[#0F172A] bg-transparent border-b border-transparent focus:border-[#0D5EFF] focus:outline-none flex-1"
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#0D5EFF] tabular-nums">
                        Est. {formatPkr(day.estimatedDayCostPkr)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-[#F4F7FC] p-3 rounded-lg">
                        <div className="font-semibold text-[#0D5EFF] mb-1">Morning</div>
                        <textarea
                          rows={2}
                          value={day.morning}
                          onChange={(e) => handleDayEdit(idx, 'morning', e.target.value)}
                          className="w-full bg-transparent text-[#0F172A]/80 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="bg-[#F4F7FC] p-3 rounded-lg">
                        <div className="font-semibold text-[#0D5EFF] mb-1">Afternoon</div>
                        <textarea
                          rows={2}
                          value={day.afternoon}
                          onChange={(e) => handleDayEdit(idx, 'afternoon', e.target.value)}
                          className="w-full bg-transparent text-[#0F172A]/80 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="bg-[#F4F7FC] p-3 rounded-lg">
                        <div className="font-semibold text-[#0D5EFF] mb-1">Evening</div>
                        <textarea
                          rows={2}
                          value={day.evening}
                          onChange={(e) => handleDayEdit(idx, 'evening', e.target.value)}
                          className="w-full bg-transparent text-[#0F172A]/80 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-[#0F172A]/65">
                      Attractions: {(day.attractions || []).join(' · ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Trip Re-Planning Module (Section 6) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 no-print">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-[#0B57D0]" />
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">
                    Dynamic Weather &amp; Disruption Re-Planning
                  </h3>
                </div>
                <p className="text-xs text-[#0F172A]/70">
                  Evaluate live Open-Meteo conditions or unexpected route delays for any day. Changes
                  are proposed for your approval and preserve full revision history.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                      Affected Day
                    </label>
                    <select
                      value={replanDay}
                      onChange={(e) => setReplanDay(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    >
                      {plan.days.map((d) => (
                        <option key={d.dayNumber} value={d.dayNumber}>
                          Day {d.dayNumber}: {d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                      Disruption / Weather Context
                    </label>
                    <input
                      type="text"
                      value={disruptionReason}
                      onChange={(e) => setDisruptionReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleProposeReplan}
                      disabled={replanning}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0D5EFF] text-white text-sm font-medium rounded-lg hover:bg-[#0948CC] disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{replanning ? 'Evaluating...' : 'Propose Adjustment'}</span>
                    </button>
                  </div>
                </div>

                {proposal && (
                  <div className="bg-[#EEF4FF]/50 border border-[#0B57D0]/30 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0D5EFF]">
                        Proposed Revision for Day {proposal.proposedDayPlan.dayNumber}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#0D5EFF] tabular-nums">
                        Budget Delta: {proposal.budgetDeltaPkr >= 0 ? '+' : ''}
                        {formatPkr(proposal.budgetDeltaPkr)}
                      </span>
                    </div>
                    <p className="text-xs text-[#0F172A]/80">{proposal.weatherAssessment}</p>
                    <div className="bg-white rounded-lg p-3.5 border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-[#0F172A]">
                        {proposal.proposedDayPlan.title}
                      </div>
                      <div>Morning: {proposal.proposedDayPlan.morning}</div>
                      <div>Afternoon: {proposal.proposedDayPlan.afternoon}</div>
                      <div>Evening: {proposal.proposedDayPlan.evening}</div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <span className="text-xs text-[#0F172A]/70">
                        Guide Note: {proposal.guideNotificationNote}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setProposal(null)}
                          className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg cursor-pointer"
                        >
                          Keep Original
                        </button>
                        <button
                          type="button"
                          onClick={handleApproveProposal}
                          className="px-4 py-1.5 text-xs font-semibold bg-[#0D5EFF] text-white rounded-lg hover:bg-[#0948CC] cursor-pointer"
                        >
                          Approve &amp; Update Itinerary
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {revisions && revisions.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <div className="text-xs font-semibold text-[#0F172A] mb-2">
                      Revision History ({revisions.length})
                    </div>
                    <div className="space-y-1.5">
                      {revisions.map((rev, i) => (
                        <div key={i} className="text-xs text-[#0F172A]/70 flex flex-wrap gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#0B57D0]" />
                          <span>
                            Day {rev.affectedDayNumber}: &ldquo;{rev.previousDayTitle}&rdquo; replaced
                            with &ldquo;{rev.newDayTitle}&rdquo; ({rev.reason})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Matching Database Packages & Alternative Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 no-print">
                {plan.alternativeOptions && plan.alternativeOptions.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-3">
                      <Wallet className="w-4 h-4 text-[#0B57D0]" />
                      <span>Alternative Plan Tiers</span>
                    </div>
                    <div className="space-y-3">
                      {plan.alternativeOptions.map((alt) => (
                        <div key={alt.label} className="border-b border-slate-200 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex justify-between text-xs font-semibold text-[#0D5EFF]">
                            <span>{alt.label}</span>
                            <span className="font-mono tabular-nums">{formatPkr(alt.estimatedBudgetPkr)}</span>
                          </div>
                          <p className="text-xs text-[#0F172A]/70 mt-1">{alt.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-sm font-bold text-[#0F172A] mb-3">
                    Live Database Packages for {destination}
                  </div>
                  {matchedPackages.length > 0 ? (
                    <div className="space-y-3">
                      {matchedPackages.map((pkg) => (
                        <div key={pkg.id} className="text-xs border-b border-slate-200 pb-2.5 last:border-0">
                          <div className="font-semibold text-[#0F172A]">{pkg.title}</div>
                          <div className="text-[#0F172A]/65 mt-0.5">
                            {pkg.guideName} · {pkg.durationDays} Days ·{' '}
                            <span className="font-mono font-semibold text-[#0D5EFF] tabular-nums">
                              {formatPkr(pkg.pricePerPersonPkr)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#0F172A]/65">
                      Use &ldquo;Send as Guide Request&rdquo; above to invite a custom quote from our verified guides.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

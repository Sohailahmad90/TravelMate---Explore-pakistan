import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Car,
  Check,
  Heart,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import { daysBetween, formatPkr } from '../lib/formatters';
import { HERO_IMAGE } from '../data/seedData';
import type { Hotel, LocalExperience, PublicProfile, Room, TourPackage, Vehicle } from '../types/travelmate';

export type ServiceTab = 'packages' | 'guides' | 'hotels' | 'vehicles' | 'experiences';

interface MarketplaceViewProps {
  initialTab?: ServiceTab;
  onRequireSignIn: () => void;
  onOpenMessages: () => void;
}

interface BookingModalTarget {
  type: 'package' | 'hotel' | 'vehicle' | 'experience' | 'custom_trip';
  itemId: string;
  itemTitle: string;
  providerId: string;
  providerName: string;
  destinationName: string;
  unitPricePkr: number;
  unitLabel: 'per person' | 'per night' | 'per day' | 'flat';
  roomId?: string;
  supportsDriver?: boolean;
}

export function MarketplaceView({ initialTab = 'packages', onRequireSignIn, onOpenMessages }: MarketplaceViewProps) {
  const {
    tourPackages,
    publicProfiles,
    hotels,
    rooms,
    vehicles,
    localExperiences,
    reviews,
    favorites,
    firebaseUser,
    toggleFavorite,
    createBooking,
    startOrOpenConversation,
  } = useTravelMate();

  const [activeTab, setActiveTab] = useState<ServiceTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('All');
  const [maxPricePkr, setMaxPricePkr] = useState<number>(100000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Booking Modal State
  const [modalTarget, setModalTarget] = useState<BookingModalTarget | null>(null);
  const [startDate, setStartDate] = useState('2026-12-05');
  const [endDate, setEndDate] = useState('2026-12-09');
  const [guests, setGuests] = useState(2);
  const [driverRequired, setDriverRequired] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_arrival' | 'manual_transfer'>('cash_on_arrival');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const destinationNames = useMemo(() => {
    const set = new Set<string>();
    tourPackages.forEach((p) => set.add(p.destinationName));
    hotels.forEach((h) => set.add(h.destinationName));
    localExperiences.forEach((e) => set.add(e.destinationName));
    return ['All', ...Array.from(set)];
  }, [tourPackages, hotels, localExperiences]);

  const guides = useMemo(
    () => publicProfiles.filter((p) => p.role === 'guide'),
    [publicProfiles]
  );

  const isGuideVerified = (uid: string) =>
    publicProfiles.some((p) => p.uid === uid && p.verificationStatus === 'verified');

  const isFavorited = (itemType: 'package' | 'hotel' | 'vehicle' | 'experience', itemId: string) =>
    favorites.some((f) => f.itemType === itemType && f.itemId === itemId);

  const q = searchQuery.trim().toLowerCase();

  const filteredPackages = tourPackages.filter((p) => {
    const matchQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.destinationName.toLowerCase().includes(q) ||
      p.guideName.toLowerCase().includes(q);
    const matchDest = destinationFilter === 'All' || p.destinationName === destinationFilter;
    const matchPrice = p.pricePerPersonPkr <= maxPricePkr;
    const matchVerif = !verifiedOnly || isGuideVerified(p.guideId);
    return matchQ && matchDest && matchPrice && matchVerif;
  });

  const filteredGuides = guides.filter((g) => {
    const matchQ =
      !q ||
      g.displayName.toLowerCase().includes(q) ||
      (g.bio || '').toLowerCase().includes(q) ||
      (g.operatingDestinations || []).some((d) => d.toLowerCase().includes(q));
    const matchDest =
      destinationFilter === 'All' ||
      (g.operatingDestinations || []).includes(destinationFilter);
    const matchVerif = !verifiedOnly || g.verificationStatus === 'verified';
    return matchQ && matchDest && matchVerif;
  });

  const filteredHotels = hotels.filter((h) => {
    const matchQ =
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.destinationName.toLowerCase().includes(q);
    const matchDest = destinationFilter === 'All' || h.destinationName === destinationFilter;
    const hotelRooms = rooms.filter((r) => r.hotelId === h.id);
    const minRate = hotelRooms.length ? Math.min(...hotelRooms.map((r) => r.pricePerNightPkr)) : 0;
    const matchPrice = minRate <= maxPricePkr;
    return matchQ && matchDest && matchPrice;
  });

  const filteredVehicles = vehicles.filter((v) => {
    const matchQ =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      (v.serviceLocations || []).some((l) => l.toLowerCase().includes(q));
    const matchDest =
      destinationFilter === 'All' ||
      (v.serviceLocations || []).some((l) => l.toLowerCase().includes(destinationFilter.toLowerCase()));
    const matchPrice = v.pricePerDayPkr <= maxPricePkr;
    return matchQ && matchDest && matchPrice;
  });

  const approvedExperiences = localExperiences.filter((e) => {
    if (e.approvalStatus !== 'approved') return false;
    const matchQ =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.destinationName.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q);
    const matchDest = destinationFilter === 'All' || e.destinationName === destinationFilter;
    const matchPrice = e.pricePkr <= maxPricePkr;
    return matchQ && matchDest && matchPrice;
  });

  const openBookModal = (target: BookingModalTarget) => {
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    setFeedback(null);
    setModalTarget(target);
  };

  const handleMessageProvider = async (providerId: string, providerName: string, title: string) => {
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    await startOrOpenConversation(providerId, providerName, title);
    onOpenMessages();
  };

  const computedTotalPkr = useMemo(() => {
    if (!modalTarget) return 0;
    if (modalTarget.unitLabel === 'per person') {
      return modalTarget.unitPricePkr * Math.max(1, guests);
    }
    if (modalTarget.unitLabel === 'per night' || modalTarget.unitLabel === 'per day') {
      return modalTarget.unitPricePkr * daysBetween(startDate, endDate);
    }
    return modalTarget.unitPricePkr;
  }, [modalTarget, guests, startDate, endDate]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTarget) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await createBooking({
        providerId: modalTarget.providerId,
        providerName: modalTarget.providerName,
        bookingType: modalTarget.type,
        itemId: modalTarget.itemId,
        itemTitle: modalTarget.itemTitle,
        destinationName: modalTarget.destinationName,
        startDate,
        endDate,
        guests,
        roomId: modalTarget.roomId,
        driverRequired: modalTarget.supportsDriver ? driverRequired : false,
        totalPricePkr: computedTotalPkr,
        paymentMethod,
        notes,
      });
      setFeedback({
        type: 'ok',
        text: 'Reservation request submitted! Track status and invoice in your Dashboard.',
      });
      setTimeout(() => setModalTarget(null), 1100);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to submit booking.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0F172A]">
          {activeTab === 'guides'
            ? 'Verified Local Tour Guides'
            : 'Tour Packages, Stays & Local Services'}
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          {activeTab === 'guides'
            ? 'Connect with experienced, verified Pakistan tour guides, inspect trust metrics, message directly, or hire a guide for your custom circuit.'
            : 'Compare database-driven tour packages, verified guides, room-inventoried hotels, 4x4 vehicles, and cultural experiences with transparent PKR pricing.'}
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-[#0F172A]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages, hotels, vehicles, guides..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            {destinationNames.map((name) => (
              <option key={name} value={name}>
                {name === 'All' ? 'All Destinations' : name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3 flex items-center gap-2 text-xs">
          <span className="text-[#0F172A]/70 whitespace-nowrap">Max Rate:</span>
          <input
            type="range"
            min={5000}
            max={100000}
            step={2500}
            value={maxPricePkr}
            onChange={(e) => setMaxPricePkr(Number(e.target.value))}
            className="flex-1 accent-[#0D5EFF]"
          />
          <span className="font-mono font-semibold text-[#0D5EFF] tabular-nums whitespace-nowrap">
            {formatPkr(maxPricePkr)}
          </span>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0F172A] cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="accent-[#0D5EFF] rounded"
            />
            <span>Verified Only</span>
          </label>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'packages' as const, label: `Tour Packages (${filteredPackages.length})`, icon: Sparkles },
          { id: 'guides' as const, label: `Verified Guides (${filteredGuides.length})`, icon: UserCheck },
          { id: 'hotels' as const, label: `Hotels & Lodges (${filteredHotels.length})`, icon: Building2 },
          { id: 'vehicles' as const, label: `Rental Vehicles (${filteredVehicles.length})`, icon: Car },
          { id: 'experiences' as const, label: `Local Experiences (${approvedExperiences.length})`, icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                active
                  ? 'bg-[#0D5EFF] text-white'
                  : 'bg-white text-[#0F172A]/75 border border-slate-200 hover:bg-[#EEF4FF]/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg: TourPackage) => (
            <div
              key={pkg.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/10] bg-[#EEF4FF] relative">
                  <img
                    src={pkg.imageUrl || HERO_IMAGE}
                    alt={pkg.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {firebaseUser && (
                    <button
                      type="button"
                      onClick={() =>
                        void toggleFavorite({
                          itemType: 'package',
                          itemId: pkg.id,
                          itemTitle: pkg.title,
                          destinationName: pkg.destinationName,
                        })
                      }
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg text-[#0D5EFF] cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFavorited('package', pkg.id) ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="text-xs text-[#0F172A]/60">
                    {pkg.destinationName} · {pkg.durationDays} Days · Max {pkg.maxGroupSize} guests
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">{pkg.title}</h2>
                  <p className="text-xs text-[#0F172A]/75 leading-relaxed">{pkg.description}</p>
                  {pkg.included && pkg.included.length > 0 && (
                    <div className="text-xs text-[#0F172A]/70 pt-1">
                      Includes: {pkg.included.slice(0, 3).join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-200 bg-[#F4F7FC] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#0F172A]/60">Guide: {pkg.guideName}</div>
                  <div className="font-mono text-base font-bold text-[#0D5EFF] tabular-nums">
                    {formatPkr(pkg.pricePerPersonPkr)} <span className="text-xs font-normal">/ person</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void handleMessageProvider(pkg.guideId, pkg.guideName, `Package: ${pkg.title}`)
                    }
                    className="p-2 border border-slate-200 bg-white rounded-lg text-[#0D5EFF] hover:bg-[#EEF4FF]/50 cursor-pointer"
                    title="Message guide"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openBookModal({
                        type: 'package',
                        itemId: pkg.id,
                        itemTitle: pkg.title,
                        providerId: pkg.guideId,
                        providerName: pkg.guideName,
                        destinationName: pkg.destinationName,
                        unitPricePkr: pkg.pricePerPersonPkr,
                        unitLabel: 'per person',
                      })
                    }
                    className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                  >
                    Request Booking
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'guides' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide: PublicProfile) => {
            const guideReviews = reviews.filter((r) => r.targetId === guide.uid && r.moderationStatus === 'published');
            return (
              <div
                key={guide.uid}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#0F172A]">
                        {guide.displayName}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-[#0B57D0] font-medium mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {guide.verificationStatus === 'verified'
                            ? 'Admin Verified Provider'
                            : 'Verification Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono font-semibold tabular-nums">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{(guide.avgRating || 4.8).toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-[#0F172A]/75 leading-relaxed">{guide.bio}</p>

                  <div className="text-xs text-[#0F172A]/70 space-y-1">
                    <div>Languages: {(guide.languages || ['Urdu', 'English']).join(' · ')}</div>
                    <div>
                      Regions: {(guide.operatingDestinations || ['Northern Pakistan']).join(' · ')}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#F4F7FC] p-3 rounded-xl text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-[#0F172A]/55 text-[11px]">Completed</div>
                      <div className="font-bold text-[#0D5EFF]">{guide.completedBookings || 0}</div>
                    </div>
                    <div>
                      <div className="text-[#0F172A]/55 text-[11px]">Response</div>
                      <div className="font-bold text-[#0D5EFF]">{guide.responseRate || 95}%</div>
                    </div>
                    <div>
                      <div className="text-[#0F172A]/55 text-[11px]">Cancelled</div>
                      <div className="font-bold text-[#0D5EFF]">{guide.cancellationCount || 0}</div>
                    </div>
                  </div>

                  {guideReviews.length > 0 && (
                    <div className="text-xs text-[#0F172A]/70 border-t border-slate-200 pt-2">
                      Latest verified review: &ldquo;{guideReviews[0].comment}&rdquo; — {guideReviews[0].authorName}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      void handleMessageProvider(
                        guide.uid,
                        guide.displayName,
                        `Guide Inquiry: ${guide.displayName}`
                      )
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-[#F4F7FC] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openBookModal({
                        type: 'custom_trip',
                        itemId: guide.uid,
                        itemTitle: `Custom Guided Trip with ${guide.displayName}`,
                        providerId: guide.uid,
                        providerName: guide.displayName,
                        destinationName: (guide.operatingDestinations && guide.operatingDestinations[0]) || 'Hunza Valley',
                        unitPricePkr: 9500,
                        unitLabel: 'per day',
                      })
                    }
                    className="flex-1 px-3 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                  >
                    Hire Guide
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'hotels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHotels.map((hotel: Hotel) => {
            const hotelRooms = rooms.filter((r: Room) => r.hotelId === hotel.id);
            return (
              <div
                key={hotel.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12">
                  <div className="sm:col-span-5 bg-[#EEF4FF] min-h-[180px]">
                    <img
                      src={hotel.imageUrl || HERO_IMAGE}
                      alt={hotel.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-7 p-5 space-y-2">
                    <div className="text-xs text-[#0B57D0] font-medium">
                      {hotel.destinationName} · Check-in {hotel.checkInTime || '14:00'}
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#0F172A]">{hotel.name}</h2>
                    <p className="text-xs text-[#0F172A]/75">{hotel.description}</p>
                    <div className="text-xs text-[#0F172A]/60">
                      {(hotel.facilities || []).slice(0, 4).join(' · ')}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 p-4 bg-[#F4F7FC] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
                    <span>Available Room Categories</span>
                    <button
                      type="button"
                      onClick={() =>
                        void handleMessageProvider(
                          hotel.ownerId,
                          hotel.ownerName,
                          `Stay Inquiry: ${hotel.name}`
                        )
                      }
                      className="inline-flex items-center gap-1 text-[#0D5EFF] hover:underline cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact Property</span>
                    </button>
                  </div>
                  {hotelRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A]">
                          {room.categoryName}
                        </div>
                        <div className="text-xs text-[#0F172A]/65 font-mono tabular-nums">
                          Up to {room.capacity} guests · {room.totalInventory} rooms available
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-[#0D5EFF] tabular-nums">
                          {formatPkr(room.pricePerNightPkr)}/night
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openBookModal({
                              type: 'hotel',
                              itemId: hotel.id,
                              itemTitle: `${hotel.name} — ${room.categoryName}`,
                              providerId: hotel.ownerId,
                              providerName: hotel.ownerName,
                              destinationName: hotel.destinationName,
                              unitPricePkr: room.pricePerNightPkr,
                              unitLabel: 'per night',
                              roomId: room.id,
                            })
                          }
                          className="px-3.5 py-1.5 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                        >
                          Reserve Room
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((veh: Vehicle) => (
            <div
              key={veh.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/10] bg-[#EEF4FF]">
                  <img
                    src={veh.imageUrl || HERO_IMAGE}
                    alt={veh.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2.5">
                  <div className="text-xs text-[#0F172A]/60">
                    {veh.category} · {veh.modelYear || 2022} · {veh.seatingCapacity} Seats
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">{veh.name}</h2>
                  <div className="text-xs text-[#0F172A]/75">
                    {veh.hasAC ? 'Climate Control AC' : 'Standard'} · {veh.fuelType || 'Petrol'} ·{' '}
                    {veh.driverAvailable ? 'Driver Option Available' : 'Self-drive'}
                  </div>
                  <div className="text-xs text-[#0F172A]/65">
                    Corridors: {(veh.serviceLocations || []).join(' · ')}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-200 bg-[#F4F7FC] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#0F172A]/60">{veh.ownerName}</div>
                  <div className="font-mono text-base font-bold text-[#0D5EFF] tabular-nums">
                    {formatPkr(veh.pricePerDayPkr)} <span className="text-xs font-normal">/ day</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={veh.availability !== 'available'}
                  onClick={() =>
                    openBookModal({
                      type: 'vehicle',
                      itemId: veh.id,
                      itemTitle: veh.name,
                      providerId: veh.ownerId,
                      providerName: veh.ownerName,
                      destinationName: (veh.serviceLocations && veh.serviceLocations[0]) || 'Hunza Valley',
                      unitPricePkr: veh.pricePerDayPkr,
                      unitLabel: 'per day',
                      supportsDriver: Boolean(veh.driverAvailable),
                    })
                  }
                  className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] disabled:opacity-50 cursor-pointer"
                >
                  {veh.availability === 'available' ? 'Rent Vehicle' : veh.availability}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'experiences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedExperiences.map((exp: LocalExperience) => (
            <div
              key={exp.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="text-xs text-[#0B57D0] font-medium">
                  {exp.category} · {exp.destinationName} · {exp.durationHours || 3} hrs
                </div>
                <h2 className="font-display text-lg font-bold text-[#0F172A]">{exp.title}</h2>
                <p className="text-sm text-[#0F172A]/75 leading-relaxed">{exp.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <div className="text-xs text-[#0F172A]/60">Hosted by {exp.providerName}</div>
                  <div className="font-mono text-base font-bold text-[#0D5EFF] tabular-nums">
                    {formatPkr(exp.pricePkr)} <span className="text-xs font-normal">/ person</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openBookModal({
                      type: 'experience',
                      itemId: exp.id,
                      itemTitle: exp.title,
                      providerId: exp.providerId,
                      providerName: exp.providerName,
                      destinationName: exp.destinationName,
                      unitPricePkr: exp.pricePkr,
                      unitLabel: 'per person',
                    })
                  }
                  className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                >
                  Book Experience
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified Reservation Modal */}
      {modalTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F4F7FC]">
              <div>
                <div className="text-xs text-[#0B57D0] font-medium">Reservation Request</div>
                <h3 className="font-display font-bold text-[#0F172A]">{modalTarget.itemTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                    Start / Check-in Date
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
                    End / Check-out Date
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
                    Participants / Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                    Payment Preference
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as 'cash_on_arrival' | 'manual_transfer')
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  >
                    <option value="cash_on_arrival">Cash on Arrival</option>
                    <option value="manual_transfer">Manual Bank / Raast Request</option>
                  </select>
                </div>
              </div>

              {modalTarget.supportsDriver && (
                <label className="flex items-center gap-2 text-sm text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={driverRequired}
                    onChange={(e) => setDriverRequired(e.target.checked)}
                    className="accent-[#0D5EFF]"
                  />
                  <span>Include experienced local mountain driver</span>
                </label>
              )}

              <div>
                <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                  Pickup / Special Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Islamabad pickup time, room preference, luggage notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="bg-[#EEF4FF]/50 border border-[#0B57D0]/25 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-[#0D5EFF]">
                  Estimated Booking Total ({modalTarget.unitLabel})
                </span>
                <span className="font-mono text-lg font-bold text-[#0D5EFF] tabular-nums">
                  {formatPkr(computedTotalPkr)}
                </span>
              </div>

              {feedback && (
                <div
                  className={`text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 ${
                    feedback.type === 'ok'
                      ? 'bg-[#EEF4FF] text-[#0D5EFF]'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {feedback.type === 'ok' && <Check className="w-4 h-4 shrink-0" />}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalTarget(null)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

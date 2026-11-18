import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Compass,
  Headphones,
  Hotel,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import { HERO_IMAGE } from '../data/seedData';
import { useTravelMate } from '../context/TravelMateContext';
import { formatPkr } from '../lib/formatters';
import type { AppRoute, AuthModalTab } from './Navbar';

interface HomeViewProps {
  onNavigate: (route: AppRoute) => void;
  onSelectDestinationForPlanner: (destName: string) => void;
  onSelectDestinationDetail: (destId: string) => void;
  onOpenAuthModal: (tab?: AuthModalTab) => void;
}

type HeroSearchTab = 'destinations' | 'guides' | 'packages' | 'ai-planner';

export function HomeView({
  onNavigate,
  onSelectDestinationForPlanner,
  onSelectDestinationDetail,
  onOpenAuthModal,
}: HomeViewProps) {
  const { destinations, tourPackages, publicProfiles, firebaseUser } = useTravelMate();
  const [searchTab, setSearchTab] = useState<HeroSearchTab>('destinations');
  const [fromCity, setFromCity] = useState('Islamabad');
  const [toDestination, setToDestination] = useState('Hunza Valley');
  const [checkIn, setCheckIn] = useState('2026-12-05');
  const [checkOut, setCheckOut] = useState('2026-12-09');
  const [travelersCount, setTravelersCount] = useState('2 Adults');

  const popularDestinations = destinations.slice(0, 5);
  const featuredPackages = tourPackages.slice(0, 3);
  const featuredGuides = publicProfiles.filter((p) => p.role === 'guide').slice(0, 3);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTab === 'ai-planner') {
      onSelectDestinationForPlanner(toDestination);
      return;
    }
    if (searchTab === 'destinations') {
      const match = destinations.find((d) =>
        d.name.toLowerCase().includes(toDestination.trim().toLowerCase())
      );
      if (match) {
        onSelectDestinationDetail(match.id);
        return;
      }
      onNavigate('destinations');
      return;
    }
    onNavigate(searchTab);
  };

  return (
    <div className="space-y-16 pb-8">
      {/* 1. Full-bleed Bright Hero + Overlapping Search Card */}
      <section>
        <div className="relative overflow-hidden min-h-[470px] lg:min-h-[520px] flex items-center bg-[#DCE8FB]">
          <img
            src={HERO_IMAGE}
            alt="Hunza Valley mountain horizon in Northern Pakistan"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F7FC]/95 via-[#F4F7FC]/78 to-transparent" />

          <div className="relative z-10 max-w-[1440px] mx-auto px-6 w-full py-16 pb-24">
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-[#0D5EFF] tracking-wide mb-3">
                Smart Pakistan Tourism &amp; Verified Local Travel
              </p>
              <h1
                className="font-display font-extrabold tracking-tight text-[#0A2351] leading-[1.08] mb-4"
                style={{ fontSize: 'clamp(2.3rem, 4.1vw, 3.75rem)', textWrap: 'balance' }}
              >
                Explore Pakistan{' '}
                <span className="block">
                  Create <span className="italic text-[#FF6B2C]">Memories</span>
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-7 max-w-md">
                Discover northern valleys, verified tour guides, curated packages, and AI-calibrated
                PKR itineraries built for safer mountain journeys.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 mb-7">
                <button
                  type="button"
                  onClick={() => onNavigate('destinations')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D5EFF] text-white text-sm font-semibold rounded-xl hover:bg-[#0948CC] transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
                >
                  <span>Explore Destinations</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('packages')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A2351] border border-slate-200 text-sm font-semibold rounded-xl hover:bg-[#EEF4FF] transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
                >
                  View Packages
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-medium">
                <span>14 Northern &amp; Alpine Valleys</span>
                <span aria-hidden="true">·</span>
                <span>Verified Tour Guides</span>
                <span aria-hidden="true">·</span>
                <span>PKR Budget Estimates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overlapping White Search & Trip Bar */}
        <div className="max-w-[1200px] mx-auto px-6 -mt-12 relative z-20">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5">
            {/* Interactive Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3.5 mb-4">
              {[
                { id: 'destinations' as const, label: 'Destinations', icon: MapPin, color: 'text-[#0D5EFF]' },
                { id: 'guides' as const, label: 'Guides', icon: UserCheck, color: 'text-emerald-600' },
                { id: 'packages' as const, label: 'Packages', icon: Package, color: 'text-[#FF6B2C]' },
                { id: 'ai-planner' as const, label: 'Trip Planner', icon: Sparkles, color: 'text-indigo-600' },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = searchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSearchTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#EEF4FF] text-[#0D5EFF]'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#0D5EFF]' : tab.color}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">From</label>
                <input
                  type="text"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-[#0F172A] bg-[#F4F7FC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5EFF]"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">To Destination</label>
                <select
                  value={toDestination}
                  onChange={(e) => setToDestination(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-[#0F172A] bg-[#F4F7FC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5EFF]"
                >
                  {destinations.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-[#0F172A] bg-[#F4F7FC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5EFF]"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-[#0F172A] bg-[#F4F7FC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5EFF]"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Travelers</label>
                <select
                  value={travelersCount}
                  onChange={(e) => setTravelersCount(e.target.value)}
                  className="w-full px-2.5 py-2.5 text-sm text-[#0F172A] bg-[#F4F7FC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5EFF]"
                >
                  <option>1 Adult</option>
                  <option>2 Adults</option>
                  <option>4 Adults</option>
                  <option>Family (6)</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-xl hover:bg-[#0948CC] transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{searchTab === 'ai-planner' ? 'Plan Trip' : 'Search Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Popular Destinations (5-Card Reference Showcase) */}
      <section className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Popular Destinations
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Explore Northern Pakistan&apos;s iconic valleys, glacial lakes, and mountain passes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('destinations')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5EFF] hover:text-[#0948CC] cursor-pointer"
          >
            <span>View All Destinations</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {popularDestinations.map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => onSelectDestinationDetail(dest.id)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] text-left bg-[#0A2351] shadow-sm cursor-pointer"
            >
              <img
                src={dest.imageUrl || HERO_IMAGE}
                alt={dest.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white space-y-1">
                <div className="text-[11px] text-blue-200 font-medium">{dest.region}</div>
                <h3 className="font-display text-lg font-bold leading-snug">{dest.name}</h3>
                <div className="text-xs text-white/90 font-mono tabular-nums">
                  Starting from {formatPkr(dest.estimatedBudgetPkr)}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 pt-0.5 font-mono tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="text-white font-semibold">4.9</span>
                  <span className="text-white/70">· {dest.bestSeason}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Top Packages & AI Deals (Reference Asymmetric Row) */}
      <section className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Blue/Navy Promo Card */}
          <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#0A2351] via-[#0D47A1] to-[#0D5EFF] text-white p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-200 mb-2">Verified Partner Deals</p>
              <h2 className="font-display text-3xl font-extrabold leading-tight mb-3">
                Top Trips This Season
              </h2>
              <p className="text-sm text-blue-100/85 leading-relaxed mb-6">
                Handpicked multi-day mountain packages with verified local guides, transparent PKR
                rates, and dynamic weather support.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A2351] text-sm font-semibold rounded-xl hover:bg-[#EEF4FF] transition-colors cursor-pointer"
              >
                <span>Explore Packages</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right 3 Crisp White Package Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-[#EEF4FF] overflow-hidden">
                    <img
                      src={pkg.imageUrl || HERO_IMAGE}
                      alt={pkg.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="text-xs text-[#0D5EFF] font-medium">
                      {pkg.destinationName} · {pkg.durationDays} Days
                    </div>
                    <h3 className="font-display text-base font-bold text-[#0F172A] line-clamp-2">
                      {pkg.title}
                    </h3>
                    <div className="text-xs text-slate-600">Guide: {pkg.guideName}</div>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#0A2351] tabular-nums">
                    {formatPkr(pkg.pricePerPersonPkr)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('packages')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5EFF] hover:underline cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 5-Column Trust & Benefit Strip */}
      <section className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              title: 'Transparent PKR',
              sub: 'No hidden fee surprises',
              icon: Sparkles,
              bg: 'bg-amber-50 text-amber-600',
            },
            {
              title: 'Verified Guides',
              sub: 'Admin-checked credentials',
              icon: UserCheck,
              bg: 'bg-emerald-50 text-emerald-600',
            },
            {
              title: 'Safe Reservations',
              sub: 'Conflict-checked stays & 4x4s',
              icon: ShieldCheck,
              bg: 'bg-rose-50 text-rose-600',
            },
            {
              title: 'Dynamic Re-Planning',
              sub: 'AI weather adaptation',
              icon: RefreshCw,
              bg: 'bg-blue-50 text-[#0D5EFF]',
            },
            {
              title: '24/7 Safety Center',
              sub: 'Live weather & SOS alerts',
              icon: Headphones,
              bg: 'bg-indigo-50 text-indigo-600',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold text-[#0F172A] truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Featured Verified Guides Preview */}
      <section className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0F172A]">
              Trusted Local Guides
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Connect directly with regional mountain experts across Gilgit-Baltistan, Swat, and Kaghan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('guides')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5EFF] hover:text-[#0948CC] cursor-pointer"
          >
            <span>Browse All Guides</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredGuides.map((guide) => (
            <div
              key={guide.uid}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#0F172A]">
                      {guide.displayName}
                    </h3>
                    <div className="text-xs text-[#0D5EFF] font-medium mt-0.5">
                      {guide.verificationStatus === 'verified' ? 'Verified Pakistan Guide' : 'Guide Partner'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono font-semibold tabular-nums">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{(guide.avgRating || 4.8).toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{guide.bio}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                <span className="font-mono text-slate-500 tabular-nums">
                  {guide.experienceYears || 0} yrs · {guide.completedBookings || 0} trips
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('guides')}
                  className="font-semibold text-[#0D5EFF] hover:underline cursor-pointer"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. What Our Travelers Say + AI Trip Planner CTA */}
      <section className="max-w-[1440px] mx-auto px-6">
        <h2 className="font-display text-2xl font-bold text-[#0F172A] mb-6">
          What Our Travelers Say
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                quote:
                  'TravelMate planned our 5-day Hunza trip inside PKR 40,000 and smoothly adapted Day 3 when mountain rain hit Attabad.',
                name: 'Saad Mehmood',
                meta: 'Lahore · Hunza Circuit',
              },
              {
                quote:
                  'Booking a verified local guide and 4x4 Prado together saved us hours of phone calls and avoided hidden seasonal surcharges.',
                name: 'Hira Tariq',
                meta: 'Islamabad · Skardu & Deosai',
              },
              {
                quote:
                  'Splitting shared fuel and lodge expenses with my travel group kept our entire Kaghan journey crystal clear to the rupee.',
                name: 'Usman Farooq',
                meta: 'Karachi · Naran & Shogran',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl font-display font-bold text-[#0D5EFF] leading-none mb-2">
                    &ldquo;
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                    {t.quote}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="font-semibold text-sm text-[#0F172A]">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.meta}</div>
                  <div className="flex items-center gap-0.5 text-amber-400 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#0D5EFF] to-[#08245E] text-white p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
                <Compass className="w-4 h-4" />
                <span>AI Trip Planner &amp; Account Setup</span>
              </div>
              <h3 className="font-display text-2xl font-bold leading-snug mb-2">
                Plan Smarter or Join as a Guide
              </h3>
              <p className="text-xs sm:text-sm text-blue-100/85 leading-relaxed mb-5">
                Build custom PKR itineraries in seconds, or sign up as a Tourist or Guide to unlock
                bookings, messaging, and verified provider tools.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('ai-planner')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#0A2351] text-xs font-bold rounded-xl hover:bg-[#EEF4FF] cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Open Trip Planner</span>
              </button>
              {firebaseUser ? (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FF6B2C] text-white text-xs font-bold rounded-xl hover:bg-[#e85d22] cursor-pointer"
                >
                  <Hotel className="w-3.5 h-3.5" />
                  <span>Open Dashboard</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FF6B2C] text-white text-xs font-bold rounded-xl hover:bg-[#e85d22] cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Sign Up Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

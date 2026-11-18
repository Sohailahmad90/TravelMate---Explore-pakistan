import React, { useEffect, useState } from 'react';
import {
  Bell,
  Bookmark,
  Briefcase,
  CalendarCheck,
  Compass,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Printer,
  Shield,
  Star,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import { formatPkr } from '../lib/formatters';
import { BudgetManagerPanel } from './dashboard/BudgetManagerPanel';
import { MessagesPanel } from './dashboard/MessagesPanel';
import {
  GuideDashboardPanel,
  HotelDashboardPanel,
  VehicleDashboardPanel,
} from './dashboard/ProviderPanels';
import { AdminPanel } from './dashboard/AdminPanel';
import type { AppRoute } from './Navbar';
import type { ServiceTab } from './MarketplaceView';
import type { Booking, EmergencyContact } from '../types/travelmate';

export type DashboardTab =
  | 'overview'
  | 'bookings'
  | 'itineraries'
  | 'budget'
  | 'messages'
  | 'notifications'
  | 'favorites'
  | 'profile'
  | 'provider'
  | 'admin';

interface DashboardViewProps {
  initialTab?: DashboardTab;
  onNavigatePublic: (route: AppRoute) => void;
  onOpenMarketplaceTab?: (tab: ServiceTab) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function DashboardView({
  initialTab = 'overview',
  onNavigatePublic,
  onOpenMarketplaceTab,
}: DashboardViewProps) {
  const {
    firebaseUser,
    userProfile,
    isAdmin,
    bookings,
    itineraries,
    favorites,
    notifications,
    expenses,
    reviews,
    tourPackages,
    hotels,
    rooms,
    vehicles,
    updateBookingStatus,
    deleteItinerary,
    markNotificationRead,
    updateProfile,
    submitReview,
    signIn,
  } = useTravelMate();

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  // Profile form state
  const [pName, setPName] = useState(userProfile?.displayName || '');
  const [pPhotoURL, setPPhotoURL] = useState(
    userProfile?.photoURL || firebaseUser?.photoURL || ''
  );
  const [pPhone, setPPhone] = useState(userProfile?.phone || '');
  const [pCity, setPCity] = useState(userProfile?.city || '');
  const [pBio, setPBio] = useState(userProfile?.bio || '');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    userProfile?.emergencyContacts || []
  );
  const [newCName, setNewCName] = useState('');
  const [newCRel, setNewCRel] = useState('');
  const [newCPhone, setNewCPhone] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    setPName(userProfile.displayName || '');
    setPPhotoURL(userProfile.photoURL || firebaseUser?.photoURL || '');
    setPPhone(userProfile.phone || '');
    setPCity(userProfile.city || '');
    setPBio(userProfile.bio || '');
    setContacts(userProfile.emergencyContacts || []);
  }, [userProfile, firebaseUser?.photoURL]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [pPhotoURL]);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
          Sign in to access your TravelMate Dashboard
        </h1>
        <p className="text-sm text-[#0F172A]/70">
          Manage your AI itineraries, bookings, PKR budget, provider services, and emergency contacts.
        </p>
        <button
          type="button"
          onClick={() => void signIn()}
          className="px-6 py-3 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const myBookings = bookings.filter((b) => b.touristId === firebaseUser.uid);
  const incomingBookings = bookings.filter((b) => b.providerId === firebaseUser.uid);
  const totalSpent = expenses.reduce((s, e) => s + e.amountPkr, 0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const role = userProfile?.role || 'tourist';
  const isGuide = role === 'guide';
  const isHotelOwner = role === 'hotel_owner';
  const isVehicleOwner = role === 'vehicle_owner';
  const isProvider = isGuide || isHotelOwner || isVehicleOwner;

  const myPackages = tourPackages.filter((p) => p.guideId === firebaseUser.uid);
  const myHotels = hotels.filter((h) => h.ownerId === firebaseUser.uid);
  const myHotelIds = new Set(myHotels.map((h) => h.id));
  const myRoomCount = rooms.filter((r) => myHotelIds.has(r.hotelId)).length;
  const myVehicles = vehicles.filter((v) => v.ownerId === firebaseUser.uid);
  const availableVehiclesCount = myVehicles.filter((v) => v.availability === 'available').length;
  const providerConfirmedRevenue = incomingBookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPricePkr, 0);

  const navItems: Array<{ id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }> =
    isGuide
      ? [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'provider', label: 'Packages & Requests', icon: Briefcase },
          { id: 'bookings', label: 'My Hotel & Car Bookings', icon: CalendarCheck },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: Bell },
          { id: 'profile', label: 'Profile & Photo', icon: User },
        ]
      : isHotelOwner
        ? [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'provider', label: 'Hotels & Reservations', icon: Briefcase },
            ...(myBookings.length > 0
              ? [{ id: 'bookings' as const, label: 'My Bookings', icon: CalendarCheck }]
              : []),
            { id: 'messages', label: 'Guest Messages', icon: MessageSquare },
            { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: Bell },
            { id: 'profile', label: 'Profile & Photo', icon: User },
          ]
        : isVehicleOwner
          ? [
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'provider', label: 'Fleet & Rentals', icon: Briefcase },
              ...(myBookings.length > 0
                ? [{ id: 'bookings' as const, label: 'My Bookings', icon: CalendarCheck }]
                : []),
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: Bell },
              { id: 'profile', label: 'Profile & Photo', icon: User },
            ]
          : isAdmin
            ? [
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'admin', label: 'Administration', icon: Shield },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: Bell },
                { id: 'profile', label: 'Profile & Photo', icon: User },
              ]
            : [
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'bookings', label: 'My Bookings', icon: CalendarCheck },
                { id: 'itineraries', label: 'Saved Itineraries', icon: Compass },
                { id: 'budget', label: 'Budget & Splits', icon: Wallet },
                { id: 'favorites', label: 'Saved Places', icon: Bookmark },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: Bell },
                { id: 'profile', label: 'Profile & Photo', icon: User },
              ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName: pName || userProfile?.displayName || 'Traveler',
      photoURL: pPhotoURL.trim(),
      phone: pPhone,
      city: pCity,
      bio: pBio,
      emergencyContacts: contacts,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleAddContact = () => {
    if (!newCName.trim() || !newCPhone.trim()) return;
    setContacts((prev) => [
      ...prev.slice(0, 4),
      { name: newCName.trim(), relation: newCRel.trim() || 'Family', phone: newCPhone.trim() },
    ]);
    setNewCName('');
    setNewCRel('');
    setNewCPhone('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    try {
      await submitReview({
        bookingId: reviewTarget.id,
        targetType:
          reviewTarget.bookingType === 'custom_trip'
            ? 'guide'
            : reviewTarget.bookingType,
        targetId:
          reviewTarget.bookingType === 'custom_trip'
            ? reviewTarget.providerId
            : reviewTarget.itemId,
        targetName: reviewTarget.itemTitle,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewMsg('Verified review published!');
      setReviewComment('');
      setTimeout(() => {
        setReviewTarget(null);
        setReviewMsg('');
      }, 1000);
    } catch (err) {
      setReviewMsg(err instanceof Error ? err.message : 'Unable to submit review.');
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 space-y-4 no-print">
          <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-3">
            {(userProfile?.photoURL || firebaseUser.photoURL) && !avatarFailed ? (
              <img
                src={userProfile?.photoURL || firebaseUser.photoURL || ''}
                alt={userProfile?.displayName || firebaseUser.displayName || 'User'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-10 h-10 rounded-full object-cover border border-[#0D5EFF]/25 shrink-0"
              />
            ) : (
              <span className="w-10 h-10 rounded-full bg-[#0D5EFF] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(userProfile?.displayName || firebaseUser.displayName || 'User')}
              </span>
            )}
            <div className="min-w-0">
              <div className="font-display font-bold text-base text-[#0F172A] truncate">
                {userProfile?.displayName || firebaseUser.displayName}
              </div>
              <div className="text-xs text-[#0B57D0] font-medium mt-0.5 capitalize">
                {(userProfile?.role || 'tourist').replace('_', ' ')} ·{' '}
                {userProfile?.verificationStatus || 'active'}
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0D5EFF] text-white'
                      : 'text-[#0F172A]/75 hover:bg-[#EEF4FF]/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Viewport */}
        <main className="lg:col-span-9 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                    Welcome back, {userProfile?.displayName || firebaseUser.displayName}
                  </h1>
                  <p className="text-sm text-[#0F172A]/70 mt-1">
                    {isGuide
                      ? 'Post and edit tour packages, accept or reject tourist booking requests, and book hotels & 4x4s for your tours.'
                      : isHotelOwner
                        ? 'Manage your hotel listings, room inventory, and guest booking requests.'
                        : isVehicleOwner
                          ? 'Manage your rental fleet, daily rates, and incoming vehicle charter requests.'
                          : isAdmin
                            ? 'Monitor platform safety, verify partner credentials, and publish travel advisories.'
                            : 'Plan AI trips, book verified packages, hotels, and vehicles, and track your PKR travel budget.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isGuide ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab('provider')}
                        className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Manage Packages &amp; Requests
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenMarketplaceTab ? onOpenMarketplaceTab('hotels') : onNavigatePublic('packages')
                        }
                        className="px-4 py-2 border border-[#0D5EFF]/30 text-[#0D5EFF] bg-[#EEF4FF] text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Book Hotels
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenMarketplaceTab ? onOpenMarketplaceTab('vehicles') : onNavigatePublic('packages')
                        }
                        className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Book Cars &amp; 4x4s
                      </button>
                    </>
                  ) : isHotelOwner || isVehicleOwner ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab('provider')}
                        className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {isHotelOwner ? 'Open Hotels & Reservations' : 'Open Fleet & Rentals'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('messages')}
                        className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Messages
                      </button>
                    </>
                  ) : isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab('admin')}
                        className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Open Admin Console
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigatePublic('safety')}
                        className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Emergency Center
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigatePublic('ai-planner')}
                        className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Plan New AI Trip
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenMarketplaceTab ? onOpenMarketplaceTab('packages') : onNavigatePublic('packages')
                        }
                        className="px-4 py-2 border border-[#0D5EFF]/30 text-[#0D5EFF] bg-[#EEF4FF] text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Browse Packages
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigatePublic('safety')}
                        className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Emergency Center
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isGuide ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Published Packages</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {myPackages.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Tourist Requests</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {incomingBookings.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">My Hotel &amp; Car Bookings</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {myBookings.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Confirmed Earnings</div>
                    <div className="font-mono text-xl font-bold text-[#0B57D0] tabular-nums mt-1">
                      {formatPkr(providerConfirmedRevenue)}
                    </div>
                  </div>
                </div>
              ) : isHotelOwner ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">My Hotels</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {myHotels.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Room Categories</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {myRoomCount}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Guest Bookings</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {incomingBookings.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Confirmed Revenue</div>
                    <div className="font-mono text-xl font-bold text-[#0B57D0] tabular-nums mt-1">
                      {formatPkr(providerConfirmedRevenue)}
                    </div>
                  </div>
                </div>
              ) : isVehicleOwner ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">My Fleet</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {myVehicles.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Available Vehicles</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {availableVehiclesCount}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Rental Requests</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {incomingBookings.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Confirmed Revenue</div>
                    <div className="font-mono text-xl font-bold text-[#0B57D0] tabular-nums mt-1">
                      {formatPkr(providerConfirmedRevenue)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">My Bookings</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {myBookings.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Saved Itineraries</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {itineraries.length}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Logged Expenses</div>
                    <div className="font-mono text-xl font-bold text-[#0B57D0] tabular-nums mt-1">
                      {formatPkr(totalSpent)}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-[#0F172A]/60">Saved Destinations</div>
                    <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
                      {favorites.length}
                    </div>
                  </div>
                </div>
              )}

              {isProvider && (
                <div className="bg-[#EEF4FF]/60 border border-[#0B57D0]/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-display font-bold text-[#0D5EFF]">
                      {isGuide
                        ? 'Tour Guide Workspace Ready'
                        : isHotelOwner
                          ? 'Hotel Partner Portal Ready'
                          : 'Vehicle Fleet Portal Ready'}
                    </div>
                    <p className="text-xs text-[#0F172A]/75 mt-0.5">
                      {isGuide
                        ? 'Post packages, accept/reject incoming tourist requests, and submit verification credentials.'
                        : 'Manage your listings, incoming customer reservations, and verification documents.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('provider')}
                    className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {isGuide ? 'Open Packages & Requests' : 'Open Provider Operations'}
                  </button>
                </div>
              )}

              {isAdmin && (
                <div className="bg-[#0D5EFF] text-white rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display font-bold">Administrator Console Active</div>
                    <p className="text-xs text-[#EEF4FF]/85 mt-0.5">
                      Review provider verification requests, monitor analytics, and publish advisories.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('admin')}
                    className="px-4 py-2 bg-white text-[#0D5EFF] text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Open Admin Console
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'provider' && isGuide && (
            <GuideDashboardPanel
              onBookHotels={() =>
                onOpenMarketplaceTab ? onOpenMarketplaceTab('hotels') : onNavigatePublic('packages')
              }
              onBookCars={() =>
                onOpenMarketplaceTab ? onOpenMarketplaceTab('vehicles') : onNavigatePublic('packages')
              }
            />
          )}
          {activeTab === 'provider' && isHotelOwner && <HotelDashboardPanel />}
          {activeTab === 'provider' && isVehicleOwner && <VehicleDashboardPanel />}
          {activeTab === 'admin' && isAdmin && <AdminPanel />}
          {activeTab === 'budget' && <BudgetManagerPanel />}
          {activeTab === 'messages' && <MessagesPanel />}

          {activeTab === 'bookings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-[#0F172A]">
                  {isGuide ? 'My Hotel & Car Bookings' : 'My Bookings & Invoices'} ({myBookings.length})
                </h2>
                {isGuide && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenMarketplaceTab ? onOpenMarketplaceTab('hotels') : onNavigatePublic('packages')
                      }
                      className="px-3 py-1.5 bg-[#EEF4FF] text-[#0D5EFF] text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      + Book Hotel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenMarketplaceTab ? onOpenMarketplaceTab('vehicles') : onNavigatePublic('packages')
                      }
                      className="px-3 py-1.5 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      + Book Car
                    </button>
                  </div>
                )}
              </div>
              {myBookings.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#0F172A]/65">
                  {isGuide
                    ? 'No hotel or vehicle reservations yet. Use Book Hotels or Book Cars to reserve logistics for your tours.'
                    : 'No reservations yet. Browse Tour Packages, Hotels, or Vehicles to book.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.map((b) => {
                    const alreadyReviewed = reviews.some((r) => r.bookingId === b.id);
                    return (
                      <div
                        key={b.id}
                        className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs text-[#0B57D0] font-medium uppercase">
                            {b.bookingType.replace('_', ' ')} · {b.status} · Payment: {b.paymentStatus}
                          </div>
                          <div className="font-display font-bold text-base text-[#0F172A]">
                            {b.itemTitle}
                          </div>
                          <div className="text-xs text-[#0F172A]/65 mt-0.5">
                            Provider: {b.providerName} · {b.startDate} to {b.endDate} · {b.guests} guests ·{' '}
                            <span className="font-mono font-semibold text-[#0D5EFF]">
                              {formatPkr(b.totalPricePkr)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInvoiceBooking(b)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-xs rounded-lg cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Invoice
                          </button>
                          {(b.status === 'confirmed' || b.status === 'completed') && !alreadyReviewed && (
                            <button
                              type="button"
                              onClick={() => setReviewTarget(b)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0B57D0] text-white text-xs rounded-lg cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                              Write Review
                            </button>
                          )}
                          {(b.status === 'pending' || b.status === 'accepted') && (
                            <button
                              type="button"
                              onClick={() => void updateBookingStatus(b, 'cancelled')}
                              className="px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'itineraries' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-[#0F172A]">
                  Saved AI Itineraries ({itineraries.length})
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigatePublic('ai-planner')}
                  className="px-3.5 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Create New Plan
                </button>
              </div>
              {itineraries.length === 0 ? (
                <p className="text-sm text-[#0F172A]/65">
                  No saved itineraries yet. Generate and save a custom plan in the AI Trip Planner.
                </p>
              ) : (
                <div className="space-y-3">
                  {itineraries.map((it) => (
                    <div
                      key={it.id}
                      className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-display font-bold text-base text-[#0F172A]">{it.title}</div>
                        <div className="text-xs text-[#0F172A]/65 font-mono tabular-nums">
                          {it.destination} · {it.startDate} to {it.endDate} · {it.days.length} days · Est.{' '}
                          {formatPkr(it.budgetBreakdown?.totalEstimatedPkr || it.budgetPkr)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigatePublic('ai-planner')}
                          className="px-3 py-1.5 bg-[#EEF4FF] text-[#0D5EFF] text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Open in Planner
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteItinerary(it.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Notifications ({notifications.length})
              </h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-[#0F172A]/65">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`border rounded-xl p-4 flex items-center justify-between gap-3 ${
                      n.read ? 'border-slate-200 bg-white' : 'border-[#0B57D0]/40 bg-[#EEF4FF]/35'
                    }`}
                  >
                    <div>
                      <div className="text-xs uppercase font-mono text-[#0B57D0]">{n.category}</div>
                      <div className="font-semibold text-sm text-[#0F172A]">{n.title}</div>
                      <div className="text-xs text-[#0F172A]/75 mt-0.5">{n.body}</div>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => void markNotificationRead(n.id)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Saved Destinations &amp; Services ({favorites.length})
              </h2>
              {favorites.length === 0 ? (
                <p className="text-sm text-[#0F172A]/65">
                  Bookmark destinations or packages while exploring to find them here.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="border border-slate-200 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs uppercase text-[#0B57D0]">{fav.itemType}</div>
                        <div className="font-bold text-sm text-[#0F172A]">{fav.itemTitle}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigatePublic('destinations')}
                        className="text-xs font-semibold text-[#0D5EFF] hover:underline cursor-pointer"
                      >
                        Explore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                  {pPhotoURL && !avatarFailed ? (
                    <img
                      src={pPhotoURL}
                      alt={pName || 'Profile picture'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0D5EFF]/30"
                    />
                  ) : (
                    <span className="w-16 h-16 rounded-full bg-[#0D5EFF] text-white text-lg font-bold flex items-center justify-center">
                      {getInitials(pName || firebaseUser.displayName || 'User')}
                    </span>
                  )}
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#0F172A]">
                      Account Profile &amp; Photo
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {firebaseUser.email} · Role:{' '}
                      <span className="font-semibold text-[#0D5EFF] capitalize">
                        {role.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                </div>
                {firebaseUser.photoURL && pPhotoURL !== firebaseUser.photoURL && (
                  <button
                    type="button"
                    onClick={() => setPPhotoURL(firebaseUser.photoURL || '')}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#EEF4FF] text-[#0D5EFF] rounded-lg hover:bg-blue-100 cursor-pointer"
                  >
                    Use Google Photo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={pPhotoURL}
                  onChange={(e) => setPPhotoURL(e.target.value)}
                  placeholder="https://... (defaults to your Google account photo)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={pCity}
                    onChange={(e) => setPCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">Bio</label>
                <textarea
                  rows={2}
                  value={pBio}
                  onChange={(e) => setPBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="text-sm font-bold text-[#0F172A]">
                  Trusted Emergency Contacts (up to 5)
                </div>
                {contacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-[#F4F7FC] px-3 py-2 rounded-lg text-xs"
                  >
                    <span>
                      <strong>{c.name}</strong> ({c.relation}) ·{' '}
                      <span className="font-mono">{c.phone}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setContacts((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newCName}
                    onChange={(e) => setNewCName(e.target.value)}
                    placeholder="Contact name"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newCRel}
                    onChange={(e) => setNewCRel(e.target.value)}
                    placeholder="Relation"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="tel"
                    value={newCPhone}
                    onChange={(e) => setNewCPhone(e.target.value)}
                    placeholder="Phone (+92...)"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="px-3 py-2 bg-[#EEF4FF] text-[#0D5EFF] text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Add Contact
                  </button>
                </div>
              </div>

              {profileSaved && (
                <div className="text-xs bg-[#EEF4FF] text-[#0D5EFF] px-3 py-2 rounded-lg">
                  Profile &amp; emergency contacts updated.
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                Save Account Changes
              </button>
            </form>
          )}
        </main>
      </div>

      {/* Printable Invoice Modal */}
      {invoiceBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="font-display text-lg font-bold text-[#0D5EFF]">
                  TravelMate Booking Invoice
                </div>
                <div className="text-xs font-mono text-[#0F172A]/60">ID: {invoiceBooking.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceBooking(null)}
                className="text-xs text-[#0F172A]/60 cursor-pointer no-print"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#0F172A]/65">Service</span>
                <span className="font-semibold">{invoiceBooking.itemTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]/65">Tourist</span>
                <span>{invoiceBooking.touristName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]/65">Provider</span>
                <span>{invoiceBooking.providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]/65">Dates</span>
                <span className="font-mono">
                  {invoiceBooking.startDate} to {invoiceBooking.endDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]/65">Payment Method</span>
                <span className="uppercase">{invoiceBooking.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]/65">Payment Status</span>
                <span className="uppercase font-semibold">{invoiceBooking.paymentStatus}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-[#0D5EFF]">
                <span>Total Amount</span>
                <span className="font-mono tabular-nums">
                  {formatPkr(invoiceBooking.totalPricePkr)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer no-print"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Invoice PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Verified Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-display font-bold text-lg text-[#0F172A]">
              Verified Review for {reviewTarget.itemTitle}
            </h3>
            <div>
              <label className="block text-xs font-medium mb-1">Rating (1–5)</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value={5}>5 — Outstanding</option>
                <option value={4}>4 — Very Good</option>
                <option value={3}>3 — Satisfactory</option>
                <option value={2}>2 — Needs Improvement</option>
                <option value={1}>1 — Poor</option>
              </select>
            </div>
            <textarea
              rows={3}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share feedback on punctuality, safety, and hospitality..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            {reviewMsg && <div className="text-xs text-[#0D5EFF]">{reviewMsg}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="px-4 py-2 text-xs border rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Publish Verified Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

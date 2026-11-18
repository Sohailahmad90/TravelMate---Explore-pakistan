import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  ChevronDown,
  Compass,
  LogOut,
  Menu,
  ShieldAlert,
  User,
  Users,
  X,
} from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import type { ServiceTab } from './MarketplaceView';

export type AppRoute =
  | 'home'
  | 'destinations'
  | 'guides'
  | 'packages'
  | 'ai-planner'
  | 'marketplace'
  | 'travel-buddy'
  | 'safety'
  | 'dashboard';

export type AuthModalTab = 'signin' | 'signup';

export type DashboardQuickTab =
  | 'overview'
  | 'provider'
  | 'bookings'
  | 'messages'
  | 'profile'
  | 'admin';

interface NavbarProps {
  currentRoute: AppRoute;
  activeMarketplaceTab?: ServiceTab;
  activeDashboardTab?: string;
  onNavigate: (route: AppRoute) => void;
  onOpenMarketplaceTab: (tab: ServiceTab) => void;
  onOpenDashboardTab: (tab: DashboardQuickTab) => void;
  onOpenAuthModal: (tab?: AuthModalTab) => void;
}

interface RoleNavItem {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getRoleLabel(role?: string, isAdmin?: boolean): string {
  if (isAdmin || role === 'admin') return 'Administrator';
  if (role === 'guide') return 'Tour Guide';
  if (role === 'hotel_owner') return 'Hotel Owner';
  if (role === 'vehicle_owner') return 'Vehicle Owner';
  return 'Tourist';
}

export function Navbar({
  currentRoute,
  activeMarketplaceTab = 'packages',
  activeDashboardTab = 'overview',
  onNavigate,
  onOpenMarketplaceTab,
  onOpenDashboardTab,
  onOpenAuthModal,
}: NavbarProps) {
  const { firebaseUser, userProfile, isAdmin, notifications, signOut } = useTravelMate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const role = userProfile?.role;
  const displayName = userProfile?.displayName || firebaseUser?.displayName || 'TravelMate User';
  const photoUrl = userProfile?.photoURL || firebaseUser?.photoURL || '';
  const roleLabel = getRoleLabel(role, isAdmin);

  useEffect(() => {
    setAvatarFailed(false);
  }, [photoUrl]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Build role-appropriate primary navigation links
  const navItems: RoleNavItem[] = (() => {
    if (firebaseUser && role === 'guide') {
      return [
        {
          id: 'home',
          label: 'Home',
          isActive: currentRoute === 'home',
          onClick: () => onNavigate('home'),
        },
        {
          id: 'destinations',
          label: 'Destinations',
          isActive: currentRoute === 'destinations',
          onClick: () => onNavigate('destinations'),
        },
        {
          id: 'book-hotels',
          label: 'Book Hotels',
          isActive:
            (currentRoute === 'packages' || currentRoute === 'marketplace') &&
            activeMarketplaceTab === 'hotels',
          onClick: () => onOpenMarketplaceTab('hotels'),
        },
        {
          id: 'book-cars',
          label: 'Book Cars',
          isActive:
            (currentRoute === 'packages' || currentRoute === 'marketplace') &&
            activeMarketplaceTab === 'vehicles',
          onClick: () => onOpenMarketplaceTab('vehicles'),
        },
        {
          id: 'guide-studio',
          label: 'Packages & Requests',
          isActive: currentRoute === 'dashboard' && activeDashboardTab !== 'profile',
          onClick: () => onOpenDashboardTab('provider'),
        },
      ];
    }

    if (firebaseUser && role === 'hotel_owner') {
      return [
        {
          id: 'home',
          label: 'Home',
          isActive: currentRoute === 'home',
          onClick: () => onNavigate('home'),
        },
        {
          id: 'destinations',
          label: 'Destinations',
          isActive: currentRoute === 'destinations',
          onClick: () => onNavigate('destinations'),
        },
        {
          id: 'hotel-ops',
          label: 'Hotels & Rooms',
          isActive: currentRoute === 'dashboard' && activeDashboardTab === 'provider',
          onClick: () => onOpenDashboardTab('provider'),
        },
        {
          id: 'hotel-messages',
          label: 'Guest Messages',
          isActive: currentRoute === 'dashboard' && activeDashboardTab === 'messages',
          onClick: () => onOpenDashboardTab('messages'),
        },
        {
          id: 'safety',
          label: 'Safety & Weather',
          isActive: currentRoute === 'safety',
          onClick: () => onNavigate('safety'),
        },
      ];
    }

    if (firebaseUser && role === 'vehicle_owner') {
      return [
        {
          id: 'home',
          label: 'Home',
          isActive: currentRoute === 'home',
          onClick: () => onNavigate('home'),
        },
        {
          id: 'destinations',
          label: 'Destinations',
          isActive: currentRoute === 'destinations',
          onClick: () => onNavigate('destinations'),
        },
        {
          id: 'fleet-ops',
          label: 'Fleet & Rentals',
          isActive: currentRoute === 'dashboard' && activeDashboardTab === 'provider',
          onClick: () => onOpenDashboardTab('provider'),
        },
        {
          id: 'fleet-messages',
          label: 'Messages',
          isActive: currentRoute === 'dashboard' && activeDashboardTab === 'messages',
          onClick: () => onOpenDashboardTab('messages'),
        },
        {
          id: 'safety',
          label: 'Safety & Weather',
          isActive: currentRoute === 'safety',
          onClick: () => onNavigate('safety'),
        },
      ];
    }

    if (firebaseUser && isAdmin) {
      return [
        {
          id: 'home',
          label: 'Home',
          isActive: currentRoute === 'home',
          onClick: () => onNavigate('home'),
        },
        {
          id: 'destinations',
          label: 'Destinations',
          isActive: currentRoute === 'destinations',
          onClick: () => onNavigate('destinations'),
        },
        {
          id: 'guides',
          label: 'Guides',
          isActive: currentRoute === 'guides',
          onClick: () => onNavigate('guides'),
        },
        {
          id: 'packages',
          label: 'Packages',
          isActive: currentRoute === 'packages' || currentRoute === 'marketplace',
          onClick: () => onNavigate('packages'),
        },
        {
          id: 'admin',
          label: 'Admin Console',
          isActive: currentRoute === 'dashboard' && activeDashboardTab === 'admin',
          onClick: () => onOpenDashboardTab('admin'),
        },
      ];
    }

    // Default Guest & Tourist Navigation (Exact 5 requested menus)
    return [
      {
        id: 'home',
        label: 'Home',
        isActive: currentRoute === 'home',
        onClick: () => onNavigate('home'),
      },
      {
        id: 'destinations',
        label: 'Destinations',
        isActive: currentRoute === 'destinations',
        onClick: () => onNavigate('destinations'),
      },
      {
        id: 'guides',
        label: 'Guides',
        isActive: currentRoute === 'guides',
        onClick: () => onNavigate('guides'),
      },
      {
        id: 'packages',
        label: 'Packages',
        isActive: currentRoute === 'packages' || currentRoute === 'marketplace',
        onClick: () => onNavigate('packages'),
      },
      {
        id: 'ai-planner',
        label: 'Trip Planner',
        isActive: currentRoute === 'ai-planner',
        onClick: () => onNavigate('ai-planner'),
      },
    ];
  })();

  const workspaceLabel =
    role === 'guide'
      ? 'Guide Studio'
      : role === 'hotel_owner'
        ? 'Hotel Portal'
        : role === 'vehicle_owner'
          ? 'Fleet Portal'
          : isAdmin
            ? 'Admin Console'
            : 'My Dashboard';

  const workspaceDefaultTab: DashboardQuickTab =
    role === 'guide' || role === 'hotel_owner' || role === 'vehicle_owner'
      ? 'provider'
      : isAdmin
        ? 'admin'
        : 'overview';

  return (
    <div className="sticky top-0 z-40 no-print">
      {/* Slim Cobalt Blue Utility Strip */}
      <div className="hidden md:block bg-[#0B57D0] text-white text-xs">
        <div className="max-w-[1440px] mx-auto px-6 h-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-white/90">
            <span>Verified Pakistan Guides</span>
            <span>Transparent PKR Budgeting</span>
            <span>Real-Time Mountain Weather</span>
          </div>
          <div className="flex items-center gap-5">
            {(!firebaseUser || role === 'tourist' || isAdmin) && (
              <button
                type="button"
                onClick={() => onNavigate('travel-buddy')}
                className={`inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
                  currentRoute === 'travel-buddy'
                    ? 'font-semibold underline underline-offset-4'
                    : 'text-white/90'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Travel Buddy</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('safety')}
              className={`inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
                currentRoute === 'safety'
                  ? 'font-semibold underline underline-offset-4'
                  : 'text-white/90'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Safety &amp; Weather</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main White Navigation Bar */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-[#0A2351] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0D5EFF] rounded"
          >
            <Compass className="w-5 h-5 text-[#0D5EFF]" />
            <span>
              Travel<span className="text-[#0D5EFF]">Mate</span>
            </span>
          </button>

          {/* Zone 2: Role-Aware Navigation Links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  item.isActive
                    ? 'text-[#0D5EFF] font-semibold'
                    : 'text-slate-700 hover:text-[#0D5EFF]'
                }`}
              >
                {item.label}
                {item.isActive && (
                  <span className="absolute left-0 right-0 -bottom-[21px] h-0.5 bg-[#0D5EFF]" />
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Sign In/Sign Up Tabs OR Logged-In Profile Pic + Account Menu */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {firebaseUser ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-slate-200 bg-[#F4F7FC] hover:border-[#0D5EFF]/40 hover:bg-[#EEF4FF] transition-colors cursor-pointer"
                  aria-expanded={profileMenuOpen}
                  aria-label="Open profile menu"
                >
                  {photoUrl && !avatarFailed ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="w-8 h-8 rounded-full object-cover border border-[#0D5EFF]/25"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-[#0D5EFF] text-white text-xs font-bold flex items-center justify-center">
                      {getInitials(displayName)}
                    </span>
                  )}

                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-[#0F172A] max-w-[130px] truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] font-medium text-[#0D5EFF]">{roleLabel}</div>
                  </div>

                  {unreadCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FF6B2C] text-white rounded-full tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-4 bg-[#F4F7FC] border-b border-slate-200 flex items-center gap-3">
                      {photoUrl && !avatarFailed ? (
                        <img
                          src={photoUrl}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarFailed(true)}
                          className="w-11 h-11 rounded-full object-cover border border-[#0D5EFF]/25 shrink-0"
                        />
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-[#0D5EFF] text-white text-sm font-bold flex items-center justify-center shrink-0">
                          {getInitials(displayName)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="font-display font-bold text-sm text-[#0F172A] truncate">
                          {displayName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{firebaseUser.email}</div>
                        <div className="text-[11px] font-semibold text-[#0D5EFF] mt-0.5">
                          {roleLabel} · {userProfile?.verificationStatus || 'active'}
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenDashboardTab('profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#EEF4FF] hover:text-[#0D5EFF] rounded-xl transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>View &amp; Edit Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenDashboardTab(workspaceDefaultTab);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#EEF4FF] hover:text-[#0D5EFF] rounded-xl transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>{workspaceLabel}</span>
                      </button>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onOpenDashboardTab('overview');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#EEF4FF] hover:text-[#0D5EFF] rounded-xl transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Bell className="w-4 h-4" />
                            <span>Notifications</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-[#FF6B2C] tabular-nums">
                            {unreadCount}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          void signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center p-1 bg-[#F4F7FC] border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signin')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-[#0D5EFF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup')}
                  className="px-3.5 py-1.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 text-slate-800 rounded-lg hover:bg-[#EEF4FF]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-1.5">
            {firebaseUser && (
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-200">
                {photoUrl && !avatarFailed ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-10 h-10 rounded-full object-cover border border-[#0D5EFF]/25"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-[#0D5EFF] text-white text-xs font-bold flex items-center justify-center">
                    {getInitials(displayName)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#0F172A] truncate">{displayName}</div>
                  <div className="text-xs text-[#0D5EFF] font-medium">{roleLabel}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenDashboardTab('profile');
                    setMobileOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#EEF4FF] text-[#0D5EFF] rounded-lg"
                >
                  Edit Profile
                </button>
              </div>
            )}

            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onClick();
                  setMobileOpen(false);
                }}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  item.isActive
                    ? 'bg-[#EEF4FF] text-[#0D5EFF] font-semibold'
                    : 'text-slate-700 hover:bg-[#F4F7FC]'
                }`}
              >
                {item.label}
              </button>
            ))}

            {(!firebaseUser || role === 'tourist' || isAdmin) && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('travel-buddy');
                  setMobileOpen(false);
                }}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentRoute === 'travel-buddy'
                    ? 'bg-[#EEF4FF] text-[#0D5EFF] font-semibold'
                    : 'text-slate-700 hover:bg-[#F4F7FC]'
                }`}
              >
                Travel Buddy
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onNavigate('safety');
                setMobileOpen(false);
              }}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentRoute === 'safety'
                  ? 'bg-[#EEF4FF] text-[#0D5EFF] font-semibold'
                  : 'text-slate-700 hover:bg-[#F4F7FC]'
              }`}
            >
              Safety &amp; Weather
            </button>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              {firebaseUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDashboardTab(workspaceDefaultTab);
                      setMobileOpen(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg"
                  >
                    {workspaceLabel} {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void signOut();
                      setMobileOpen(false);
                    }}
                    className="px-3 py-2.5 border border-slate-200 text-sm rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuthModal('signin');
                      setMobileOpen(false);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-800 text-sm font-semibold rounded-lg"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuthModal('signup');
                      setMobileOpen(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

import React from 'react';
import { Bell, Compass, LogOut, Menu, ShieldAlert, Users, X } from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';

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

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenAuthModal: (tab?: AuthModalTab) => void;
}

const NAV_ITEMS: Array<{ id: AppRoute; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'destinations', label: 'Destinations' },
  { id: 'guides', label: 'Guides' },
  { id: 'packages', label: 'Packages' },
  { id: 'ai-planner', label: 'Trip Planner' },
];

export function Navbar({ currentRoute, onNavigate, onOpenAuthModal }: NavbarProps) {
  const { firebaseUser, userProfile, notifications, signOut } = useTravelMate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="sticky top-0 z-40 no-print">
      {/* Slim Cobalt Blue Utility Strip (desktop only to honor mobile sticky cap) */}
      <div className="hidden md:block bg-[#0B57D0] text-white text-xs">
        <div className="max-w-[1440px] mx-auto px-6 h-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-white/90">
            <span>Verified Pakistan Guides</span>
            <span>Transparent PKR Budgeting</span>
            <span>Real-Time Mountain Weather</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onNavigate('travel-buddy')}
              className={`inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
                currentRoute === 'travel-buddy' ? 'font-semibold underline underline-offset-4' : 'text-white/90'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Travel Buddy</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('safety')}
              className={`inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
                currentRoute === 'safety' ? 'font-semibold underline underline-offset-4' : 'text-white/90'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Safety &amp; Weather</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main White Navigation Bar (Strict 3-Zone Contract) */}
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

          {/* Zone 2: Exact 5 single-line nav links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const active =
                currentRoute === item.id ||
                (item.id === 'packages' && currentRoute === 'marketplace');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'text-[#0D5EFF] font-semibold'
                      : 'text-slate-700 hover:text-[#0D5EFF]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-[21px] h-0.5 bg-[#0D5EFF]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Sign In / Sign Up Tabs or Dashboard */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {firebaseUser ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{userProfile ? 'Dashboard' : 'Complete Setup'}</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-[#EEF4FF]">
                      <Bell className="w-3.5 h-3.5" />
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-2 text-slate-500 hover:text-[#0D5EFF] rounded-lg hover:bg-[#EEF4FF] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
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
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentRoute === item.id
                    ? 'bg-[#EEF4FF] text-[#0D5EFF] font-semibold'
                    : 'text-slate-700 hover:bg-[#F4F7FC]'
                }`}
              >
                {item.label}
              </button>
            ))}
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
                      onNavigate('dashboard');
                      setMobileOpen(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg"
                  >
                    Dashboard {unreadCount > 0 ? `(${unreadCount})` : ''}
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

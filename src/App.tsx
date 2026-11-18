import React, { useState } from 'react';
import { Compass, ShieldCheck, UserCheck, X } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TravelMateProvider, useTravelMate } from './context/TravelMateContext';
import { Navbar, type AppRoute, type AuthModalTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeView } from './components/HomeView';
import { DestinationsView } from './components/DestinationsView';
import { AiPlannerView } from './components/AiPlannerView';
import { MarketplaceView } from './components/MarketplaceView';
import { TravelBuddyView } from './components/TravelBuddyView';
import { SafetyWeatherView } from './components/SafetyWeatherView';
import { DashboardView } from './components/DashboardView';
import type { UserRole } from './types/travelmate';

function TravelMateShell() {
  const { signIn, setPendingSignupDraft, firebaseUser } = useTravelMate();
  const [route, setRoute] = useState<AppRoute>('home');
  const [plannerDestination, setPlannerDestination] = useState<string>('Hunza Valley');
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'overview' | 'messages'>('overview');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthModalTab>('signin');
  const [signupRole, setSignupRole] = useState<Exclude<UserRole, 'admin'>>('tourist');
  const [signupName, setSignupName] = useState('');
  const [signupCity, setSignupCity] = useState('Islamabad');
  const [showOtherPartnerRoles, setShowOtherPartnerRoles] = useState(false);
  const [authError, setAuthError] = useState('');

  const navigateTo = (next: AppRoute) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuthModal = (tab: AuthModalTab = 'signin') => {
    setAuthTab(tab);
    setAuthError('');
    setAuthModalOpen(true);
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      setPendingSignupDraft(null);
      await signIn();
      setAuthModalOpen(false);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
    }
  };

  const handleGoogleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      setPendingSignupDraft({
        role: signupRole,
        displayName: signupName.trim() || undefined,
        city: signupCity.trim() || 'Islamabad',
      });
      await signIn();
      setAuthModalOpen(false);
    } catch (err) {
      setPendingSignupDraft(null);
      setAuthError(err instanceof Error ? err.message : 'Unable to complete sign up with Google.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FC] text-[#0F172A]">
      <Navbar
        currentRoute={route}
        onNavigate={(r) => {
          setDashboardInitialTab('overview');
          navigateTo(r);
        }}
        onOpenAuthModal={openAuthModal}
      />

      <div className="flex-1">
        {route === 'home' && (
          <HomeView
            onNavigate={navigateTo}
            onSelectDestinationForPlanner={(destName) => {
              setPlannerDestination(destName);
              navigateTo('ai-planner');
            }}
            onSelectDestinationDetail={(destId) => {
              setSelectedDestId(destId);
              navigateTo('destinations');
            }}
            onOpenAuthModal={openAuthModal}
          />
        )}

        {route === 'destinations' && (
          <DestinationsView
            initialSelectedId={selectedDestId}
            onPlanTripForDestination={(destName) => {
              setPlannerDestination(destName);
              navigateTo('ai-planner');
            }}
            onBookService={() => navigateTo('packages')}
          />
        )}

        {route === 'ai-planner' && (
          <AiPlannerView
            initialDestination={plannerDestination}
            onRequireSignIn={() => openAuthModal('signin')}
            onNavigateDashboard={() => {
              setDashboardInitialTab('overview');
              navigateTo('dashboard');
            }}
          />
        )}

        {(route === 'guides' || route === 'packages' || route === 'marketplace') && (
          <MarketplaceView
            initialTab={route === 'guides' ? 'guides' : 'packages'}
            onRequireSignIn={() => openAuthModal('signin')}
            onOpenMessages={() => {
              setDashboardInitialTab('messages');
              navigateTo('dashboard');
            }}
          />
        )}

        {route === 'travel-buddy' && (
          <TravelBuddyView
            onRequireSignIn={() => openAuthModal('signin')}
            onOpenMessages={() => {
              setDashboardInitialTab('messages');
              navigateTo('dashboard');
            }}
          />
        )}

        {route === 'safety' && (
          <SafetyWeatherView onRequireSignIn={() => openAuthModal('signin')} />
        )}

        {route === 'dashboard' && (
          <DashboardView
            key={dashboardInitialTab}
            initialTab={dashboardInitialTab}
            onNavigatePublic={navigateTo}
          />
        )}
      </div>

      <Footer onNavigate={navigateTo} />
      <OnboardingModal />

      {/* Auth Modal with Sign In & Sign Up Tabs + Tourist vs Guide Selection */}
      {authModalOpen && !firebaseUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Top Tabs */}
            <div className="px-6 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between bg-[#F4F7FC]">
              <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setAuthError('');
                  }}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    authTab === 'signin'
                      ? 'bg-[#0D5EFF] text-white'
                      : 'text-slate-600 hover:text-[#0D5EFF]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setAuthError('');
                  }}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    authTab === 'signup'
                      ? 'bg-[#0D5EFF] text-white'
                      : 'text-slate-600 hover:text-[#0D5EFF]'
                  }`}
                >
                  Sign Up
                </button>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authTab === 'signin' ? (
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0F172A]">
                    Welcome back to TravelMate
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Sign in with your Google account to view bookings, saved AI itineraries, or
                    manage your guide/service operations.
                  </p>
                </div>

                <div className="bg-[#EEF4FF] border border-[#0D5EFF]/15 rounded-xl p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#0D5EFF] shrink-0 mt-0.5" />
                  <span>
                    New to TravelMate? Switch to the <strong>Sign Up</strong> tab to register as a
                    Tourist or Guide.
                  </span>
                </div>

                {authError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                    {authError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  className="w-full py-3 bg-[#0D5EFF] text-white text-sm font-semibold rounded-xl hover:bg-[#0948CC] transition-colors cursor-pointer"
                >
                  Sign In with Google
                </button>
              </div>
            ) : (
              <form onSubmit={handleGoogleSignUp} className="p-6 space-y-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0F172A]">
                    Create your TravelMate account
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Are you joining TravelMate as a <strong>Tourist</strong> or a{' '}
                    <strong>Guide</strong>?
                  </p>
                </div>

                {/* Primary Tourist vs Guide Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSignupRole('tourist')}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      signupRole === 'tourist'
                        ? 'border-[#0D5EFF] bg-[#EEF4FF]'
                        : 'border-slate-200 hover:border-[#0D5EFF]/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Compass
                        className={`w-4 h-4 ${
                          signupRole === 'tourist' ? 'text-[#0D5EFF]' : 'text-slate-500'
                        }`}
                      />
                      <span className="font-bold text-sm text-[#0F172A]">I am a Tourist</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Plan AI trips, book packages &amp; guides, and track PKR budgets.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('guide')}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      signupRole === 'guide'
                        ? 'border-[#0D5EFF] bg-[#EEF4FF]'
                        : 'border-slate-200 hover:border-[#0D5EFF]/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck
                        className={`w-4 h-4 ${
                          signupRole === 'guide' ? 'text-[#0D5EFF]' : 'text-slate-500'
                        }`}
                      />
                      <span className="font-bold text-sm text-[#0F172A]">I am a Guide</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Publish tour packages, accept trip requests, and earn verified trust.
                    </p>
                  </button>
                </div>

                {/* Optional Hotel / Vehicle Partner Switch */}
                <div className="text-xs">
                  <button
                    type="button"
                    onClick={() => setShowOtherPartnerRoles((v) => !v)}
                    className="text-[#0D5EFF] font-medium hover:underline cursor-pointer"
                  >
                    {showOtherPartnerRoles
                      ? 'Hide hotel & vehicle partner options'
                      : 'Signing up as a Hotel Owner or Vehicle Rental Partner?'}
                  </button>
                  {showOtherPartnerRoles && (
                    <div className="grid grid-cols-2 gap-2.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setSignupRole('hotel_owner')}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                          signupRole === 'hotel_owner'
                            ? 'border-[#0D5EFF] bg-[#EEF4FF] text-[#0D5EFF]'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        Hotel Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupRole('vehicle_owner')}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                          signupRole === 'vehicle_owner'
                            ? 'border-[#0D5EFF] bg-[#EEF4FF] text-[#0D5EFF]'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        Vehicle Owner
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Optional (defaults to Google name)"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      City / Base
                    </label>
                    <input
                      type="text"
                      value={signupCity}
                      onChange={(e) => setSignupCity(e.target.value)}
                      placeholder="Islamabad, Gilgit, Lahore..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0D5EFF] text-white text-sm font-semibold rounded-xl hover:bg-[#0948CC] transition-colors cursor-pointer"
                >
                  {signupRole === 'guide'
                    ? 'Sign Up as Guide with Google'
                    : signupRole === 'hotel_owner'
                      ? 'Sign Up as Hotel Owner with Google'
                      : signupRole === 'vehicle_owner'
                        ? 'Sign Up as Vehicle Owner with Google'
                        : 'Sign Up as Tourist with Google'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TravelMateProvider>
        <TravelMateShell />
      </TravelMateProvider>
    </ErrorBoundary>
  );
}

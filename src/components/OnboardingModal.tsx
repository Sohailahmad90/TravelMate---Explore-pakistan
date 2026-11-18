import React, { useState } from 'react';
import { Compass, Building2, Car, UserCheck } from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import type { UserRole } from '../types/travelmate';

const ROLE_OPTIONS: Array<{
  id: Exclude<UserRole, 'admin'>;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'tourist',
    title: 'Tourist / Traveler',
    desc: 'Plan AI trips, book packages & guides, find travel buddies, and track PKR expenses.',
    icon: Compass,
  },
  {
    id: 'guide',
    title: 'Tour Guide',
    desc: 'Publish tour packages, accept custom trip requests, and build verified trust.',
    icon: UserCheck,
  },
  {
    id: 'hotel_owner',
    title: 'Hotel Owner',
    desc: 'List mountain lodges, configure room inventory, and manage guest reservations.',
    icon: Building2,
  },
  {
    id: 'vehicle_owner',
    title: 'Vehicle Owner',
    desc: 'Offer 4x4 SUVs, Hiace vans, and sedans with conflict-free rental scheduling.',
    icon: Car,
  },
];

export function OnboardingModal() {
  const { firebaseUser, needsOnboarding, completeOnboarding } = useTravelMate();
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('tourist');
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Islamabad');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!needsOnboarding || !firebaseUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await completeOnboarding({
        role,
        displayName: displayName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        bio: bio.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-200 bg-[#F4F7FC]">
          <h2 className="font-display text-xl font-bold text-[#0F172A]">
            Are you joining as a Tourist or a Guide?
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Signed in as {firebaseUser.email}. Choose your account type to complete TravelMate registration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2.5">
              Select account type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRole(opt.id)}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'border-[#0D5EFF] bg-[#EEF4FF]'
                        : 'border-slate-200 hover:border-[#0D5EFF]/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#0D5EFF]' : 'text-slate-500'}`} />
                      <span className="font-semibold text-sm text-[#0F172A]">{opt.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name or Business Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Ayesha Khan"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#0D5EFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number (Private)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#0D5EFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Home City / Primary Operating Base
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Islamabad, Gilgit, Skardu, Lahore..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#0D5EFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Short Bio / Travel Preferences
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell travelers or guides a bit about your travel style or services..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#0D5EFF]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3.5 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

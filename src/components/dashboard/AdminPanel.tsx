import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useTravelMate } from '../../context/TravelMateContext';
import { formatPkr } from '../../lib/formatters';
import type { TravelAdvisory } from '../../types/travelmate';

export function AdminPanel() {
  const {
    allUsers,
    publicProfiles,
    bookings,
    destinations,
    tourPackages,
    hotels,
    vehicles,
    localExperiences,
    verificationRequests,
    reviews,
    emergencyEvents,
    decideVerificationRequest,
    toggleUserAccountStatus,
    moderateLocalExperience,
    moderateReview,
    publishAdvisory,
    updateEmergencyStatus,
    syncCatalogToFirestore,
  } = useTravelMate();

  const [roleFilter, setRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});
  const [syncMsg, setSyncMsg] = useState('');

  // Official Advisory form
  const [advTitle, setAdvTitle] = useState('');
  const [advDest, setAdvDest] = useState('Hunza Valley');
  const [advCat, setAdvCat] = useState<TravelAdvisory['category']>('Official restriction');
  const [advSeverity, setAdvSeverity] = useState<TravelAdvisory['severity']>('high');
  const [advDesc, setAdvDesc] = useState('');
  const [advSource, setAdvSource] = useState('NHA & Gilgit-Baltistan Tourism Directorate');

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length;
    const revenue = bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((s, b) => s + b.totalPricePkr, 0);
    return { totalBookings, completed, pending, cancelled, revenue };
  }, [bookings]);

  const roleCounts = useMemo(() => {
    const counts = { tourist: 0, guide: 0, hotel_owner: 0, vehicle_owner: 0, admin: 0 };
    allUsers.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [allUsers]);

  const filteredUsers = allUsers.filter((u) => {
    const rOk = roleFilter === 'all' || u.role === roleFilter;
    const q = userSearch.trim().toLowerCase();
    const qOk =
      !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return rOk && qOk;
  });

  const handlePublishOfficialAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    await publishAdvisory({
      title: advTitle,
      destination: advDest,
      category: advCat,
      severity: advSeverity,
      description: advDesc,
      sourceType: 'official',
      verificationSource: advSource,
      status: 'active',
      expiresAt: '2027-06-30',
    });
    setAdvTitle('');
    setAdvDesc('');
    setSyncMsg('Official travel advisory published to Safety Center.');
  };

  const handleSyncCatalog = async () => {
    await syncCatalogToFirestore();
    setSyncMsg('All 14 Pakistan destinations synced to Firestore catalog.');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F172A]">
            Platform Administration &amp; Analytics
          </h2>
          <p className="text-sm text-[#0F172A]/70 mt-1">
            Database-driven metrics, provider verification queue, user moderation, and official advisories.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSyncCatalog()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
        >
          <Database className="w-4 h-4" />
          <span>Sync 14 Destinations to Firestore</span>
        </button>
      </div>

      {syncMsg && (
        <div className="bg-[#EEF4FF] border border-[#0B57D0]/30 text-[#0D5EFF] px-4 py-2.5 rounded-xl text-xs font-medium">
          {syncMsg}
        </div>
      )}

      {/* Analytics KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-[#0F172A]/60">Registered Accounts</div>
          <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
            {allUsers.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-[#0F172A]/60">Service Providers</div>
          <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
            {publicProfiles.filter((p) => p.role !== 'tourist').length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-[#0F172A]/60">Total Reservations</div>
          <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
            {stats.totalBookings}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-[#0F172A]/60">Pending / Completed</div>
          <div className="font-mono text-xl font-bold text-[#0B57D0] tabular-nums mt-1">
            {stats.pending} / {stats.completed}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-[#0F172A]/60">Confirmed Booking Value</div>
          <div className="font-mono text-lg font-bold text-[#0D5EFF] tabular-nums mt-1">
            {formatPkr(stats.revenue)}
          </div>
        </div>
      </div>

      {/* Inventory & Role Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="font-display font-bold text-sm text-[#0F172A]">
            Accounts by Role
          </div>
          <div className="space-y-2 text-xs">
            {(
              [
                ['Tourists', roleCounts.tourist],
                ['Tour Guides', roleCounts.guide],
                ['Hotel Owners', roleCounts.hotel_owner],
                ['Vehicle Owners', roleCounts.vehicle_owner],
                ['Administrators', roleCounts.admin],
              ] as const
            ).map(([label, count]) => {
              const pct = allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between">
                    <span>{label}</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#F4F7FC] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0D5EFF]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="font-display font-bold text-sm text-[#0F172A]">
            Active Platform Catalog
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F4F7FC] p-3 rounded-lg">
              <div className="text-[#0F172A]/60">Destinations</div>
              <div className="font-mono text-lg font-bold text-[#0D5EFF] tabular-nums">
                {destinations.length}
              </div>
            </div>
            <div className="bg-[#F4F7FC] p-3 rounded-lg">
              <div className="text-[#0F172A]/60">Tour Packages</div>
              <div className="font-mono text-lg font-bold text-[#0D5EFF] tabular-nums">
                {tourPackages.length}
              </div>
            </div>
            <div className="bg-[#F4F7FC] p-3 rounded-lg">
              <div className="text-[#0F172A]/60">Hotels / Lodges</div>
              <div className="font-mono text-lg font-bold text-[#0D5EFF] tabular-nums">
                {hotels.length}
              </div>
            </div>
            <div className="bg-[#F4F7FC] p-3 rounded-lg">
              <div className="text-[#0F172A]/60">Rental Vehicles</div>
              <div className="font-mono text-lg font-bold text-[#0D5EFF] tabular-nums">
                {vehicles.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0B57D0]" />
          <h3 className="font-display font-bold text-lg text-[#0F172A]">
            Provider Verification Queue ({verificationRequests.length})
          </h3>
        </div>
        {verificationRequests.length === 0 ? (
          <p className="text-xs text-[#0F172A]/65">No verification applications submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {verificationRequests.map((req) => (
              <div
                key={req.id}
                className="border border-slate-200 rounded-xl p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-[#0F172A]">
                      {req.applicantName} · <span className="uppercase">{req.role}</span>
                    </div>
                    <div className="text-xs text-[#0F172A]/65 font-mono">
                      CNIC Ref: {req.cnicReference} · License/Reg: {req.licenseOrRegInfo}
                    </div>
                  </div>
                  <span className="text-xs font-mono uppercase font-semibold text-[#0D5EFF]">
                    {req.status}
                  </span>
                </div>
                {req.description && <p className="text-xs text-[#0F172A]/75">{req.description}</p>}
                {req.status === 'pending' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => void decideVerificationRequest(req, 'approved')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve Provider
                    </button>
                    <input
                      type="text"
                      value={rejectReasonMap[req.id] || ''}
                      onChange={(e) =>
                        setRejectReasonMap((m) => ({ ...m, [req.id]: e.target.value }))
                      }
                      placeholder="Rejection reason (if declining)"
                      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg flex-1 min-w-[180px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void decideVerificationRequest(req, 'rejected', rejectReasonMap[req.id])
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Administration */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0D5EFF]" />
            <h3 className="font-display font-bold text-lg text-[#0F172A]">User Management</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search name or email..."
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="tourist">Tourist</option>
              <option value="guide">Tour Guide</option>
              <option value="hotel_owner">Hotel Owner</option>
              <option value="vehicle_owner">Vehicle Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F4F7FC] text-[#0F172A]/65">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Verification</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((u) => (
                <tr key={u.uid}>
                  <td className="px-4 py-2.5 font-semibold text-[#0F172A]">{u.displayName}</td>
                  <td className="px-4 py-2.5 text-[#0F172A]/70">{u.email}</td>
                  <td className="px-4 py-2.5 uppercase font-mono">{u.role}</td>
                  <td className="px-4 py-2.5 uppercase font-mono">{u.verificationStatus}</td>
                  <td className="px-4 py-2.5 uppercase font-mono">{u.accountStatus}</td>
                  <td className="px-4 py-2.5 text-right">
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => void toggleUserAccountStatus(u)}
                        className="px-2.5 py-1 border border-slate-200 rounded hover:bg-[#F4F7FC] cursor-pointer"
                      >
                        {u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publish Official Advisory + Emergency SOS Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handlePublishOfficialAdvisory}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
        >
          <div className="flex items-center gap-2 text-[#0D5EFF]">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-display font-bold text-base">Publish Official Travel Advisory</h3>
          </div>
          <input
            type="text"
            required
            value={advTitle}
            onChange={(e) => setAdvTitle(e.target.value)}
            placeholder="Advisory Title"
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
              value={advCat}
              onChange={(e) => setAdvCat(e.target.value as TravelAdvisory['category'])}
              className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
            >
              <option>Road closure</option>
              <option>Landslide warning</option>
              <option>Flood alert</option>
              <option>Snowfall warning</option>
              <option>Severe weather</option>
              <option>Official restriction</option>
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
          <input
            type="text"
            required
            value={advSource}
            onChange={(e) => setAdvSource(e.target.value)}
            placeholder="Verification source (NHA / NDMA)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <textarea
            rows={2}
            required
            value={advDesc}
            onChange={(e) => setAdvDesc(e.target.value)}
            placeholder="Official guidance and affected sectors..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Publish Official Advisory
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-[#0F172A]">
            Emergency SOS Monitor ({emergencyEvents.length})
          </h3>
          {emergencyEvents.length === 0 ? (
            <p className="text-xs text-[#0F172A]/65">No active SOS events.</p>
          ) : (
            <div className="space-y-2.5">
              {emergencyEvents.map((ev) => (
                <div key={ev.id} className="border border-red-200 bg-red-50/40 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-[#0F172A]">
                    <span>{ev.touristName}</span>
                    <span className="uppercase text-red-700">{ev.status}</span>
                  </div>
                  <div>{ev.locationLabel}</div>
                  <div className="text-[#0F172A]/75">{ev.notes}</div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void updateEmergencyStatus(ev.id, 'acknowledged')}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded cursor-pointer"
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateEmergencyStatus(ev.id, 'resolved')}
                      className="px-2.5 py-1 bg-[#0D5EFF] text-white rounded cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Local Experience Approvals & Review Moderation */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="text-xs font-bold text-[#0F172A]">
              Pending Experience Approvals &amp; Flagged Reviews
            </div>
            {localExperiences
              .filter((e) => e.approvalStatus === 'pending')
              .map((exp) => (
                <div key={exp.id} className="flex items-center justify-between text-xs bg-[#F4F7FC] p-2.5 rounded-lg">
                  <span>
                    {exp.title} ({exp.providerName})
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void moderateLocalExperience(exp.id, 'approved')}
                      className="px-2 py-1 bg-[#0D5EFF] text-white rounded cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void moderateLocalExperience(exp.id, 'rejected')}
                      className="px-2 py-1 bg-red-50 text-red-700 rounded cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            {reviews
              .filter((r) => r.moderationStatus === 'flagged')
              .map((rev) => (
                <div key={rev.id} className="flex items-center justify-between text-xs bg-amber-50 p-2.5 rounded-lg">
                  <span>Flagged review: &ldquo;{rev.comment}&rdquo;</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void moderateReview(rev.id, 'published')}
                      className="px-2 py-1 bg-white border rounded cursor-pointer"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => void moderateReview(rev.id, 'removed')}
                      className="px-2 py-1 bg-red-600 text-white rounded cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

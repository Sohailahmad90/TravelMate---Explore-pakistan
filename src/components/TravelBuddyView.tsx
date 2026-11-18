import React, { useMemo, useState } from 'react';
import { MessageSquare, Plus, Users } from 'lucide-react';
import { useTravelMate } from '../context/TravelMateContext';
import { computeBuddyMatchScore, formatPkr, formatShortDate } from '../lib/formatters';

interface TravelBuddyViewProps {
  onRequireSignIn: () => void;
  onOpenMessages: () => void;
}

const BUDDY_INTERESTS = [
  'Mountains',
  'Lakes',
  'Photography',
  'Hiking and trekking',
  'Cultural experiences',
  'Local cuisine',
  'Adventure tourism',
];

export function TravelBuddyView({ onRequireSignIn, onOpenMessages }: TravelBuddyViewProps) {
  const {
    destinations,
    travelBuddyRequests,
    travelGroups,
    firebaseUser,
    createBuddyRequest,
    createTravelGroup,
    requestJoinGroup,
    startOrOpenConversation,
  } = useTravelMate();

  // Compatibility Criteria
  const [matchDestination, setMatchDestination] = useState('Hunza Valley');
  const [matchStartDate, setMatchStartDate] = useState('2026-12-05');
  const [matchEndDate, setMatchEndDate] = useState('2026-12-10');
  const [matchBudget, setMatchBudget] = useState(42000);
  const [matchInterests, setMatchInterests] = useState<string[]>(['Mountains', 'Photography']);
  const [desiredGroupSize, setDesiredGroupSize] = useState(4);

  // Create Request / Group
  const [tab, setTab] = useState<'requests' | 'groups'>('requests');
  const [notes, setNotes] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupSummary, setGroupSummary] = useState('');
  const [feedback, setFeedback] = useState('');

  const scoredRequests = useMemo(() => {
    return travelBuddyRequests
      .map((req) => ({
        req,
        match: computeBuddyMatchScore(req, {
          destination: matchDestination,
          startDate: matchStartDate,
          endDate: matchEndDate,
          budgetPkr: matchBudget,
          interests: matchInterests,
          desiredGroupSize,
        }),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [
    travelBuddyRequests,
    matchDestination,
    matchStartDate,
    matchEndDate,
    matchBudget,
    matchInterests,
    desiredGroupSize,
  ]);

  const toggleInterest = (item: string) => {
    setMatchInterests((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    await createBuddyRequest({
      destination: matchDestination,
      startDate: matchStartDate,
      endDate: matchEndDate,
      budgetMinPkr: Math.max(5000, matchBudget - 8000),
      budgetMaxPkr: matchBudget + 8000,
      travelersCount: 1,
      desiredGroupSize,
      interests: matchInterests,
      notes,
    });
    setNotes('');
    setFeedback('Travel buddy request published! Personal contact info remains private.');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    if (!groupName.trim()) return;
    await createTravelGroup({
      name: groupName.trim(),
      destination: matchDestination,
      startDate: matchStartDate,
      endDate: matchEndDate,
      itinerarySummary: groupSummary.trim() || `Shared trip to ${matchDestination}`,
      maxMembers: desiredGroupSize,
    });
    setGroupName('');
    setGroupSummary('');
    setFeedback('Travel group created! Other travelers can now request to join.');
  };

  const handleConnectBuddy = async (userId: string, authorName: string, dest: string) => {
    if (!firebaseUser) {
      onRequireSignIn();
      return;
    }
    await startOrOpenConversation(userId, authorName, `Travel Buddy · ${dest}`);
    onOpenMessages();
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0F172A]">
          Intelligent Travel Buddy Matching &amp; Groups
        </h1>
        <p className="text-sm text-[#0F172A]/70 mt-1.5 max-w-2xl">
          Match with fellow Pakistan travelers by corridor, dates, PKR budget, and interests — with
          privacy-first messaging that keeps phone numbers and emails hidden.
        </p>
      </div>

      {feedback && (
        <div className="bg-[#EEF4FF] border border-[#0B57D0]/30 text-[#0D5EFF] px-4 py-3 rounded-xl text-sm">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Compatibility Filter & Publisher */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">
              Your Match Preferences
            </h2>
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">Destination</label>
              <select
                value={matchDestination}
                onChange={(e) => setMatchDestination(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="">Any Destination</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">From</label>
                <input
                  type="date"
                  value={matchStartDate}
                  onChange={(e) => setMatchStartDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">To</label>
                <input
                  type="date"
                  value={matchEndDate}
                  onChange={(e) => setMatchEndDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                  Target Budget (PKR)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={matchBudget}
                  onChange={(e) => setMatchBudget(Number(e.target.value) || 30000)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/80 mb-1">
                  Group Size
                </label>
                <input
                  type="number"
                  min={2}
                  max={15}
                  value={desiredGroupSize}
                  onChange={(e) => setDesiredGroupSize(Number(e.target.value) || 4)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/80 mb-1.5">
                Shared Interests
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BUDDY_INTERESTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                      matchInterests.includes(item)
                        ? 'bg-[#0D5EFF] text-white border-[#0D5EFF]'
                        : 'bg-[#F4F7FC] text-[#0F172A]/75 border-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form
            onSubmit={handlePostRequest}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
          >
            <h3 className="font-display text-base font-bold text-[#0F172A]">
              Publish Travel Buddy Request
            </h3>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share departure city, pace, or vehicle-split preference..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Travel Request</span>
            </button>
          </form>
        </div>

        {/* Right: Compatibility Results & Groups */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('requests')}
              className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
                tab === 'requests'
                  ? 'bg-[#0D5EFF] text-white'
                  : 'bg-white border border-slate-200 text-[#0F172A]/75'
              }`}
            >
              Compatible Travelers ({scoredRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('groups')}
              className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
                tab === 'groups'
                  ? 'bg-[#0D5EFF] text-white'
                  : 'bg-white border border-slate-200 text-[#0F172A]/75'
              }`}
            >
              Travel Groups ({travelGroups.length})
            </button>
          </div>

          {tab === 'requests' ? (
            <div className="space-y-4">
              {scoredRequests.map(({ req, match }) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#0F172A]/60">
                      <span className="font-semibold text-[#0F172A] text-sm">{req.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.destination}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {formatShortDate(req.startDate)} – {formatShortDate(req.endDate)}
                      </span>
                    </div>
                    <p className="text-sm text-[#0F172A]/80">{req.notes}</p>
                    <div className="text-xs text-[#0F172A]/65">
                      Budget: <span className="font-mono tabular-nums">{formatPkr(req.budgetMinPkr)}</span> –{' '}
                      <span className="font-mono tabular-nums">{formatPkr(req.budgetMaxPkr)}</span> · Group
                      size: {req.desiredGroupSize} · Interests: {req.interests.join(', ')}
                    </div>
                    <div className="text-xs text-[#0B57D0] font-medium pt-1">
                      Why matched: {match.reasons.join(' · ')}
                    </div>
                  </div>

                  <div className="sm:w-44 shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                    <div className="text-right">
                      <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums">
                        {match.score}%
                      </div>
                      <div className="text-[11px] text-[#0F172A]/60">Compatibility</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleConnectBuddy(req.userId, req.authorName, req.destination)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateGroup}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="text-sm font-bold text-[#0F172A]">Create a Travel Group</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name (e.g., Dec Karakoram Photo Crew)"
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={groupSummary}
                    onChange={(e) => setGroupSummary(e.target.value)}
                    placeholder="Shared itinerary notes"
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Launch Travel Group</span>
                </button>
              </form>

              {travelGroups.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-[#0F172A]/65">
                  No open travel groups yet. Launch the first group above to coordinate shared trips.
                </div>
              ) : (
                <div className="space-y-3">
                  {travelGroups.map((grp) => (
                    <div
                      key={grp.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs text-[#0B57D0] font-medium">
                          {grp.destination} · {formatShortDate(grp.startDate)} –{' '}
                          {formatShortDate(grp.endDate)} · Max {grp.maxMembers} members
                        </div>
                        <h3 className="font-display font-bold text-[#0F172A] mt-0.5">{grp.name}</h3>
                        <p className="text-xs text-[#0F172A]/70 mt-1">{grp.itinerarySummary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!firebaseUser) {
                            onRequireSignIn();
                            return;
                          }
                          void requestJoinGroup(grp).then(() =>
                            setFeedback(`Join request sent to ${grp.creatorName}.`)
                          );
                        }}
                        className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Request to Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

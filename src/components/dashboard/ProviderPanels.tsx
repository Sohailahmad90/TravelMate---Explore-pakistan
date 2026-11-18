import React, { useState } from 'react';
import { Building2, Car, Check, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useTravelMate } from '../../context/TravelMateContext';
import { formatPkr } from '../../lib/formatters';
import type { TourPackage, UserRole, Vehicle } from '../../types/travelmate';

export function ProviderVerificationCard({ role }: { role: Exclude<UserRole, 'tourist' | 'admin'> }) {
  const { userProfile, verificationRequests, destinations, submitVerificationRequest } = useTravelMate();
  const [cnicReference, setCnicReference] = useState('');
  const [licenseOrRegInfo, setLicenseOrRegInfo] = useState('');
  const [selectedDest, setSelectedDest] = useState('Hunza Valley');
  const [description, setDescription] = useState('');
  const [sent, setSent] = useState(false);

  const myRequests = verificationRequests.filter((v) => v.userId === userProfile?.uid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitVerificationRequest({
      role,
      cnicReference,
      licenseOrRegInfo,
      operatingDestinations: [selectedDest],
      description,
    });
    setSent(true);
    setCnicReference('');
    setLicenseOrRegInfo('');
    setDescription('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0B57D0]" />
          <h3 className="font-display font-bold text-lg text-[#0F172A]">
            Provider Verification Status
          </h3>
        </div>
        <span className="text-xs font-mono uppercase font-semibold text-[#0D5EFF]">
          {userProfile?.verificationStatus || 'unverified'}
        </span>
      </div>

      {myRequests.length > 0 && (
        <div className="bg-[#F4F7FC] rounded-xl p-4 space-y-1 text-xs">
          {myRequests.map((req) => (
            <div key={req.id} className="flex items-center justify-between">
              <span>
                Application ({req.licenseOrRegInfo}) —{' '}
                <strong className="uppercase">{req.status}</strong>
              </span>
              {req.rejectionReason && <span className="text-red-700">{req.rejectionReason}</span>}
            </div>
          ))}
        </div>
      )}

      {userProfile?.verificationStatus !== 'verified' && (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={cnicReference}
              onChange={(e) => setCnicReference(e.target.value)}
              placeholder="CNIC Reference (e.g., 61101-XXXXXXX-1)"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              required
              value={licenseOrRegInfo}
              onChange={(e) => setLicenseOrRegInfo(e.target.value)}
              placeholder="DTS License / Property Reg / Fleet ID"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <select
              value={selectedDest}
              onChange={(e) => setSelectedDest(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your years of experience, certifications, and operating base..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          {sent && (
            <div className="text-xs text-[#0D5EFF] bg-[#EEF4FF] px-3 py-2 rounded-lg">
              Verification application submitted for administrator review.
            </div>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Submit Verification Application
          </button>
        </form>
      )}
    </div>
  );
}

interface GuideDashboardPanelProps {
  onBookHotels?: () => void;
  onBookCars?: () => void;
}

export function GuideDashboardPanel({ onBookHotels, onBookCars }: GuideDashboardPanelProps) {
  const {
    userProfile,
    destinations,
    tourPackages,
    bookings,
    createPackage,
    updatePackage,
    deletePackage,
    updateBookingStatus,
    submitLocalExperience,
  } = useTravelMate();

  const [title, setTitle] = useState('');
  const [destName, setDestName] = useState('Hunza Valley');
  const [price, setPrice] = useState(32000);
  const [days, setDays] = useState(4);
  const [groupSize, setGroupSize] = useState(10);
  const [desc, setDesc] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expPrice, setExpPrice] = useState(3500);

  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDays, setEditDays] = useState(1);

  const myPackages = tourPackages.filter((p) => p.guideId === userProfile?.uid);
  const myBookings = bookings.filter((b) => b.providerId === userProfile?.uid);
  const pendingCount = myBookings.filter((b) => b.status === 'pending').length;
  const earningsPkr = myBookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPricePkr, 0);

  const handleCreatePkg = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPackage({
      title,
      destinationName: destName,
      description: desc || `${days}-day guided tour to ${destName}`,
      pricePerPersonPkr: price,
      durationDays: days,
      maxGroupSize: groupSize,
      departureDate: 'Flexible Weekly',
      included: ['Local guide', 'Route logistics'],
      excluded: ['Personal expenses'],
      dailyItinerary: [`Day 1–${days}: Curated ${destName} exploration`],
      availability: 'available',
    });
    setTitle('');
    setDesc('');
  };

  const startEditPkg = (p: TourPackage) => {
    setEditingPkgId(p.id);
    setEditTitle(p.title);
    setEditPrice(p.pricePerPersonPkr);
    setEditDays(p.durationDays);
  };

  const saveEditPkg = async (pkgId: string) => {
    if (!editTitle.trim()) return;
    await updatePackage(pkgId, {
      title: editTitle.trim(),
      pricePerPersonPkr: Math.max(1000, editPrice),
      durationDays: Math.min(60, Math.max(1, editDays)),
    });
    setEditingPkgId(null);
  };

  const handleSubmitExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;
    await submitLocalExperience({
      category: 'Cultural activities',
      title: expTitle.trim(),
      destinationName: destName,
      description: `Authentic local experience in ${destName}`,
      pricePkr: expPrice,
      durationHours: 3,
      availability: 'available',
    });
    setExpTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Quick Guide Operations Bar */}
      {(onBookHotels || onBookCars) && (
        <div className="bg-gradient-to-r from-[#0A2351] to-[#0D5EFF] text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display font-bold text-lg">Tour Guide Operations</div>
            <p className="text-xs text-blue-100/85 mt-0.5">
              Post &amp; manage your tour packages, accept/reject tourist requests, and reserve hotels or 4x4 vehicles for your groups.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {onBookHotels && (
              <button
                type="button"
                onClick={onBookHotels}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#0A2351] text-xs font-bold rounded-xl hover:bg-[#EEF4FF] cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#0D5EFF]" />
                <span>Book Hotels</span>
              </button>
            )}
            {onBookCars && (
              <button
                type="button"
                onClick={onBookCars}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B2C] text-white text-xs font-bold rounded-xl hover:bg-[#e85d22] cursor-pointer"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Book Cars &amp; 4x4s</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-[#0F172A]/60">My Tour Packages</div>
          <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
            {myPackages.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-[#0F172A]/60">Incoming Requests ({pendingCount} pending)</div>
          <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
            {myBookings.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-[#0F172A]/60">Confirmed Earnings</div>
          <div className="font-mono text-2xl font-bold text-[#0B57D0] tabular-nums mt-1">
            {formatPkr(earningsPkr)}
          </div>
        </div>
      </div>

      <ProviderVerificationCard role="guide" />

      {/* Create Tour Package */}
      <form
        onSubmit={handleCreatePkg}
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
      >
        <h3 className="font-display font-bold text-lg text-[#0F172A]">Create Tour Package</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Package title"
            className="lg:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <select
            value={destName}
            onChange={(e) => setDestName(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="PKR / person"
            className="px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              title="Duration Days"
              className="w-1/2 px-2.5 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
            />
            <input
              type="number"
              min={1}
              max={40}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              title="Max Group Size"
              className="w-1/2 px-2.5 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
            />
          </div>
        </div>
        <textarea
          rows={2}
          required
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Detailed package highlights and itinerary notes..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Publish Package</span>
        </button>
      </form>

      {/* My Packages List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-display font-bold text-base text-[#0F172A]">Managed Packages</h3>
        {myPackages.length === 0 ? (
          <p className="text-xs text-[#0F172A]/65">No packages published under your guide account yet.</p>
        ) : (
          <div className="space-y-2.5">
            {myPackages.map((p) => {
              const isEditing = editingPkgId === p.id;
              return (
                <div
                  key={p.id}
                  className="border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                      <input
                        type="number"
                        min={1000}
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-28 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                      />
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={editDays}
                        onChange={(e) => setEditDays(Number(e.target.value))}
                        className="w-16 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => void saveEditPkg(p.id)}
                        className="px-3 py-1.5 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPkgId(null)}
                        className="px-2.5 py-1.5 border border-slate-200 text-xs rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-semibold text-sm text-[#0F172A]">{p.title}</div>
                        <div className="text-xs text-[#0F172A]/65 font-mono tabular-nums">
                          {p.destinationName} · {p.durationDays} Days · {formatPkr(p.pricePerPersonPkr)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={p.availability}
                          onChange={(e) =>
                            void updatePackage(p.id, {
                              availability: e.target.value as 'available' | 'paused' | 'sold_out',
                            })
                          }
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                        >
                          <option value="available">Available</option>
                          <option value="paused">Paused</option>
                          <option value="sold_out">Sold Out</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => startEditPkg(p)}
                          title="Edit package"
                          className="p-2 text-[#0D5EFF] hover:bg-[#EEF4FF] rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePackage(p.id)}
                          title="Delete package"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Local Experience */}
      <form
        onSubmit={handleSubmitExp}
        className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center gap-3"
      >
        <input
          type="text"
          value={expTitle}
          onChange={(e) => setExpTitle(e.target.value)}
          placeholder="Submit a local cultural experience (requires admin approval)"
          className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-200 rounded-lg"
        />
        <input
          type="number"
          value={expPrice}
          onChange={(e) => setExpPrice(Number(e.target.value))}
          className="w-28 px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#0B57D0] text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Submit Experience
        </button>
      </form>

      {/* Incoming Reservations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-display font-bold text-base text-[#0F172A]">
          Incoming Guide Reservations &amp; Trip Requests
        </h3>
        {myBookings.length === 0 ? (
          <p className="text-xs text-[#0F172A]/65">No incoming requests yet.</p>
        ) : (
          <div className="space-y-3">
            {myBookings.map((b) => (
              <div
                key={b.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-sm text-[#0F172A]">{b.itemTitle}</div>
                  <div className="text-xs text-[#0F172A]/65">
                    Tourist: {b.touristName} · {b.startDate} to {b.endDate} · {b.guests} guests ·{' '}
                    <span className="font-mono font-semibold">{formatPkr(b.totalPricePkr)}</span>
                  </div>
                  <div className="text-xs font-mono uppercase text-[#0D5EFF] mt-1">
                    Status: {b.status} · Payment: {b.paymentStatus}
                  </div>
                </div>
                {['pending', 'accepted', 'confirmed'].includes(b.status) && (
                  <div className="flex flex-wrap gap-2">
                    {b.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => void updateBookingStatus(b, 'accepted')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0D5EFF] text-white text-xs rounded-lg cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateBookingStatus(b, 'rejected')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded-lg cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => void updateBookingStatus(b, 'confirmed', 'paid')}
                        className="px-3 py-1.5 bg-[#0B57D0] text-white text-xs rounded-lg cursor-pointer"
                      >
                        Confirm &amp; Mark Paid
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => void updateBookingStatus(b, 'completed', 'paid')}
                        className="px-3 py-1.5 bg-[#0D5EFF] text-white text-xs rounded-lg cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HotelDashboardPanel() {
  const {
    userProfile,
    destinations,
    hotels,
    rooms,
    bookings,
    createHotel,
    createRoom,
    updateBookingStatus,
  } = useTravelMate();

  const [hotelName, setHotelName] = useState('');
  const [destName, setDestName] = useState('Hunza Valley');
  const [address, setAddress] = useState('');
  const [desc, setDesc] = useState('');

  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [roomCat, setRoomCat] = useState('Deluxe Mountain View');
  const [roomPrice, setRoomPrice] = useState(14000);
  const [roomInv, setRoomInv] = useState(4);

  const myHotels = hotels.filter((h) => h.ownerId === userProfile?.uid);
  const myBookings = bookings.filter((b) => b.providerId === userProfile?.uid);

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = await createHotel({
      name: hotelName,
      destinationName: destName,
      address,
      description: desc || `Comfortable mountain stay in ${destName}`,
      facilities: ['Wi-Fi', 'Heated Water', 'Parking'],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      availability: 'active',
    });
    setSelectedHotelId(id);
    setHotelName('');
    setAddress('');
    setDesc('');
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetHotelId = selectedHotelId || myHotels[0]?.id;
    if (!targetHotelId) return;
    await createRoom({
      hotelId: targetHotelId,
      categoryName: roomCat,
      capacity: 2,
      pricePerNightPkr: roomPrice,
      totalInventory: roomInv,
      facilities: ['Private Bath', 'Mountain Balcony'],
    });
  };

  return (
    <div className="space-y-6">
      <ProviderVerificationCard role="hotel_owner" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleAddHotel}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
        >
          <h3 className="font-display font-bold text-base text-[#0F172A]">
            Register Hotel Property
          </h3>
          <input
            type="text"
            required
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            placeholder="Hotel / Lodge Name"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Property street address"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Property overview..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Add Property
          </button>
        </form>

        <form
          onSubmit={handleAddRoom}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
        >
          <h3 className="font-display font-bold text-base text-[#0F172A]">
            Configure Room Category &amp; Inventory
          </h3>
          <select
            value={selectedHotelId || myHotels[0]?.id || ''}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option value="">Select Property</option>
            {myHotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={roomCat}
            onChange={(e) => setRoomCat(e.target.value)}
            placeholder="Room category"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="number"
              value={roomPrice}
              onChange={(e) => setRoomPrice(Number(e.target.value))}
              placeholder="PKR / night"
              className="px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
            />
            <input
              type="number"
              min={1}
              value={roomInv}
              onChange={(e) => setRoomInv(Number(e.target.value))}
              placeholder="Total rooms"
              className="px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={myHotels.length === 0}
            className="px-4 py-2 bg-[#0B57D0] text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
          >
            Add Room Category
          </button>
        </form>
      </div>

      {/* Properties & Rooms */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-display font-bold text-base text-[#0F172A]">
          My Properties ({myHotels.length})
        </h3>
        {myHotels.map((h) => (
          <div key={h.id} className="border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-sm text-[#0F172A]">
              {h.name} · {h.destinationName}
            </div>
            <div className="text-xs text-[#0F172A]/65 mt-1">
              Rooms configured:{' '}
              {rooms
                .filter((r) => r.hotelId === h.id)
                .map((r) => `${r.categoryName} (${r.totalInventory} units · ${formatPkr(r.pricePerNightPkr)})`)
                .join(' | ') || 'None yet'}
            </div>
          </div>
        ))}
      </div>

      {/* Reservations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-display font-bold text-base text-[#0F172A]">
          Guest Reservations ({myBookings.length})
        </h3>
        {myBookings.map((b) => (
          <div
            key={b.id}
            className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="font-semibold text-sm">{b.itemTitle}</div>
              <div className="text-xs text-[#0F172A]/65">
                Guest: {b.touristName} · {b.startDate} to {b.endDate} · {formatPkr(b.totalPricePkr)} · Status:{' '}
                <strong className="uppercase">{b.status}</strong>
              </div>
            </div>
            {b.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void updateBookingStatus(b, 'confirmed')}
                  className="px-3 py-1.5 bg-[#0D5EFF] text-white text-xs rounded-lg cursor-pointer"
                >
                  Confirm Stay
                </button>
                <button
                  type="button"
                  onClick={() => void updateBookingStatus(b, 'rejected')}
                  className="px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded-lg cursor-pointer"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VehicleDashboardPanel() {
  const {
    userProfile,
    vehicles,
    bookings,
    createVehicle,
    updateVehicleAvailability,
    deleteVehicle,
    updateBookingStatus,
  } = useTravelMate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Vehicle['category']>('4x4 SUV');
  const [seats, setSeats] = useState(6);
  const [rate, setRate] = useState(16500);
  const [locations, setLocations] = useState('Islamabad, Hunza Valley, Skardu');

  const myVehicles = vehicles.filter((v) => v.ownerId === userProfile?.uid);
  const myBookings = bookings.filter((b) => b.providerId === userProfile?.uid);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVehicle({
      name,
      category,
      makeModel: name,
      modelYear: 2022,
      seatingCapacity: seats,
      hasAC: true,
      fuelType: 'Petrol',
      pricePerDayPkr: rate,
      driverAvailable: true,
      serviceLocations: locations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      availability: 'available',
    });
    setName('');
  };

  return (
    <div className="space-y-6">
      <ProviderVerificationCard role="vehicle_owner" />

      <form
        onSubmit={handleAdd}
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
      >
        <h3 className="font-display font-bold text-base text-[#0F172A]">Add Rental Vehicle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vehicle name (e.g., Toyota Prado TZ)"
            className="sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Vehicle['category'])}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option>4x4 SUV</option>
            <option>Sedan</option>
            <option>Hiace Van</option>
            <option>Coaster</option>
            <option>Hatchback</option>
          </select>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            placeholder="PKR / day"
            className="px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="number"
            min={2}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            placeholder="Seats"
            className="px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
          />
          <input
            type="text"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="Service corridors"
            className="sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#0D5EFF] text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          List Vehicle
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-display font-bold text-base text-[#0F172A]">
          My Fleet ({myVehicles.length})
        </h3>
        {myVehicles.map((v) => (
          <div
            key={v.id}
            className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="font-semibold text-sm">{v.name}</div>
              <div className="text-xs text-[#0F172A]/65 font-mono tabular-nums">
                {v.category} · {v.seatingCapacity} seats · {formatPkr(v.pricePerDayPkr)}/day
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={v.availability}
                onChange={(e) =>
                  void updateVehicleAvailability(v.id, e.target.value as Vehicle['availability'])
                }
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="booked">Booked</option>
              </select>
              <button
                type="button"
                onClick={() => void deleteVehicle(v.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-display font-bold text-base text-[#0F172A]">
          Rental Requests ({myBookings.length})
        </h3>
        {myBookings.map((b) => (
          <div
            key={b.id}
            className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="font-semibold text-sm">{b.itemTitle}</div>
              <div className="text-xs text-[#0F172A]/65">
                {b.touristName} · {b.startDate} to {b.endDate} · {formatPkr(b.totalPricePkr)} ·{' '}
                <strong className="uppercase">{b.status}</strong>
              </div>
            </div>
            {b.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void updateBookingStatus(b, 'confirmed')}
                  className="px-3 py-1.5 bg-[#0D5EFF] text-white text-xs rounded-lg cursor-pointer"
                >
                  Confirm Rental
                </button>
                <button
                  type="button"
                  onClick={() => void updateBookingStatus(b, 'rejected')}
                  className="px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded-lg cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

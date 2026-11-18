export type UserRole = 'tourist' | 'guide' | 'hotel_owner' | 'vehicle_owner' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  accountStatus: 'active' | 'suspended';
  emergencyContacts?: EmergencyContact[];
  bio?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicProfile {
  id?: string;
  uid: string;
  displayName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  bio?: string;
  languages?: string[];
  expertise?: string[];
  operatingDestinations?: string[];
  experienceYears?: number;
  completedBookings?: number;
  cancellationCount?: number;
  avgRating?: number;
  reviewCount?: number;
  responseRate?: number;
  updatedAt?: unknown;
}

export type DestinationCategory =
  | 'Mountains'
  | 'Valleys'
  | 'Lakes'
  | 'Historical'
  | 'Adventure'
  | 'Cultural'
  | 'Family';

export interface Destination {
  id: string;
  name: string;
  region: string;
  category: DestinationCategory;
  description: string;
  bestSeason?: string;
  elevationMeters?: number;
  estimatedBudgetPkr: number;
  lat: number;
  lng: number;
  highlights?: string[];
  activities?: string[];
  imageUrl?: string;
}

export interface TourPackage {
  id: string;
  guideId: string;
  guideName: string;
  title: string;
  destinationName: string;
  description: string;
  pricePerPersonPkr: number;
  durationDays: number;
  maxGroupSize: number;
  departureDate?: string;
  included?: string[];
  excluded?: string[];
  dailyItinerary?: string[];
  availability: 'available' | 'paused' | 'sold_out';
  imageUrl?: string;
}

export interface Hotel {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  destinationName: string;
  address?: string;
  description: string;
  facilities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  availability: 'active' | 'inactive';
}

export interface Room {
  id: string;
  hotelId: string;
  ownerId: string;
  categoryName: string;
  capacity: number;
  pricePerNightPkr: number;
  totalInventory: number;
  facilities?: string[];
}

export interface Vehicle {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  category: '4x4 SUV' | 'Sedan' | 'Hiace Van' | 'Coaster' | 'Hatchback';
  makeModel?: string;
  modelYear?: number;
  seatingCapacity: number;
  hasAC?: boolean;
  fuelType?: string;
  pricePerDayPkr: number;
  driverAvailable?: boolean;
  serviceLocations?: string[];
  availability: 'available' | 'maintenance' | 'booked';
  imageUrl?: string;
}

export interface LocalExperience {
  id: string;
  providerId: string;
  providerName: string;
  category: string;
  title: string;
  destinationName: string;
  description?: string;
  pricePkr: number;
  durationHours?: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  availability: 'available' | 'paused';
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  attractions: string[];
  estimatedDayCostPkr: number;
}

export interface BudgetBreakdown {
  transportationPkr: number;
  accommodationPkr: number;
  foodPkr: number;
  activitiesPkr: number;
  miscellaneousPkr: number;
  totalEstimatedPkr: number;
}

export interface ItineraryRevision {
  revisedAt: string;
  reason: string;
  affectedDayNumber: number;
  previousDayTitle: string;
  newDayTitle: string;
  budgetDeltaPkr: number;
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  startingLocation?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetPkr: number;
  interests?: string[];
  accommodationPref?: string;
  transportPref?: string;
  days: ItineraryDay[];
  budgetBreakdown?: BudgetBreakdown;
  revisions?: ItineraryRevision[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type BookingStatus = 'pending' | 'accepted' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  touristId: string;
  touristName: string;
  providerId: string;
  providerName: string;
  bookingType: 'package' | 'hotel' | 'vehicle' | 'experience' | 'custom_trip';
  itemId: string;
  itemTitle: string;
  destinationName?: string;
  startDate: string;
  endDate: string;
  guests: number;
  roomId?: string;
  driverRequired?: boolean;
  totalPricePkr: number;
  paymentMethod: 'cash_on_arrival' | 'manual_transfer';
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ExpenseCategory =
  | 'Accommodation'
  | 'Transportation'
  | 'Food'
  | 'Activities'
  | 'Shopping'
  | 'Tour guide'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  userId: string;
  tripTitle: string;
  category: ExpenseCategory;
  description: string;
  amountPkr: number;
  date: string;
  isShared: boolean;
  paidByName?: string;
  splitMembers?: string[];
  createdAt?: unknown;
}

export interface TravelBuddyRequest {
  id: string;
  userId: string;
  authorName: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetMinPkr: number;
  budgetMaxPkr: number;
  travelersCount?: number;
  desiredGroupSize: number;
  interests: string[];
  notes?: string;
  status: 'open' | 'matched' | 'closed';
  createdAt?: unknown;
}

export interface TravelGroup {
  id: string;
  creatorId: string;
  creatorName: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  itinerarySummary?: string;
  maxMembers: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  displayName: string;
  role: 'creator' | 'member';
  status: 'pending' | 'approved' | 'rejected';
  joinedAt?: unknown;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames?: Record<string, string>;
  title: string;
  type: 'direct' | 'group';
  lastMessage?: string;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: unknown;
}

export interface AppNotification {
  id: string;
  userId: string;
  senderId: string;
  title: string;
  body: string;
  category: 'booking' | 'message' | 'verification' | 'advisory' | 'emergency' | 'group';
  read: boolean;
  createdAt?: unknown;
}

export interface Review {
  id: string;
  userId: string;
  authorName: string;
  bookingId: string;
  targetType: 'guide' | 'hotel' | 'vehicle' | 'package' | 'experience';
  targetId: string;
  targetName?: string;
  rating: number;
  comment: string;
  moderationStatus: 'published' | 'flagged' | 'removed';
  createdAt?: unknown;
}

export interface Favorite {
  id: string;
  userId: string;
  itemType: 'destination' | 'package' | 'hotel' | 'vehicle' | 'experience';
  itemId: string;
  itemTitle: string;
  destinationName?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  applicantName: string;
  role: 'guide' | 'hotel_owner' | 'vehicle_owner';
  cnicReference: string;
  licenseOrRegInfo: string;
  operatingDestinations?: string[];
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt?: unknown;
}

export interface EmergencyEvent {
  id: string;
  userId: string;
  touristName: string;
  lat?: number;
  lng?: number;
  locationLabel: string;
  notes?: string;
  assignedGuideId?: string;
  emergencyContactsNotified?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt?: unknown;
}

export interface TravelAdvisory {
  id: string;
  authorId: string;
  title: string;
  destination: string;
  category:
    | 'Road closure'
    | 'Landslide warning'
    | 'Flood alert'
    | 'Snowfall warning'
    | 'Severe weather'
    | 'Official restriction';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  sourceType: 'official' | 'user_report';
  verificationSource: string;
  status: 'active' | 'expired';
  expiresAt?: string;
  createdAt?: unknown;
}

export interface WeatherData {
  source: string;
  fetchedAt: string;
  current: {
    temperatureC: number;
    humidityPct: number;
    windSpeedKmh: number;
    condition: string;
    weatherCode: number;
  };
  forecast: Array<{
    date: string;
    condition: string;
    weatherCode: number;
    tempMaxC: number;
    tempMinC: number;
    rainProbabilityPct: number;
  }>;
}

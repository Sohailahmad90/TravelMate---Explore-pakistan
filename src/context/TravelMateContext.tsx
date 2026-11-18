import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase';
import {
  SEED_ADVISORIES,
  SEED_BUDDY_REQUESTS,
  SEED_DESTINATIONS,
  SEED_EXPERIENCES,
  SEED_HOTELS,
  SEED_PACKAGES,
  SEED_PUBLIC_PROFILES,
  SEED_ROOMS,
  SEED_VEHICLES,
} from '../data/seedData';
import { datesOverlap, sanitizeText } from '../lib/formatters';
import type {
  AppNotification,
  Booking,
  BookingStatus,
  Conversation,
  Destination,
  EmergencyContact,
  EmergencyEvent,
  Expense,
  Favorite,
  Hotel,
  Itinerary,
  LocalExperience,
  PublicProfile,
  Review,
  Room,
  TourPackage,
  TravelAdvisory,
  TravelBuddyRequest,
  TravelGroup,
  UserProfile,
  UserRole,
  Vehicle,
  VerificationRequest,
} from '../types/travelmate';

function mergeById<T extends { id: string }>(live: T[], seed: T[]): T[] {
  const map = new Map<string, T>();
  seed.forEach((item) => map.set(item.id, item));
  live.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

interface TravelMateContextValue {
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  userProfile: UserProfile | null;
  needsOnboarding: boolean;
  isAdmin: boolean;
  destinations: Destination[];
  publicProfiles: PublicProfile[];
  tourPackages: TourPackage[];
  hotels: Hotel[];
  rooms: Room[];
  vehicles: Vehicle[];
  localExperiences: LocalExperience[];
  travelAdvisories: TravelAdvisory[];
  travelBuddyRequests: TravelBuddyRequest[];
  travelGroups: TravelGroup[];
  reviews: Review[];
  itineraries: Itinerary[];
  bookings: Booking[];
  expenses: Expense[];
  favorites: Favorite[];
  notifications: AppNotification[];
  conversations: Conversation[];
  verificationRequests: VerificationRequest[];
  emergencyEvents: EmergencyEvent[];
  allUsers: UserProfile[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setPendingSignupDraft: (draft: {
    role: Exclude<UserRole, 'admin'>;
    displayName?: string;
    phone?: string;
    city?: string;
    bio?: string;
  } | null) => void;
  completeOnboarding: (payload: {
    role: Exclude<UserRole, 'admin'>;
    displayName: string;
    phone: string;
    city: string;
    bio: string;
  }) => Promise<void>;
  updateProfile: (updates: {
    displayName: string;
    phone: string;
    city: string;
    bio: string;
    emergencyContacts: EmergencyContact[];
  }) => Promise<void>;
  toggleFavorite: (item: Omit<Favorite, 'id' | 'userId'>) => Promise<void>;
  saveItinerary: (itinerary: Omit<Itinerary, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<string>;
  deleteItinerary: (id: string) => Promise<void>;
  createBooking: (payload: Omit<Booking, 'id' | 'touristId' | 'touristName' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBookingStatus: (booking: Booking, nextStatus: BookingStatus, paymentStatus?: Booking['paymentStatus']) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  createPackage: (pkg: Omit<TourPackage, 'id' | 'guideId' | 'guideName'>) => Promise<void>;
  updatePackage: (id: string, updates: Partial<TourPackage>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  createHotel: (hotel: Omit<Hotel, 'id' | 'ownerId' | 'ownerName'>) => Promise<string>;
  createRoom: (room: Omit<Room, 'id' | 'ownerId'>) => Promise<void>;
  createVehicle: (vehicle: Omit<Vehicle, 'id' | 'ownerId' | 'ownerName'>) => Promise<void>;
  updateVehicleAvailability: (id: string, availability: Vehicle['availability']) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  submitLocalExperience: (exp: Omit<LocalExperience, 'id' | 'providerId' | 'providerName' | 'approvalStatus'>) => Promise<void>;
  moderateLocalExperience: (id: string, approvalStatus: LocalExperience['approvalStatus']) => Promise<void>;
  createBuddyRequest: (req: Omit<TravelBuddyRequest, 'id' | 'userId' | 'authorName' | 'status'>) => Promise<void>;
  createTravelGroup: (grp: Omit<TravelGroup, 'id' | 'creatorId' | 'creatorName'>) => Promise<void>;
  requestJoinGroup: (group: TravelGroup) => Promise<void>;
  startOrOpenConversation: (recipientId: string, recipientName: string, title: string) => Promise<string>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  submitReview: (rev: Omit<Review, 'id' | 'userId' | 'authorName' | 'moderationStatus'>) => Promise<void>;
  moderateReview: (id: string, moderationStatus: Review['moderationStatus']) => Promise<void>;
  submitVerificationRequest: (req: Omit<VerificationRequest, 'id' | 'userId' | 'applicantName' | 'status'>) => Promise<void>;
  decideVerificationRequest: (req: VerificationRequest, decision: 'approved' | 'rejected', rejectionReason?: string) => Promise<void>;
  triggerEmergencySos: (payload: { lat?: number; lng?: number; locationLabel: string; notes: string; assignedGuideId?: string }) => Promise<void>;
  updateEmergencyStatus: (id: string, status: EmergencyEvent['status']) => Promise<void>;
  publishAdvisory: (adv: Omit<TravelAdvisory, 'id' | 'authorId'>) => Promise<void>;
  toggleUserAccountStatus: (user: UserProfile) => Promise<void>;
  syncCatalogToFirestore: () => Promise<void>;
}

const TravelMateContext = createContext<TravelMateContextValue | null>(null);

export function TravelMateProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const pendingSignupDraftRef = useRef<{
    role: Exclude<UserRole, 'admin'>;
    displayName?: string;
    phone?: string;
    city?: string;
    bio?: string;
  } | null>(null);

  const setPendingSignupDraft: TravelMateContextValue['setPendingSignupDraft'] = (draft) => {
    pendingSignupDraftRef.current = draft;
  };

  const [liveDestinations, setLiveDestinations] = useState<Destination[]>([]);
  const [livePublicProfiles, setLivePublicProfiles] = useState<PublicProfile[]>([]);
  const [livePackages, setLivePackages] = useState<TourPackage[]>([]);
  const [liveHotels, setLiveHotels] = useState<Hotel[]>([]);
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
  const [liveExperiences, setLiveExperiences] = useState<LocalExperience[]>([]);
  const [liveAdvisories, setLiveAdvisories] = useState<TravelAdvisory[]>([]);
  const [liveBuddyRequests, setLiveBuddyRequests] = useState<TravelBuddyRequest[]>([]);
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [emergencyEvents, setEmergencyEvents] = useState<EmergencyEvent[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const isAdmin = useMemo(() => {
    if (!firebaseUser) return false;
    return (
      (firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL && firebaseUser.emailVerified) ||
      userProfile?.role === 'admin'
    );
  }, [firebaseUser, userProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setUserProfile(null);
        setNeedsOnboarding(false);
        setItineraries([]);
        setBookings([]);
        setExpenses([]);
        setFavorites([]);
        setNotifications([]);
        setConversations([]);
        setVerificationRequests([]);
        setEmergencyEvents([]);
        setAllUsers([]);
      }
    });
    return () => unsub();
  }, []);

  // Listen to authenticated user's profile
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const unsub = onSnapshot(
      userRef,
      async (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
          setNeedsOnboarding(false);
        } else if (firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL && firebaseUser.emailVerified) {
          // Auto-provision verified bootstrap administrator profile
          const adminDoc: UserProfile = {
            uid: firebaseUser.uid,
            displayName: sanitizeText(firebaseUser.displayName || 'TravelMate Admin', 100),
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || '',
            city: 'Islamabad',
            role: 'admin',
            verificationStatus: 'verified',
            accountStatus: 'active',
            bio: 'TravelMate Platform Administrator',
          };
          try {
            await setDoc(userRef, {
              ...adminDoc,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
          }
        } else if (pendingSignupDraftRef.current) {
          const draft = pendingSignupDraftRef.current;
          pendingSignupDraftRef.current = null;
          const uid = firebaseUser.uid;
          const cleanName = sanitizeText(draft.displayName || firebaseUser.displayName || 'TravelMate User', 100);
          const cleanPhone = sanitizeText(draft.phone || '', 30);
          const cleanCity = sanitizeText(draft.city || 'Islamabad', 80);
          const cleanBio = sanitizeText(draft.bio || '', 1000);
          try {
            await setDoc(userRef, {
              uid,
              displayName: cleanName,
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              phone: cleanPhone,
              city: cleanCity,
              role: draft.role,
              verificationStatus: 'unverified',
              accountStatus: 'active',
              emergencyContacts: [],
              bio: cleanBio,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            await setDoc(doc(db, 'publicProfiles', uid), {
              uid,
              displayName: cleanName,
              role: draft.role,
              verificationStatus: 'unverified',
              bio: cleanBio,
              languages: ['Urdu', 'English'],
              operatingDestinations: cleanCity ? [cleanCity] : [],
              experienceYears: 0,
              completedBookings: 0,
              cancellationCount: 0,
              avgRating: 0,
              reviewCount: 0,
              responseRate: 100,
              updatedAt: serverTimestamp(),
            });
            setNeedsOnboarding(false);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
          }
        } else {
          setUserProfile(null);
          setNeedsOnboarding(true);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      }
    );
    return () => unsub();
  }, [authReady, firebaseUser]);

  // Public read-only collections
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const bindPublic = <T extends { id?: string }>(
      colName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const unsub = onSnapshot(
        collection(db, colName),
        (snap) => {
          setter(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, colName);
        }
      );
      unsubs.push(unsub);
    };

    bindPublic<Destination>('destinations', setLiveDestinations);
    bindPublic<PublicProfile>('publicProfiles', setLivePublicProfiles);
    bindPublic<TourPackage>('tourPackages', setLivePackages);
    bindPublic<Hotel>('hotels', setLiveHotels);
    bindPublic<Room>('rooms', setLiveRooms);
    bindPublic<Vehicle>('vehicles', setLiveVehicles);
    bindPublic<LocalExperience>('localExperiences', setLiveExperiences);
    bindPublic<TravelAdvisory>('travelAdvisories', setLiveAdvisories);
    bindPublic<TravelBuddyRequest>('travelBuddyRequests', setLiveBuddyRequests);
    bindPublic<TravelGroup>('travelGroups', setTravelGroups);
    bindPublic<Review>('reviews', setReviews);

    return () => unsubs.forEach((u) => u());
  }, []);

  // Private authenticated collections
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const uid = firebaseUser.uid;
    const unsubs: Array<() => void> = [];

    const qItin = isAdmin
      ? query(collection(db, 'itineraries'))
      : query(collection(db, 'itineraries'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        qItin,
        (snap) => setItineraries(snap.docs.map((d) => ({ ...(d.data() as Itinerary), id: d.id }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'itineraries')
      )
    );

    const qExp = isAdmin
      ? query(collection(db, 'expenses'))
      : query(collection(db, 'expenses'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        qExp,
        (snap) => setExpenses(snap.docs.map((d) => ({ ...(d.data() as Expense), id: d.id }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'expenses')
      )
    );

    const qFav = isAdmin
      ? query(collection(db, 'favorites'))
      : query(collection(db, 'favorites'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        qFav,
        (snap) => setFavorites(snap.docs.map((d) => ({ ...(d.data() as Favorite), id: d.id }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'favorites')
      )
    );

    const qNotif = isAdmin
      ? query(collection(db, 'notifications'))
      : query(collection(db, 'notifications'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        qNotif,
        (snap) => setNotifications(snap.docs.map((d) => ({ ...(d.data() as AppNotification), id: d.id }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
      )
    );

    const qConv = isAdmin
      ? query(collection(db, 'conversations'))
      : query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid));
    unsubs.push(
      onSnapshot(
        qConv,
        (snap) => setConversations(snap.docs.map((d) => ({ ...(d.data() as Conversation), id: d.id }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'conversations')
      )
    );

    // Bookings: tourist OR provider OR admin
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'bookings'),
          (snap) => setBookings(snap.docs.map((d) => ({ ...(d.data() as Booking), id: d.id }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
        )
      );
    } else {
      let touristList: Booking[] = [];
      let providerList: Booking[] = [];
      const syncMergedBookings = () => {
        const map = new Map<string, Booking>();
        touristList.forEach((b) => map.set(b.id, b));
        providerList.forEach((b) => map.set(b.id, b));
        setBookings(Array.from(map.values()));
      };
      unsubs.push(
        onSnapshot(
          query(collection(db, 'bookings'), where('touristId', '==', uid)),
          (snap) => {
            touristList = snap.docs.map((d) => ({ ...(d.data() as Booking), id: d.id }));
            syncMergedBookings();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'bookings'), where('providerId', '==', uid)),
          (snap) => {
            providerList = snap.docs.map((d) => ({ ...(d.data() as Booking), id: d.id }));
            syncMergedBookings();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
        )
      );
    }

    const qVerif = isAdmin
      ? query(collection(db, 'verificationRequests'))
      : query(collection(db, 'verificationRequests'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        qVerif,
        (snap) => setVerificationRequests(snap.docs.map((d) => ({ ...(d.data() as VerificationRequest), id: d.id }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'verificationRequests')
      )
    );

    const qSos = isAdmin
      ? query(collection(db, 'emergencyEvents'))
      : query(collection(db, 'emergencyEvents'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        qSos,
        (snap) => setEmergencyEvents(snap.docs.map((d) => ({ ...(d.data() as EmergencyEvent), id: d.id }))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'emergencyEvents')
      )
    );

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => setAllUsers(snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'users')
        )
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [authReady, firebaseUser, isAdmin]);

  const destinations = useMemo(() => mergeById(liveDestinations, SEED_DESTINATIONS), [liveDestinations]);
  const publicProfiles = useMemo(
    () =>
      mergeById(
        livePublicProfiles.map((p) => ({ ...p, id: p.uid })),
        SEED_PUBLIC_PROFILES.map((p) => ({ ...p, id: p.uid }))
      ),
    [livePublicProfiles]
  );
  const tourPackages = useMemo(() => mergeById(livePackages, SEED_PACKAGES), [livePackages]);
  const hotels = useMemo(() => mergeById(liveHotels, SEED_HOTELS), [liveHotels]);
  const rooms = useMemo(() => mergeById(liveRooms, SEED_ROOMS), [liveRooms]);
  const vehicles = useMemo(() => mergeById(liveVehicles, SEED_VEHICLES), [liveVehicles]);
  const localExperiences = useMemo(() => mergeById(liveExperiences, SEED_EXPERIENCES), [liveExperiences]);
  const travelAdvisories = useMemo(() => mergeById(liveAdvisories, SEED_ADVISORIES), [liveAdvisories]);
  const travelBuddyRequests = useMemo(() => mergeById(liveBuddyRequests, SEED_BUDDY_REQUESTS), [liveBuddyRequests]);

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signOut = async () => {
    await signOutUser();
  };

  const completeOnboarding: TravelMateContextValue['completeOnboarding'] = async (payload) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const cleanName = sanitizeText(payload.displayName || firebaseUser.displayName || 'TravelMate User', 100);
    const cleanPhone = sanitizeText(payload.phone, 30);
    const cleanCity = sanitizeText(payload.city, 80);
    const cleanBio = sanitizeText(payload.bio, 1000);

    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: cleanName,
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        phone: cleanPhone,
        city: cleanCity,
        role: payload.role,
        verificationStatus: 'unverified',
        accountStatus: 'active',
        emergencyContacts: [],
        bio: cleanBio,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'publicProfiles', uid), {
        uid,
        displayName: cleanName,
        role: payload.role,
        verificationStatus: 'unverified',
        bio: cleanBio,
        languages: ['Urdu', 'English'],
        operatingDestinations: cleanCity ? [cleanCity] : [],
        experienceYears: 0,
        completedBookings: 0,
        cancellationCount: 0,
        avgRating: 0,
        reviewCount: 0,
        responseRate: 100,
        updatedAt: serverTimestamp(),
      });
      setNeedsOnboarding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const updateProfile: TravelMateContextValue['updateProfile'] = async (updates) => {
    if (!firebaseUser || !userProfile) return;
    const uid = firebaseUser.uid;
    const cleanName = sanitizeText(updates.displayName, 100);
    const cleanBio = sanitizeText(updates.bio, 1000);
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName: cleanName,
        phone: sanitizeText(updates.phone, 30),
        city: sanitizeText(updates.city, 80),
        bio: cleanBio,
        emergencyContacts: updates.emergencyContacts.slice(0, 5),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'publicProfiles', uid), {
        displayName: cleanName,
        bio: cleanBio,
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const toggleFavorite: TravelMateContextValue['toggleFavorite'] = async (item) => {
    if (!firebaseUser) return;
    const existing = favorites.find((f) => f.itemType === item.itemType && f.itemId === item.itemId);
    try {
      if (existing) {
        await deleteDoc(doc(db, 'favorites', existing.id));
      } else {
        const id = makeId('fav');
        await setDoc(doc(db, 'favorites', id), {
          userId: firebaseUser.uid,
          itemType: item.itemType,
          itemId: sanitizeText(item.itemId, 128),
          itemTitle: sanitizeText(item.itemTitle, 140),
          destinationName: sanitizeText(item.destinationName || '', 100),
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'favorites');
    }
  };

  const saveItinerary: TravelMateContextValue['saveItinerary'] = async (itinerary, existingId) => {
    if (!firebaseUser) throw new Error('Authentication required');
    const id = existingId || makeId('itin');
    const ref = doc(db, 'itineraries', id);
    try {
      if (existingId) {
        await updateDoc(ref, {
          title: sanitizeText(itinerary.title, 140),
          startDate: sanitizeText(itinerary.startDate, 40),
          endDate: sanitizeText(itinerary.endDate, 40),
          travelers: Number(itinerary.travelers) || 1,
          budgetPkr: Number(itinerary.budgetPkr) || 0,
          interests: (itinerary.interests || []).slice(0, 15),
          days: itinerary.days.slice(0, 30),
          budgetBreakdown: itinerary.budgetBreakdown || {},
          revisions: (itinerary.revisions || []).slice(0, 20),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          userId: firebaseUser.uid,
          title: sanitizeText(itinerary.title, 140),
          startingLocation: sanitizeText(itinerary.startingLocation || 'Islamabad', 100),
          destination: sanitizeText(itinerary.destination, 100),
          startDate: sanitizeText(itinerary.startDate, 40),
          endDate: sanitizeText(itinerary.endDate, 40),
          travelers: Number(itinerary.travelers) || 1,
          budgetPkr: Number(itinerary.budgetPkr) || 0,
          interests: (itinerary.interests || []).slice(0, 15),
          accommodationPref: sanitizeText(itinerary.accommodationPref || '', 80),
          transportPref: sanitizeText(itinerary.transportPref || '', 80),
          days: itinerary.days.slice(0, 30),
          budgetBreakdown: itinerary.budgetBreakdown || {},
          revisions: (itinerary.revisions || []).slice(0, 20),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `itineraries/${id}`);
    }
  };

  const deleteItinerary = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'itineraries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `itineraries/${id}`);
    }
  };

  const createBooking: TravelMateContextValue['createBooking'] = async (payload) => {
    if (!firebaseUser || !userProfile) throw new Error('Please sign in first.');

    // Concurrency-safe conflict validation for hotels and vehicles
    if (payload.bookingType === 'vehicle') {
      const existingSnap = await getDocs(
        query(collection(db, 'bookings'), where('touristId', '==', firebaseUser.uid))
      );
      const userConflicts = existingSnap.docs
        .map((d) => d.data() as Booking)
        .filter(
          (b) =>
            b.bookingType === 'vehicle' &&
            b.itemId === payload.itemId &&
            ['pending', 'accepted', 'confirmed'].includes(b.status) &&
            datesOverlap(b.startDate, b.endDate, payload.startDate, payload.endDate)
        );
      if (userConflicts.length > 0) {
        throw new Error('You already have an overlapping reservation for this vehicle on the selected dates.');
      }
    }

    if (payload.bookingType === 'hotel' && payload.roomId) {
      const room = rooms.find((r) => r.id === payload.roomId);
      if (room && room.totalInventory <= 0) {
        throw new Error('Selected room category has no remaining inventory.');
      }
    }

    const id = makeId('book');
    const bookingRef = doc(db, 'bookings', id);
    const notifId = makeId('notif');
    const notifRef = doc(db, 'notifications', notifId);

    try {
      await runTransaction(db, async (tx) => {
        tx.set(bookingRef, {
          touristId: firebaseUser.uid,
          touristName: sanitizeText(userProfile.displayName, 100),
          providerId: sanitizeText(payload.providerId, 128),
          providerName: sanitizeText(payload.providerName, 100),
          bookingType: payload.bookingType,
          itemId: sanitizeText(payload.itemId, 128),
          itemTitle: sanitizeText(payload.itemTitle, 160),
          destinationName: sanitizeText(payload.destinationName || '', 100),
          startDate: sanitizeText(payload.startDate, 40),
          endDate: sanitizeText(payload.endDate, 40),
          guests: Math.max(1, Number(payload.guests) || 1),
          roomId: sanitizeText(payload.roomId || '', 128),
          driverRequired: Boolean(payload.driverRequired),
          totalPricePkr: Math.max(0, Number(payload.totalPricePkr) || 0),
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.paymentMethod === 'manual_transfer' ? 'pending' : 'unpaid',
          status: 'pending',
          notes: sanitizeText(payload.notes || '', 1000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        tx.set(notifRef, {
          userId: sanitizeText(payload.providerId, 128),
          senderId: firebaseUser.uid,
          title: 'New Booking Request',
          body: `${sanitizeText(userProfile.displayName, 60)} requested ${sanitizeText(payload.itemTitle, 80)} (${payload.startDate} to ${payload.endDate}).`,
          category: 'booking',
          read: false,
          createdAt: serverTimestamp(),
        });
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `bookings/${id}`);
    }
  };

  const updateBookingStatus: TravelMateContextValue['updateBookingStatus'] = async (
    booking,
    nextStatus,
    paymentStatus
  ) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: nextStatus,
        paymentStatus: paymentStatus || booking.paymentStatus,
        updatedAt: serverTimestamp(),
      });

      const recipientId = firebaseUser.uid === booking.touristId ? booking.providerId : booking.touristId;
      await setDoc(doc(db, 'notifications', makeId('notif')), {
        userId: recipientId,
        senderId: firebaseUser.uid,
        title: `Booking ${nextStatus}`,
        body: `${booking.itemTitle} status updated to ${nextStatus}.`,
        category: 'booking',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${booking.id}`);
    }
  };

  const addExpense: TravelMateContextValue['addExpense'] = async (expense) => {
    if (!firebaseUser) return;
    const id = makeId('exp');
    try {
      await setDoc(doc(db, 'expenses', id), {
        userId: firebaseUser.uid,
        tripTitle: sanitizeText(expense.tripTitle, 120),
        category: expense.category,
        description: sanitizeText(expense.description, 240),
        amountPkr: Math.max(0, Number(expense.amountPkr) || 0),
        date: sanitizeText(expense.date, 40),
        isShared: Boolean(expense.isShared),
        paidByName: sanitizeText(expense.paidByName || '', 100),
        splitMembers: (expense.splitMembers || []).slice(0, 20),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `expenses/${id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const createPackage: TravelMateContextValue['createPackage'] = async (pkg) => {
    if (!firebaseUser || !userProfile) return;
    const id = makeId('pkg');
    try {
      await setDoc(doc(db, 'tourPackages', id), {
        guideId: firebaseUser.uid,
        guideName: sanitizeText(userProfile.displayName, 100),
        title: sanitizeText(pkg.title, 140),
        destinationName: sanitizeText(pkg.destinationName, 100),
        description: sanitizeText(pkg.description, 3000),
        pricePerPersonPkr: Math.max(0, Number(pkg.pricePerPersonPkr) || 0),
        durationDays: Math.max(1, Number(pkg.durationDays) || 1),
        maxGroupSize: Math.max(1, Number(pkg.maxGroupSize) || 10),
        departureDate: sanitizeText(pkg.departureDate || '', 40),
        included: (pkg.included || []).slice(0, 20),
        excluded: (pkg.excluded || []).slice(0, 20),
        dailyItinerary: (pkg.dailyItinerary || []).slice(0, 30),
        availability: pkg.availability,
        imageUrl: sanitizeText(pkg.imageUrl || '', 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tourPackages/${id}`);
    }
  };

  const updatePackage: TravelMateContextValue['updatePackage'] = async (id, updates) => {
    try {
      await updateDoc(doc(db, 'tourPackages', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tourPackages/${id}`);
    }
  };

  const deletePackage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tourPackages', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tourPackages/${id}`);
    }
  };

  const createHotel: TravelMateContextValue['createHotel'] = async (hotel) => {
    if (!firebaseUser || !userProfile) throw new Error('Sign in required');
    const id = makeId('hotel');
    try {
      await setDoc(doc(db, 'hotels', id), {
        ownerId: firebaseUser.uid,
        ownerName: sanitizeText(userProfile.displayName, 100),
        name: sanitizeText(hotel.name, 120),
        destinationName: sanitizeText(hotel.destinationName, 100),
        address: sanitizeText(hotel.address || '', 240),
        description: sanitizeText(hotel.description, 2000),
        facilities: (hotel.facilities || []).slice(0, 20),
        checkInTime: sanitizeText(hotel.checkInTime || '14:00', 20),
        checkOutTime: sanitizeText(hotel.checkOutTime || '12:00', 20),
        lat: hotel.lat ?? 35.92,
        lng: hotel.lng ?? 74.31,
        imageUrl: sanitizeText(hotel.imageUrl || '', 500),
        availability: hotel.availability,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `hotels/${id}`);
    }
  };

  const createRoom: TravelMateContextValue['createRoom'] = async (room) => {
    if (!firebaseUser) return;
    const id = makeId('room');
    try {
      await setDoc(doc(db, 'rooms', id), {
        hotelId: sanitizeText(room.hotelId, 128),
        ownerId: firebaseUser.uid,
        categoryName: sanitizeText(room.categoryName, 100),
        capacity: Math.max(1, Number(room.capacity) || 2),
        pricePerNightPkr: Math.max(0, Number(room.pricePerNightPkr) || 0),
        totalInventory: Math.max(1, Number(room.totalInventory) || 1),
        facilities: (room.facilities || []).slice(0, 15),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `rooms/${id}`);
    }
  };

  const createVehicle: TravelMateContextValue['createVehicle'] = async (vehicle) => {
    if (!firebaseUser || !userProfile) return;
    const id = makeId('veh');
    try {
      await setDoc(doc(db, 'vehicles', id), {
        ownerId: firebaseUser.uid,
        ownerName: sanitizeText(userProfile.displayName, 100),
        name: sanitizeText(vehicle.name, 120),
        category: vehicle.category,
        makeModel: sanitizeText(vehicle.makeModel || '', 100),
        modelYear: Number(vehicle.modelYear) || 2022,
        seatingCapacity: Math.max(1, Number(vehicle.seatingCapacity) || 4),
        hasAC: Boolean(vehicle.hasAC),
        fuelType: sanitizeText(vehicle.fuelType || 'Petrol', 40),
        pricePerDayPkr: Math.max(0, Number(vehicle.pricePerDayPkr) || 0),
        driverAvailable: Boolean(vehicle.driverAvailable),
        serviceLocations: (vehicle.serviceLocations || []).slice(0, 15),
        availability: vehicle.availability,
        imageUrl: sanitizeText(vehicle.imageUrl || '', 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `vehicles/${id}`);
    }
  };

  const updateVehicleAvailability = async (id: string, availability: Vehicle['availability']) => {
    try {
      await updateDoc(doc(db, 'vehicles', id), { availability, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vehicles/${id}`);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vehicles/${id}`);
    }
  };

  const submitLocalExperience: TravelMateContextValue['submitLocalExperience'] = async (exp) => {
    if (!firebaseUser || !userProfile) return;
    const id = makeId('exp_local');
    try {
      await setDoc(doc(db, 'localExperiences', id), {
        providerId: firebaseUser.uid,
        providerName: sanitizeText(userProfile.displayName, 100),
        category: sanitizeText(exp.category, 60),
        title: sanitizeText(exp.title, 140),
        destinationName: sanitizeText(exp.destinationName, 100),
        description: sanitizeText(exp.description || '', 2000),
        pricePkr: Math.max(0, Number(exp.pricePkr) || 0),
        durationHours: Math.max(1, Number(exp.durationHours) || 2),
        approvalStatus: isAdmin ? 'approved' : 'pending',
        availability: exp.availability,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `localExperiences/${id}`);
    }
  };

  const moderateLocalExperience = async (id: string, approvalStatus: LocalExperience['approvalStatus']) => {
    try {
      await updateDoc(doc(db, 'localExperiences', id), {
        approvalStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `localExperiences/${id}`);
    }
  };

  const createBuddyRequest: TravelMateContextValue['createBuddyRequest'] = async (req) => {
    if (!firebaseUser || !userProfile) return;
    const id = makeId('buddy');
    try {
      await setDoc(doc(db, 'travelBuddyRequests', id), {
        userId: firebaseUser.uid,
        authorName: sanitizeText(userProfile.displayName, 100),
        destination: sanitizeText(req.destination, 100),
        startDate: sanitizeText(req.startDate, 40),
        endDate: sanitizeText(req.endDate, 40),
        budgetMinPkr: Math.max(0, Number(req.budgetMinPkr) || 0),
        budgetMaxPkr: Math.max(0, Number(req.budgetMaxPkr) || 0),
        travelersCount: Math.max(1, Number(req.travelersCount) || 1),
        desiredGroupSize: Math.max(2, Number(req.desiredGroupSize) || 4),
        interests: (req.interests || []).slice(0, 15),
        notes: sanitizeText(req.notes || '', 500),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `travelBuddyRequests/${id}`);
    }
  };

  const createTravelGroup: TravelMateContextValue['createTravelGroup'] = async (grp) => {
    if (!firebaseUser || !userProfile) return;
    const id = makeId('grp');
    try {
      await setDoc(doc(db, 'travelGroups', id), {
        creatorId: firebaseUser.uid,
        creatorName: sanitizeText(userProfile.displayName, 100),
        name: sanitizeText(grp.name, 120),
        destination: sanitizeText(grp.destination, 100),
        startDate: sanitizeText(grp.startDate, 40),
        endDate: sanitizeText(grp.endDate, 40),
        itinerarySummary: sanitizeText(grp.itinerarySummary || '', 1500),
        maxMembers: Math.max(2, Number(grp.maxMembers) || 6),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'travelGroups', id, 'members', firebaseUser.uid), {
        userId: firebaseUser.uid,
        displayName: sanitizeText(userProfile.displayName, 100),
        role: 'creator',
        status: 'approved',
        joinedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `travelGroups/${id}`);
    }
  };

  const requestJoinGroup = async (group: TravelGroup) => {
    if (!firebaseUser || !userProfile) return;
    try {
      await setDoc(doc(db, 'travelGroups', group.id, 'members', firebaseUser.uid), {
        userId: firebaseUser.uid,
        displayName: sanitizeText(userProfile.displayName, 100),
        role: 'member',
        status: 'pending',
        joinedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'notifications', makeId('notif')), {
        userId: group.creatorId,
        senderId: firebaseUser.uid,
        title: 'Travel Group Join Request',
        body: `${userProfile.displayName} requested to join "${group.name}".`,
        category: 'group',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `travelGroups/${group.id}/members/${firebaseUser.uid}`);
    }
  };

  const startOrOpenConversation = async (recipientId: string, recipientName: string, title: string) => {
    if (!firebaseUser || !userProfile) throw new Error('Sign in required');
    const existing = conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.participantIds.includes(firebaseUser.uid) &&
        c.participantIds.includes(recipientId)
    );
    if (existing) return existing.id;

    const id = makeId('conv');
    try {
      await setDoc(doc(db, 'conversations', id), {
        participantIds: [firebaseUser.uid, recipientId],
        participantNames: {
          [firebaseUser.uid]: sanitizeText(userProfile.displayName, 80),
          [recipientId]: sanitizeText(recipientName, 80),
        },
        title: sanitizeText(title, 140),
        type: 'direct',
        lastMessage: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `conversations/${id}`);
    }
  };

  const sendMessage = async (conversationId: string, text: string) => {
    if (!firebaseUser || !userProfile) return;
    const clean = sanitizeText(text, 2000);
    if (!clean) return;
    const msgId = makeId('msg');
    try {
      await setDoc(doc(db, 'conversations', conversationId, 'messages', msgId), {
        senderId: firebaseUser.uid,
        senderName: sanitizeText(userProfile.displayName, 100),
        text: clean,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: clean.slice(0, 500),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `conversations/${conversationId}/messages/${msgId}`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const submitReview: TravelMateContextValue['submitReview'] = async (rev) => {
    if (!firebaseUser || !userProfile) return;
    const duplicate = reviews.some((r) => r.bookingId === rev.bookingId && r.userId === firebaseUser.uid);
    if (duplicate) {
      throw new Error('You have already submitted a verified review for this booking.');
    }
    const id = makeId('rev');
    try {
      await setDoc(doc(db, 'reviews', id), {
        userId: firebaseUser.uid,
        authorName: sanitizeText(userProfile.displayName, 100),
        bookingId: sanitizeText(rev.bookingId, 128),
        targetType: rev.targetType,
        targetId: sanitizeText(rev.targetId, 128),
        targetName: sanitizeText(rev.targetName || '', 140),
        rating: Math.min(5, Math.max(1, Number(rev.rating) || 5)),
        comment: sanitizeText(rev.comment, 1000),
        moderationStatus: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reviews/${id}`);
    }
  };

  const moderateReview = async (id: string, moderationStatus: Review['moderationStatus']) => {
    try {
      await updateDoc(doc(db, 'reviews', id), {
        moderationStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${id}`);
    }
  };

  const submitVerificationRequest: TravelMateContextValue['submitVerificationRequest'] = async (req) => {
    if (!firebaseUser || !userProfile) return;
    const id = makeId('verif');
    try {
      await setDoc(doc(db, 'verificationRequests', id), {
        userId: firebaseUser.uid,
        applicantName: sanitizeText(userProfile.displayName, 100),
        role: req.role,
        cnicReference: sanitizeText(req.cnicReference, 40),
        licenseOrRegInfo: sanitizeText(req.licenseOrRegInfo, 200),
        operatingDestinations: (req.operatingDestinations || []).slice(0, 15),
        description: sanitizeText(req.description || '', 1500),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `verificationRequests/${id}`);
    }
  };

  const decideVerificationRequest: TravelMateContextValue['decideVerificationRequest'] = async (
    req,
    decision,
    rejectionReason
  ) => {
    if (!firebaseUser || !isAdmin) return;
    try {
      const nextStatus = decision === 'approved' ? 'verified' : 'rejected';
      await updateDoc(doc(db, 'verificationRequests', req.id), {
        status: decision,
        rejectionReason: sanitizeText(rejectionReason || '', 400),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', req.userId), {
        verificationStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'publicProfiles', req.userId), {
        verificationStatus: nextStatus,
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
      await setDoc(doc(db, 'notifications', makeId('notif')), {
        userId: req.userId,
        senderId: firebaseUser.uid,
        title: `Verification ${decision}`,
        body:
          decision === 'approved'
            ? 'Your TravelMate service provider account is now verified.'
            : `Verification declined: ${rejectionReason || 'Please update your credentials.'}`,
        category: 'verification',
        read: false,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'adminLogs', makeId('log')), {
        adminId: firebaseUser.uid,
        action: `verification_${decision}`,
        targetType: 'user',
        targetId: req.userId,
        details: `Verified ${req.role} application (${req.id})`,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `verificationRequests/${req.id}`);
    }
  };

  const triggerEmergencySos: TravelMateContextValue['triggerEmergencySos'] = async (payload) => {
    if (!firebaseUser || !userProfile) return;
    const id = makeId('sos');
    const contactsCount = userProfile.emergencyContacts?.length || 0;
    try {
      await setDoc(doc(db, 'emergencyEvents', id), {
        userId: firebaseUser.uid,
        touristName: sanitizeText(userProfile.displayName, 100),
        lat: payload.lat ?? 35.92,
        lng: payload.lng ?? 74.31,
        locationLabel: sanitizeText(payload.locationLabel, 200),
        notes: sanitizeText(payload.notes, 600),
        assignedGuideId: sanitizeText(payload.assignedGuideId || '', 128),
        emergencyContactsNotified: contactsCount,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (payload.assignedGuideId) {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          userId: payload.assignedGuideId,
          senderId: firebaseUser.uid,
          title: 'Tourist SOS Alert',
          body: `${userProfile.displayName} triggered an SOS check-in near ${payload.locationLabel}.`,
          category: 'emergency',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `emergencyEvents/${id}`);
    }
  };

  const updateEmergencyStatus = async (id: string, status: EmergencyEvent['status']) => {
    try {
      await updateDoc(doc(db, 'emergencyEvents', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `emergencyEvents/${id}`);
    }
  };

  const publishAdvisory: TravelMateContextValue['publishAdvisory'] = async (adv) => {
    if (!firebaseUser) return;
    const id = makeId('adv');
    try {
      await setDoc(doc(db, 'travelAdvisories', id), {
        authorId: firebaseUser.uid,
        title: sanitizeText(adv.title, 160),
        destination: sanitizeText(adv.destination, 100),
        category: adv.category,
        severity: adv.severity,
        description: sanitizeText(adv.description, 1500),
        sourceType: isAdmin ? adv.sourceType : 'user_report',
        verificationSource: sanitizeText(adv.verificationSource, 160),
        status: adv.status,
        expiresAt: sanitizeText(adv.expiresAt || '', 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `travelAdvisories/${id}`);
    }
  };

  const toggleUserAccountStatus = async (user: UserProfile) => {
    if (!firebaseUser || !isAdmin) return;
    const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        accountStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'adminLogs', makeId('log')), {
        adminId: firebaseUser.uid,
        action: `account_${nextStatus}`,
        targetType: 'user',
        targetId: user.uid,
        details: `Set accountStatus to ${nextStatus}`,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const syncCatalogToFirestore = async () => {
    if (!firebaseUser || !isAdmin) return;
    try {
      const batch = writeBatch(db);
      SEED_DESTINATIONS.forEach((d) => {
        const { id, ...rest } = d;
        batch.set(
          doc(db, 'destinations', id),
          { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'destinations');
    }
  };

  const value: TravelMateContextValue = {
    firebaseUser,
    authReady,
    userProfile,
    needsOnboarding,
    isAdmin,
    destinations,
    publicProfiles,
    tourPackages,
    hotels,
    rooms,
    vehicles,
    localExperiences,
    travelAdvisories,
    travelBuddyRequests,
    travelGroups,
    reviews,
    itineraries,
    bookings,
    expenses,
    favorites,
    notifications,
    conversations,
    verificationRequests,
    emergencyEvents,
    allUsers,
    signIn,
    signOut,
    setPendingSignupDraft,
    completeOnboarding,
    updateProfile,
    toggleFavorite,
    saveItinerary,
    deleteItinerary,
    createBooking,
    updateBookingStatus,
    addExpense,
    deleteExpense,
    createPackage,
    updatePackage,
    deletePackage,
    createHotel,
    createRoom,
    createVehicle,
    updateVehicleAvailability,
    deleteVehicle,
    submitLocalExperience,
    moderateLocalExperience,
    createBuddyRequest,
    createTravelGroup,
    requestJoinGroup,
    startOrOpenConversation,
    sendMessage,
    markNotificationRead,
    submitReview,
    moderateReview,
    submitVerificationRequest,
    decideVerificationRequest,
    triggerEmergencySos,
    updateEmergencyStatus,
    publishAdvisory,
    toggleUserAccountStatus,
    syncCatalogToFirestore,
  };

  return <TravelMateContext.Provider value={value}>{children}</TravelMateContext.Provider>;
}

export function useTravelMate() {
  const ctx = useContext(TravelMateContext);
  if (!ctx) throw new Error('useTravelMate must be used inside TravelMateProvider');
  return ctx;
}

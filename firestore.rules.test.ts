/**
 * Phase 0 Security Specification & Dirty Dozen Verification Suite
 * Documents expected PERMISSION_DENIED invariants for TravelMate Firestore rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list';
  expectedResult: 'PERMISSION_DENIED';
  rationale: string;
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Promotion to Admin',
    collection: 'users/attacker_uid',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'Users cannot self-assign role: admin or verificationStatus: verified.',
    payload: { uid: 'attacker_uid', role: 'admin', verificationStatus: 'verified' },
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Booking',
    collection: 'bookings/book_01',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'keys().hasOnly() rejects unknown ghost fields such as isApprovedByAdmin.',
    payload: { touristId: 'u1', isApprovedByAdmin: true },
  },
  {
    id: 3,
    name: 'Spoofed Tourist Booking',
    collection: 'bookings/book_02',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'touristId must equal request.auth.uid.',
    payload: { touristId: 'victim_uid', providerId: 'guide_1' },
  },
  {
    id: 4,
    name: 'Terminal Booking Mutation',
    collection: 'bookings/book_completed',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'Completed, rejected, or cancelled bookings are locked against non-admin updates.',
    payload: { status: 'pending' },
  },
  {
    id: 5,
    name: 'Unverified Admin Email Spoof',
    collection: 'destinations/hunza',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'Admin checks require request.auth.token.email_verified == true.',
    payload: { name: 'Fake Destination' },
  },
  {
    id: 6,
    name: 'PII Scrape on Users',
    collection: 'users/other_uid',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'PII user documents are readable only by owner or verified admin.',
  },
  {
    id: 7,
    name: 'PII Scrape on Verification Requests',
    collection: 'verificationRequests/req_other',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'CNIC and license info are strictly restricted to applicant and admin.',
  },
  {
    id: 8,
    name: 'Poisoned Document ID',
    collection: 'itineraries/' + 'x'.repeat(200),
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'isValidId enforces ^[a-zA-Z0-9_\\-]+$ and max length 128.',
  },
  {
    id: 9,
    name: 'Spoofed Client Timestamp',
    collection: 'expenses/exp_01',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'createdAt must equal server request.time.',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 10,
    name: 'Fake Review Without Verified Booking',
    collection: 'reviews/rev_01',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'Requires existing confirmed/completed booking owned by request.auth.uid.',
    payload: { bookingId: 'nonexistent_booking', rating: 5 },
  },
  {
    id: 11,
    name: 'Official Advisory Forgery',
    collection: 'travelAdvisories/adv_01',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'Non-admins may only create sourceType: user_report advisories.',
    payload: { sourceType: 'official', title: 'Road Closed' },
  },
  {
    id: 12,
    name: 'Cross-Conversation Message Injection',
    collection: 'conversations/conv_private/messages/msg_01',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    rationale: 'Master Gate checks request.auth.uid in parent conversation participantIds.',
    payload: { senderId: 'attacker_uid', text: 'Unauthorized message' },
  },
];

# TravelMate Firestore Security Specification

## 1. Data Invariants
1. **Identity & Privilege Separation**: Users cannot self-assign `role: 'admin'`, `verificationStatus: 'verified'`, or `accountStatus: 'suspended'`. Only verified administrators (or bootstrapped admin `shahsohailahmad001@gmail.com` with `email_verified == true`) may promote/verify providers or suspend accounts.
2. **PII Isolation**: Sensitive fields (`email`, `phone`, `emergencyContacts`, `cnicReference`, `licenseOrRegInfo`) in `users` and `verificationRequests` are strictly readable only by the document owner and Admin. Public discovery uses `publicProfiles` which excludes all private PII.
3. **Immutable Ownership**: `userId`, `touristId`, `providerId`, `guideId`, `ownerId`, and `createdAt` cannot be changed after document creation.
4. **Temporal Integrity**: All `createdAt` timestamps must equal `request.time` on creation, and `updatedAt` timestamps must equal `request.time` on updates.
5. **Booking Lifecycle Locking**: Once a `booking` reaches a terminal status (`rejected`, `cancelled`, `completed`), non-admin updates are blocked. Tourists can only cancel or submit payment request; providers can only accept, reject, confirm, or complete bookings assigned to them.
6. **Verified Reviews Only**: A review can only be created when `bookingId` points to an existing booking owned by `request.auth.uid` whose status is `confirmed` or `completed`.
7. **Master Gate Subcollections**: Access to `conversations/{id}/messages` and `travelGroups/{id}/members` enforces parent document membership via `get()`.
8. **Secure List Queries**: Private collections (`bookings`, `expenses`, `itineraries`, `notifications`, `favorites`, `verificationRequests`, `emergencyEvents`) restrict `list` queries using `resource.data` ownership checks.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Promotion to Admin**: `users/{uid}` create with `{ role: "admin", verificationStatus: "verified" }` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Booking**: `bookings/{id}` create with extra `{ isApprovedByAdmin: true }` -> `PERMISSION_DENIED`.
3. **Spoofed Tourist Booking**: `bookings/{id}` create by User A with `{ touristId: "userB" }` -> `PERMISSION_DENIED`.
4. **Terminal Booking Mutation**: `bookings/{id}` update when `existing().status == "completed"` -> `PERMISSION_DENIED`.
5. **Unverified Admin Email Spoof**: Request with `token.email == "shahsohailahmad001@gmail.com"` and `email_verified: false` -> `PERMISSION_DENIED`.
6. **PII Scrape on Users**: User A calling `get` or `list` on `users/userB` -> `PERMISSION_DENIED`.
7. **PII Scrape on Verification Requests**: Non-admin User A reading `verificationRequests/{id}` of User B -> `PERMISSION_DENIED`.
8. **Poisoned Document ID**: Creating `itineraries/../../etc/passwd` or 300-char ID -> `PERMISSION_DENIED`.
9. **Spoofed Timestamp**: Creating `expenses/{id}` with client-supplied past `createdAt` (`!= request.time`) -> `PERMISSION_DENIED`.
10. **Fake Review Without Booking**: Creating `reviews/{id}` with nonexistent `bookingId` -> `PERMISSION_DENIED`.
11. **Official Advisory Forgery**: Non-admin creating `travelAdvisories/{id}` with `{ sourceType: "official" }` -> `PERMISSION_DENIED`.
12. **Cross-Conversation Message Injection**: Non-participant writing to `conversations/{id}/messages/{msgId}` -> `PERMISSION_DENIED`.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const BOOTSTRAP_ADMIN_EMAIL = 'shahsohailahmad001@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export function isTopLevelWindow(): boolean {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

export async function signInWithGoogle() {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (
      isTopLevelWindow() &&
      (code === 'auth/popup-blocked' || code === 'auth/web-storage-unsupported')
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function signInWithGoogleRedirect() {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  return signInWithRedirect(auth, googleProvider);
}

export async function resolveGoogleRedirectResult() {
  try {
    return await getRedirectResult(auth);
  } catch (err) {
    console.warn('Redirect sign-in check:', err);
    return null;
  }
}

export function formatFirebaseAuthError(err: unknown): {
  code: string;
  isUnauthorizedDomain: boolean;
  message: string;
} {
  const code = (err as { code?: string })?.code || '';
  const raw = err instanceof Error ? err.message : String(err || 'Unable to sign in with Google.');

  if (code === 'auth/unauthorized-domain' || raw.includes('auth/unauthorized-domain')) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return {
      code: 'auth/unauthorized-domain',
      isUnauthorizedDomain: true,
      message: `Domain "${host}" is not authorized in Firebase Authentication yet. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`,
    };
  }
  if (code === 'auth/popup-blocked') {
    return {
      code,
      isUnauthorizedDomain: false,
      message: 'Your browser blocked the Google sign-in popup. Allow popups or use Redirect Sign-In below.',
    };
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return {
      code,
      isUnauthorizedDomain: false,
      message: 'Sign-in window was closed before completing. Please click Sign In again.',
    };
  }
  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      isUnauthorizedDomain: false,
      message: 'Google Sign-In provider is not enabled in Firebase Authentication Console.',
    };
  }
  return {
    code,
    isUnauthorizedDomain: false,
    message: raw,
  };
}

export async function signOutUser() {
  return signOut(auth);
}

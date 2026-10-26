// ═══════════════════════════════════════════════════════════════════════════
//  FIREBASE CONFIGURATION & SERVICE (Auth & Firestore)
// ═══════════════════════════════════════════════════════════════════════════

import { defaults, setUser } from '../services/gameState.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyCythBSmy4ZYQquOQHn5sZCdj42IQmMWzo',
  authDomain: 'aethelgard-5c566.firebaseapp.com',
  projectId: 'aethelgard-5c566',
  storageBucket: 'aethelgard-5c566.firebasestorage.app',
  messagingSenderId: '511143254128',
  appId: '1:511143254128:web:9703c7e9712238fe27fcb5',
  measurementId: 'G-3DDPZ828M7'
};

export const errorMessages = {
  'auth/invalid-credential': 'Thy credentials hold no power here.',
  'auth/wrong-password': 'Thy credentials hold no power here.',
  'auth/user-not-found': 'Thy credentials hold no power here.',
  'auth/invalid-email': 'That address belongs to no earthly realm.',
  'auth/email-already-in-use': 'A soul is already bound to this address. Return through the first rite.',
  'auth/weak-password': 'Thy secret is frail. Forge it with at least six characters.',
  'auth/password-does-not-meet-requirements': 'Thy secret fails the laws of this realm. Forge a stronger one.',
  'auth/too-many-requests': 'The gate must rest. Wait a while before thy next attempt.',
  'auth/network-request-failed': 'The threads between realms are severed. Check thy connection.',
  'auth/operation-not-allowed': 'The keeper must enable Email/Password in Firebase Authentication.',
  'auth/unauthorized-domain': 'The keeper must authorize this domain in Firebase Authentication.',
  'auth/invalid-api-key': 'The seal of this realm is invalid. The keeper must inspect the Firebase configuration.',
  'permission-denied': 'The archive bars thy passage. The keeper must grant thy soul access through Firestore rules.',
  'unavailable': 'The archive is beyond reach. Restore thy connection and try again.'
};

export function errorText(e) {
  return errorMessages[e?.code] || 'The rite faltered. Try again when the shadows settle.';
}

export let firebase = null;
let initPromise = null;

export async function loadFirebase() {
  if (firebase) return firebase;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const [appModule, authModule, storeModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js')
    ]);

    const instance = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(instance);
    const db = storeModule.getFirestore(instance);

    firebase = {
      ...authModule,
      ...storeModule,
      auth,
      db
    };

    await new Promise(resolve => {
      const unsubscribe = authModule.onAuthStateChanged(auth, u => {
        setUser(u);
        resolve();
        queueMicrotask(unsubscribe);
      });
    });

    console.log('[Firebase] Initialized — auth state resolved');
    return firebase;
  })();

  return initPromise;
}

export const ready = loadFirebase().catch(e => {
  console.error('[Firebase] Load error:', e);
  throw e;
});
ready.catch(() => {});

export async function ensureProfile(uid) {
  const fb = await loadFirebase();
  const ref = fb.doc(fb.db, 'users', uid);
  return fb.runTransaction(fb.db, async tx => {
    const snap = await tx.get(ref);
    if (snap.exists()) return { ...defaults, ...snap.data() };
    tx.set(ref, defaults);
    return { ...defaults };
  });
}

export async function signInUser(email, password) {
  const fb = await loadFirebase();
  const cred = await fb.signInWithEmailAndPassword(fb.auth, email, password);
  setUser(cred.user);
  return cred.user;
}

export async function registerUser(email, password) {
  const fb = await loadFirebase();
  const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, password);
  setUser(cred.user);
  return cred.user;
}

export async function signOutUser() {
  if (!firebase?.auth) return;
  await firebase.signOut(firebase.auth);
  setUser(null);
}

export async function updatePlayerName(uid, name) {
  const fb = await loadFirebase();
  await fb.updateDoc(fb.doc(fb.db, 'users', uid), { name });
}

export async function setFocusStartTime(uid) {
  const fb = await loadFirebase();
  await fb.updateDoc(fb.doc(fb.db, 'users', uid), {
    focusStartTime: fb.serverTimestamp()
  });
}

export async function saveFocusResults(uid, payload) {
  const fb = await loadFirebase();
  await fb.updateDoc(fb.doc(fb.db, 'users', uid), {
    ...payload,
    focusStartTime: fb.deleteField()
  });
}

export async function getUserDocument(uid) {
  const fb = await loadFirebase();
  return fb.getDoc(fb.doc(fb.db, 'users', uid));
}

export async function clearFocusStartTime(uid) {
  const fb = await loadFirebase();
  await fb.updateDoc(fb.doc(fb.db, 'users', uid), {
    focusStartTime: fb.deleteField()
  });
}

export function subscribeInventoryCollection(uid, onData, onError) {
  if (!firebase) return null;
  const colRef = firebase.collection(firebase.db, 'users', uid, 'inventory');
  return firebase.onSnapshot(colRef, onData, onError);
}

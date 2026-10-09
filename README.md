# The Gates of Aethelgard

Complete buildless HTML/CSS/native ES6 game with Firebase 9.23 modular and Phaser 3.80.1. Serve `dist/` over HTTP, not file://. Example: `python -m http.server 4173 --directory dist`.

## Firebase setup

The supplied public Firebase web configuration is already in `dist/app.js`.
1. Enable Email/Password under Firebase Authentication → Sign-in method.
2. Create the default Cloud Firestore database in Native mode.
3. Publish `firestore.rules` in the Firebase Firestore rules editor (merge deliberately if this database has other applications).
4. Add your deployed hostname and `localhost` to Authentication → Settings → Authorized domains. Deployment hostname: `aethelgard-abyssal-gate.magicduck64.chatgpt.site`.

Registration and sign-in use real Firebase accounts. Profiles are created transactionally in `users/{uid}`, without resetting existing stats. Failed profile creation can be retried by signing in; the authentication account may already exist. Name submission waits for a successful Firestore update before continuing. Rules permit only the owner to read the profile and edit their name; future gameplay stat changes need trusted server logic or new rules.

“Witness the awakening” is an explicitly unsaved preview: it creates no account and makes no Firestore writes. Use Continue, Enter, or Space to advance; advancing while text types reveals that line. After the fourth line, enter a name. The final line leads to the white flash, black fade, and Ashen Hamlet title. The hamlet is a completion screen for this requested prologue, not an additional game module.

CDN access is needed for Firebase, Phaser, and optional Google Fonts; serif fallbacks are provided. No administrative Firebase credentials were supplied, so provider enablement, database rules, and a real account round trip must be verified in your Firebase project.

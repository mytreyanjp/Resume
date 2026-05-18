# Resume

This repository contains an Expo React Native app for creating a base resume, tailoring it to a job description with Gemini, and exporting or saving ATS-friendly resume versions.

## What the app currently does

- Signs users in with Google using Expo Auth Session and Firebase Authentication
- Stores a user's base resume in Firestore
- Uses Gemini to tailor resume content to a pasted job description
- Lets users refine the generated resume with follow-up prompts
- Saves confirmed resume versions in Firestore
- Exports resumes as PDF on web, Android, and iOS

## Tech stack

- Expo SDK 52
- React Native 0.76
- React 18
- Firebase Auth
- Firebase Firestore
- Gemini API via `EXPO_PUBLIC_GEMINI_API_KEY`

## Project structure

```text
.
|-- App.js
|-- app.json
|-- babel.config.js
|-- package.json
|-- src/
|   |-- firebaseConfig.js        # local file, required at runtime, gitignored
|   `-- screens/
|       |-- AuthScreen.js
|       |-- FormScreen.js
|       |-- BuilderScreen.js
|       `-- SavedResumesScreen.js
|-- .env                         # local file, required for Gemini, gitignored
`-- .gitignore
```

## Before you start

Install these on your machine:

- Node.js LTS
- npm
- Expo Go on a phone, or an Android emulator / iOS simulator

If you want to build native projects locally, install the usual Android Studio and/or Xcode toolchains too.

## Clone and install

```bash
git clone <your-repo-url>
cd App
npm install
```

## Required local configuration

Two important runtime files are intentionally not meant to come from Git:

- `.env`
- `src/firebaseConfig.js`

That is why the app will not run correctly right after clone until you create them locally.

### 1. Create `.env`

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
```

Notes:

- The app reads this in `src/screens/BuilderScreen.js`
- Because this is an Expo public env var, the name must start with `EXPO_PUBLIC_`
- After changing `.env`, restart the Expo dev server

### 2. Create `src/firebaseConfig.js`

Create [`src/firebaseConfig.js`](/d:/Codes/App/src/firebaseConfig.js) with your own Firebase project values:

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID'
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }
```

You need a Firebase project with:

- Authentication enabled
- Google sign-in provider enabled
- Firestore Database enabled

## Google sign-in setup

Google OAuth client IDs are configured via environment variables.

Update these values inside your `.env` file:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

There is also a generic `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` fallback for `clientId`.

Minimum setup for this app:

1. Create a Firebase project
2. Enable Google as an Auth provider in Firebase Authentication
3. Create OAuth client IDs in Google Cloud / Firebase for the platforms you want to run
4. Paste those client IDs into your `.env` file.

If Google sign-in fails, your `.env` file configuration is the first place to check. Remember to restart the Expo development server after modifying the `.env` file!

## Firestore data used by the app

The app writes to two collections:

- `resumes`
  Stores each user's base resume and the latest tailored draft under the user's UID
- `userResumes`
  Stores confirmed resume versions with `roleName`, `resumeData`, `theme`, and `createdAt`

The core flow is:

1. User signs in with Google
2. User fills in base resume details in `FormScreen`
3. Base resume is saved to Firestore
4. User pastes a job description in `BuilderScreen`
5. Gemini returns tailored `skills` and `projects`
6. User can refine, confirm, and export the result

## Running the app

Start the development server:

```bash
npm start
```

Or run a specific platform:

```bash
npm run android
npm run ios
npm run web
```

## Native folders and `.gitignore`

The current `.gitignore` is set up for an Expo-managed workflow with generated native projects:

- `node_modules/`, `.expo/`, `dist/`, `web-build/`
  Local dependencies and build output
- `.env`, `.env.local`, `.env.*.local`
  API keys and machine-specific env files
- `/android`, `/ios`
  Native folders are intentionally ignored
- `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`
  Signing keys and credentials
- `src/firebaseConfig.js`
  Firebase project secrets stay local

What this means for another developer:

- After cloning, they should expect to create `.env` and `src/firebaseConfig.js` themselves
- They may not get `android/` or `ios/` from Git even if those folders exist on another machine
- If native folders are needed, generate them locally with Expo

Example:

```bash
npx expo prebuild
```

Only do that if you actually want to work with native Android/iOS projects. For normal Expo development, it is not required.

## Troubleshooting

### App starts but sign-in does not work

- Check Firebase Authentication is enabled
- Check Google provider is enabled
- Check the client IDs in `src/screens/AuthScreen.js`
- Restart Expo after changing config

### Tailoring fails with a Gemini error

- Make sure `.env` exists
- Make sure `EXPO_PUBLIC_GEMINI_API_KEY` is valid
- Restart the Expo server after editing `.env`

### Resume save fails

- Check Firestore is enabled
- Check your Firestore security rules
- Check that `src/firebaseConfig.js` points to the correct Firebase project

## Suggested next improvement

Right now secrets and OAuth IDs are split across `.env`, `src/firebaseConfig.js`, and `AuthScreen.js`. A good cleanup would be:

- move all non-secret app config into one documented config module
- add a committed `src/firebaseConfig.example.js`
- add a committed `.env.example`

That would make onboarding from Git much easier for the next developer.

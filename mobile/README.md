# Did You? — Android phone app

**Android-only React Native / Expo app.** This is not a website or WebView wrapper.

## What is implemented

- Swipe Yes / No with spring-back, card exit animation, and native haptics
- A full-height swipe view with Read stories, Save, Skip, Last story, and Undo
- Explore by category or keyword; create new questions with basic duplicate checks
- Permanent question-community screens with fictional sample statistics
- Stories, discussions, likes, and Reddit-style replies to replies
- My Life: private answer history, saved questions, wishlist, and opt-in displayed Dids
- Instagram-style profile: photo picker, bio, Instagram handle, Dids, and highlights
- Android local persistence using AsyncStorage

**Important:** This is an Android implementation of the existing prototype, not a production network. People cannot interact across different phones yet; samples are fictional. AsyncStorage is unencrypted and should **not** hold real sensitive user data. Don't publish this as an open social network until accounts, server data, moderation, reporting, blocking, and security are built.

## Tech stack

- Expo SDK 58 / React Native 0.88 (Android API 36 target)
- React, React Native Animated + PanResponder
- Expo Haptics, Expo ImagePicker, AsyncStorage, react-native-safe-area-context
- EAS builds for APK testing and Google Play Android App Bundles (AAB)

## Run it

```bash
cd mobile
npm install
npx expo start --android
```

For a physical phone without Android Studio, run an APK build first:

```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure -p android
eas build --platform android --profile preview
```

The `preview` profile creates an **APK** you can install directly to test. A build requires an Expo account connected to EAS and signed build credentials. This repository does **not** contain upload keys or account secrets.

## Prepare a Google Play bundle

**First, confirm the permanent Android application ID:** `com.orsmo.didyou` is a provisional placeholder in `app.json`. Check that it is free in Play Console and choose the final package identifier **before the first Play submission**.

```bash
cd mobile
npm install
npx expo-doctor
eas build --platform android --profile production
```

The `production` profile builds an Android **.aab**, not a direct-install APK. After the first Play Console app record is configured, upload it through the Internal or Closed testing track, then complete the relevant policy and production-access checks.

See [PLAY_RELEASE.md](./PLAY_RELEASE.md) for the release checklist.

## What must be implemented next

1. Supabase (or another protected backend) for real accounts, persistent profiles, shared questions, posts and threaded replies.
2. Private answers secured by Row Level Security, with explicit opt-in profile Dids.
3. Reporting, content moderation, abuse handling and blocks.
4. Image hosting, notifications, analytics, crashes, backups, and account deletion.
5. Real Android device testing, signed APK, accessibility, performance and Play policy compliance.

## Existing website

The original root `index.html` and Render site remain an **old prototype/reference only**, not the Android product. The Android app is in this `mobile/` folder. No website is needed to run the app; Google Play may still require a public **privacy policy URL**, which is not a consumer-facing web app.
